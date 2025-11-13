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
    
    console.log('📥 Insolvenzpanel request:', { kunde: input.kunde?.name, format: input.format });

    // Validate input
    if (!input.kunde || !input.bankkonto || !input.insolventes_unternehmen_name || 
        !input.kanzlei_name || !input.dekra_nummern || !input.format || !input.kontoinhaber_geschlecht) {
      throw new Error('Fehlende erforderliche Felder');
    }

    if (!['PDF', 'DOCX'].includes(input.format)) {
      throw new Error('Format muss PDF oder DOCX sein');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find Insolventes Unternehmen
    const { data: insolventesUnternehmen } = await supabase
      .from('insolvente_unternehmen')
      .select('*')
      .ilike('name', input.insolventes_unternehmen_name)
      .limit(1)
      .maybeSingle();

    if (!insolventesUnternehmen) {
      throw new Error(`Insolventes Unternehmen "${input.insolventes_unternehmen_name}" nicht gefunden`);
    }

    // Find Kanzlei
    const { data: kanzlei } = await supabase
      .from('anwaltskanzleien')
      .select('*')
      .ilike('name', input.kanzlei_name)
      .limit(1)
      .maybeSingle();

    if (!kanzlei) {
      throw new Error(`Kanzlei "${input.kanzlei_name}" nicht gefunden`);
    }

    // Find Spedition
    const { data: spedition } = await supabase
      .from('speditionen')
      .select('*')
      .eq('insolventes_unternehmen_id', insolventesUnternehmen.id)
      .limit(1)
      .maybeSingle();

    if (!spedition) {
      throw new Error(`Keine Spedition für "${insolventesUnternehmen.name}" verknüpft`);
    }

    // Find or create Bankkonto
    let { data: bankkonto } = await supabase
      .from('bankkonten')
      .select('*')
      .eq('iban', input.bankkonto.iban)
      .limit(1)
      .maybeSingle();

    if (!bankkonto) {
      const { data: newBankkonto, error } = await supabase
        .from('bankkonten')
        .insert({
          user_id: insolventesUnternehmen.user_id,
          kontoname: input.bankkonto.kontoinhaber,
          kontoinhaber: input.bankkonto.kontoinhaber,
          iban: input.bankkonto.iban,
          bic: input.bankkonto.bic,
          bankname: input.bankkonto.bankname,
          kontoinhaber_geschlecht: input.kontoinhaber_geschlecht,
        })
        .select()
        .single();

      if (error) throw new Error(`Bankkonto Fehler: ${error.message}`);
      bankkonto = newBankkonto;
    }

    // Find Autos by DEKRA numbers
    const { data: autos } = await supabase
      .from('autos')
      .select('*')
      .in('dekra_bericht_nr', input.dekra_nummern);

    const missingDekra = input.dekra_nummern.filter(d => 
      !autos.some(a => a.dekra_bericht_nr === d)
    );

    if (missingDekra.length > 0) {
      throw new Error(`DEKRA-Nummern nicht gefunden: ${missingDekra.join(', ')}`);
    }

    console.log('✅ Alle Daten gefunden, generiere Dokumente...');

    // Prepare data for document generation
    const kundeData = {
      name: input.kunde.name,
      geschaeftsfuehrer: input.kunde.geschaeftsfuehrer,
      adresse: input.kunde.adresse,
      plz: input.kunde.plz,
      stadt: input.kunde.stadt,
    };

    const documentInput = {
      kanzlei_id: kanzlei.id,
      kunde_id: null, // We're using custom kunde data
      kunde_data: kundeData,
      bankkonto_id: bankkonto.id,
      insolvente_unternehmen_id: insolventesUnternehmen.id,
      spedition_id: spedition.id,
      auto_ids: autos.map(a => a.id),
      rabatt: input.rabatt?.aktiv ? input.rabatt.prozent : null,
      gender: input.kontoinhaber_geschlecht,
    };

    // Determine which functions to call based on format
    const functionSuffix = input.format === 'PDF' ? 'pdf' : 'docx';

    // Call the three document generation functions
    const [rechnungResult, kaufvertragResult, treuhandvertragResult] = await Promise.all([
      supabase.functions.invoke(`generate-rechnung-${functionSuffix}`, {
        body: documentInput,
      }),
      supabase.functions.invoke(`generate-kaufvertrag-${functionSuffix}`, {
        body: documentInput,
      }),
      supabase.functions.invoke(`generate-treuhandvertrag-${functionSuffix}`, {
        body: documentInput,
      }),
    ]);

    // Check for errors
    if (rechnungResult.error) {
      throw new Error(`Rechnung Fehler: ${rechnungResult.error.message}`);
    }
    if (kaufvertragResult.error) {
      throw new Error(`Kaufvertrag Fehler: ${kaufvertragResult.error.message}`);
    }
    if (treuhandvertragResult.error) {
      throw new Error(`Treuhandvertrag Fehler: ${treuhandvertragResult.error.message}`);
    }

    console.log('✅ Alle Dokumente erfolgreich generiert');

    return new Response(
      JSON.stringify({
        success: true,
        format: input.format,
        documents: {
          rechnung: {
            base64: rechnungResult.data.base64,
            filename: rechnungResult.data.filename,
            rechnungsnummer: rechnungResult.data.rechnungsnummer,
          },
          kaufvertrag: {
            base64: kaufvertragResult.data.base64,
            filename: kaufvertragResult.data.filename,
          },
          treuhandvertrag: {
            base64: treuhandvertragResult.data.base64,
            filename: treuhandvertragResult.data.filename,
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unbekannter Fehler' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
