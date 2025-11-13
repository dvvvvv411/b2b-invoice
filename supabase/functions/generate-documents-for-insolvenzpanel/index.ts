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
    
    console.log('📥 Request:', { kunde: input.kunde?.name, format: input.format });

    // Validate
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

    // Find entities
    const [
      { data: insolventesUnternehmen },
      { data: kanzlei }
    ] = await Promise.all([
      supabase.from('insolvente_unternehmen').select('*').ilike('name', input.insolventes_unternehmen_name).limit(1).maybeSingle(),
      supabase.from('anwaltskanzleien').select('*').ilike('name', input.kanzlei_name).limit(1).maybeSingle()
    ]);

    if (!insolventesUnternehmen) throw new Error(`Insolventes Unternehmen nicht gefunden`);
    if (!kanzlei) throw new Error(`Kanzlei nicht gefunden`);

    const { data: spedition } = await supabase
      .from('speditionen')
      .select('*')
      .eq('insolventes_unternehmen_id', insolventesUnternehmen.id)
      .limit(1)
      .maybeSingle();

    if (!spedition) throw new Error(`Keine Spedition verknüpft`);

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

    // Find Autos
    const { data: autos } = await supabase
      .from('autos')
      .select('*')
      .in('dekra_bericht_nr', input.dekra_nummern);

    const missingDekra = input.dekra_nummern.filter(d => 
      !autos.some(a => a.dekra_bericht_nr === d)
    );
    if (missingDekra.length > 0) throw new Error(`DEKRA nicht gefunden: ${missingDekra.join(', ')}`);

    // Generate Rechnungsnummer
    const { data: existingRn } = await supabase
      .from('rechnungsnummern')
      .select('*')
      .eq('user_id', insolventesUnternehmen.user_id)
      .maybeSingle();

    let rechnungsnummer: string;
    if (existingRn) {
      const neueNummer = existingRn.letzte_nummer + 1;
      await supabase.from('rechnungsnummern').update({ letzte_nummer: neueNummer }).eq('id', existingRn.id);
      rechnungsnummer = String(neueNummer).padStart(6, '0');
    } else {
      await supabase.from('rechnungsnummern').insert({ user_id: insolventesUnternehmen.user_id, letzte_nummer: 23976 });
      rechnungsnummer = '023976';
    }

    // Calculate prices
    const autosData = autos.map((auto, i) => {
      const netto = auto.einzelpreis_netto || 0;
      const rabatt = input.rabatt?.aktiv ? (input.rabatt.prozent || 0) : 0;
      const nachRabatt = netto * (1 - rabatt / 100);
      const formatPrice = (n: number) => n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const formatKm = (km: number) => km ? km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
      const formatEz = (d: any) => {
        if (!d) return '';
        const date = new Date(d);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      };

      return {
        POSITION: i + 1,
        MARKE: auto.marke || '',
        MODELL: auto.modell || '',
        FAHRGESTELLNUMMER: auto.fahrgestell_nr || '',
        DEKRA: auto.dekra_bericht_nr || '',
        ERSTZULASSUNG: formatEz(auto.erstzulassung),
        KILOMETERSTAND: formatKm(auto.kilometer),
        EINZELPREIS_NETTO: formatPrice(netto),
        EINZELPREIS_NETTO_NACH_RABATT: formatPrice(nachRabatt),
      };
    });

    const gesamtNetto = autosData.reduce((s, a) => 
      s + parseFloat(a.EINZELPREIS_NETTO_NACH_RABATT.replace(/\./g, '').replace(',', '.')), 0
    );

    // Helper functions
    const formatPrice = (n: number) => n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}.${d.getFullYear()}`;
    };
    const formatIban = (iban: string) => iban ? iban.replace(/(.{4})/g, '$1 ').trim() : '';

    // Templates
    const kundeTyp = input.kunde.name.trim() === input.kunde.geschaeftsfuehrer.trim() ? 'privat' : 'unternehmen';
    const prefix = kanzlei.docmosis_prefix || '';
    const getT = (base: string) => prefix ? `${prefix}-${base}` : base;
    
    const kaufBase = kundeTyp === 'privat' 
      ? (autos.length === 1 ? 'Kaufvertrag-1-P.docx' : 'Kaufvertrag-M-P.docx')
      : (autos.length === 1 ? 'Kaufvertrag-1-U.docx' : 'Kaufvertrag-M-U.docx');

    // Common data
    const common = {
      DATUM: formatDate(new Date()),
      KANZLEI_NAME: kanzlei.name || '',
      KANZLEI_STRASSE: kanzlei.strasse || '',
      KANZLEI_PLZ: kanzlei.plz || '',
      KANZLEI_STADT: kanzlei.stadt || '',
      KANZLEI_TELEFON: kanzlei.telefon || '',
      KANZLEI_FAX: kanzlei.fax || '',
      KANZLEI_EMAIL: kanzlei.email || '',
      KANZLEI_WEBSITE: kanzlei.website || '',
      KANZLEI_RECHTSANWALT: kanzlei.rechtsanwalt || '',
      KANZLEI_REGISTERGERICHT: kanzlei.registergericht || '',
      KANZLEI_REGISTER_NR: kanzlei.register_nr || '',
      KANZLEI_UST_ID: kanzlei.ust_id || '',
      KUNDE_NAME: input.kunde.name || '',
      KUNDE_ADRESSE: input.kunde.adresse || '',
      KUNDE_PLZ: input.kunde.plz || '',
      KUNDE_STADT: input.kunde.stadt || '',
      INSOLVENTES_UNTERNEHMEN_NAME: insolventesUnternehmen.name || '',
      INSOLVENTES_UNTERNEHMEN_AMTSGERICHT: insolventesUnternehmen.amtsgericht || '',
      INSOLVENTES_UNTERNEHMEN_AKTENZEICHEN: insolventesUnternehmen.aktenzeichen || '',
      BANKKONTO_KONTOINHABER: bankkonto.kontoinhaber || '',
      BANKKONTO_IBAN: formatIban(bankkonto.iban),
      BANKKONTO_BIC: bankkonto.bic || '',
      BANKKONTO_BANKNAME: bankkonto.bankname || '',
      AUTOS: autosData,
      RABATT_PROZENT: input.rabatt?.aktiv ? input.rabatt.prozent : 0,
      RABATT_AKTIV: input.rabatt?.aktiv || false,
    };

    // Call Docmosis
    const callDoc = async (template: string, data: any) => {
      const res = await fetch('https://eu1.docmosis.com/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: Deno.env.get('DOCMOSIS_API_KEY'),
          templateName: template,
          outputName: 'output',
          data,
        }),
      });
      if (!res.ok) throw new Error(`Docmosis Error: ${res.statusText}`);
      return await res.arrayBuffer();
    };

    console.log('📝 Generiere Dokumente...');

    // Rechnung
    const mwst = gesamtNetto * 0.19;
    let rechnungBuf = await callDoc(getT('Rechnung.docx'), {
      ...common,
      RECHNUNGSNUMMER: rechnungsnummer,
      RECHNUNGSDATUM: formatDate(new Date()),
      GESAMTPREIS_NETTO: formatPrice(gesamtNetto),
      MWST_BETRAG: formatPrice(mwst),
      GESAMTPREIS_BRUTTO: formatPrice(gesamtNetto + mwst),
    });

    if (input.format === 'PDF') {
      const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');
      const pdf = await PDFDocument.load(rechnungBuf);
      if (pdf.getPageCount() > 1) pdf.removePage(0);
      rechnungBuf = await pdf.save();
    }

    // Kaufvertrag
    const { data: amountWords } = await supabase.functions.invoke('amount-to-words', {
      body: { amount: Math.round(gesamtNetto) },
    });

    const kaufBuf = await callDoc(getT(kaufBase), {
      ...common,
      KUNDE_GESCHAEFTSFUEHRER: input.kunde.geschaeftsfuehrer || '',
      INSOLVENTES_UNTERNEHMEN_HANDELSREGISTER: insolventesUnternehmen.handelsregister || '',
      INSOLVENTES_UNTERNEHMEN_ADRESSE: insolventesUnternehmen.adresse || '',
      SPEDITION_NAME: spedition.name || '',
      SPEDITION_STRASSE: spedition.strasse || '',
      SPEDITION_PLZ_STADT: spedition.plz_stadt || '',
      GESAMTPREIS_NETTO: formatPrice(gesamtNetto),
      GESAMTPREIS_IN_WORTEN: amountWords?.words || '',
    });

    // Treuhandvertrag
    const treuBuf = await callDoc(
      getT(input.kontoinhaber_geschlecht === 'M' ? 'Treuhandvertrag-M.docx' : 'Treuhandvertrag-W.docx'),
      common
    );

    // Response
    const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    const ext = input.format === 'PDF' ? 'pdf' : 'docx';
    const clean = (s: string) => s.replace(/[^a-zA-Z0-9\s]/g, '');

    return new Response(
      JSON.stringify({
        success: true,
        format: input.format,
        documents: {
          rechnung: {
            base64: toB64(rechnungBuf),
            filename: `Rechnung_${rechnungsnummer}.${ext}`,
            rechnungsnummer,
          },
          kaufvertrag: {
            base64: toB64(kaufBuf),
            filename: `Kaufvertrag ${clean(input.kunde.geschaeftsfuehrer || 'Kunde')}.${ext}`,
          },
          treuhandvertrag: {
            base64: toB64(treuBuf),
            filename: `Treuhandvertrag ${clean(input.kunde.name || 'Kunde')}.${ext}`,
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
