import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json();
    
    console.log('📥 Request received');

    // Basic validation
    if (!input.kunde || !input.bankkonto || !input.insolventes_unternehmen_name || 
        !input.kanzlei_name || !input.dekra_nummern || !input.kontoinhaber_geschlecht) {
      throw new Error('Fehlende Felder');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find entities
    const { data: iu } = await supabase
      .from('insolvente_unternehmen')
      .select('*')
      .ilike('name', input.insolventes_unternehmen_name)
      .limit(1)
      .maybeSingle();

    if (!iu) throw new Error('Insolventes Unternehmen nicht gefunden');

    const { data: kanzlei } = await supabase
      .from('anwaltskanzleien')
      .select('*')
      .ilike('name', input.kanzlei_name)
      .limit(1)
      .maybeSingle();

    if (!kanzlei) throw new Error('Kanzlei nicht gefunden');

    const { data: spedition } = await supabase
      .from('speditionen')
      .select('*')
      .eq('insolventes_unternehmen_id', iu.id)
      .limit(1)
      .maybeSingle();

    if (!spedition) throw new Error('Keine Spedition verknüpft');

    // Find or create Bankkonto
    let { data: bankkonto } = await supabase
      .from('bankkonten')
      .select('*')
      .eq('iban', input.bankkonto.iban)
      .limit(1)
      .maybeSingle();

    if (!bankkonto) {
      const { data: newBk, error } = await supabase
        .from('bankkonten')
        .insert({
          user_id: iu.user_id,
          kontoname: input.bankkonto.kontoinhaber,
          kontoinhaber: input.bankkonto.kontoinhaber,
          iban: input.bankkonto.iban,
          bic: input.bankkonto.bic,
          bankname: input.bankkonto.bankname,
          kontoinhaber_geschlecht: input.kontoinhaber_geschlecht,
        })
        .select()
        .single();

      if (error) throw new Error('Bankkonto Fehler');
      bankkonto = newBk;
    }

    // Find Autos
    const { data: autos } = await supabase
      .from('autos')
      .select('*')
      .in('dekra_bericht_nr', input.dekra_nummern);

    const missing = input.dekra_nummern.filter(d => !autos.some(a => a.dekra_bericht_nr === d));
    if (missing.length > 0) throw new Error(`DEKRA nicht gefunden: ${missing.join(', ')}`);

    console.log('✅ Daten gefunden, generiere Dokumente');

    // Call existing edge functions to generate documents
    const format = input.format || 'DOCX';
    const suffix = format === 'PDF' ? 'pdf' : 'docx';

    // Create temporary kunde if needed
    const { data: tempKunde, error: kundeError } = await supabase
      .from('kunden')
      .insert({
        user_id: iu.user_id,
        name: input.kunde.name,
        geschaeftsfuehrer: input.kunde.geschaeftsfuehrer,
        adresse: input.kunde.adresse,
        plz: input.kunde.plz,
        stadt: input.kunde.stadt,
      })
      .select()
      .single();

    if (kundeError) throw new Error('Kunde erstellen fehlgeschlagen');

    try {
      const docInput = {
        kanzlei_id: kanzlei.id,
        kunde_id: tempKunde.id,
        bankkonto_id: bankkonto.id,
        insolvente_unternehmen_id: iu.id,
        spedition_id: spedition.id,
        auto_ids: autos.map(a => a.id),
        gender: input.kontoinhaber_geschlecht,
      };

      if (input.rabatt?.aktiv) {
        docInput.discounted_autos = autos.map(a => ({
          ...a,
          einzelpreis_netto: a.einzelpreis_netto * (1 - input.rabatt.prozent / 100),
        }));
      }

      const [rRes, kRes, tRes] = await Promise.all([
        supabase.functions.invoke(`generate-rechnung-${suffix}`, { body: docInput }),
        supabase.functions.invoke(`generate-kaufvertrag-${suffix}`, { body: docInput }),
        supabase.functions.invoke(`generate-treuhandvertrag-${suffix}`, { body: docInput }),
      ]);

      if (rRes.error) throw new Error(`Rechnung: ${rRes.error.message}`);
      if (kRes.error) throw new Error(`Kaufvertrag: ${kRes.error.message}`);
      if (tRes.error) throw new Error(`Treuhandvertrag: ${tRes.error.message}`);

      // Delete temporary kunde
      await supabase.from('kunden').delete().eq('id', tempKunde.id);

      return new Response(
        JSON.stringify({
          success: true,
          format,
          documents: {
            rechnung: rRes.data,
            kaufvertrag: kRes.data,
            treuhandvertrag: tRes.data,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (error) {
      // Clean up temp kunde on error
      await supabase.from('kunden').delete().eq('id', tempKunde.id);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Fehler' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
