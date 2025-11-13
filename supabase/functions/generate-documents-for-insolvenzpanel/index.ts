import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common formatting functions
const formatters = {
  price: (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '0,00';
    return amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
  kilometer: (km: number | null | undefined): string => {
    if (km === null || km === undefined) return '0';
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
  erstzulassung: (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },
  datum: (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  },
  iban: (iban: string | null | undefined): string => {
    if (!iban) return '';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }
};

const prepareAutosData = (autos: any[], rabatt: any) => {
  const autosData = autos.map((auto, index) => {
    const einzelpreisNetto = auto.einzelpreis_netto || 0;
    const rabattProzent = rabatt?.aktiv ? (rabatt.prozent || 0) : 0;
    const einzelpreisNettoNachRabatt = einzelpreisNetto * (1 - rabattProzent / 100);

    return {
      POSITION: index + 1,
      MARKE: auto.marke || '',
      MODELL: auto.modell || '',
      FAHRGESTELLNUMMER: auto.fahrgestell_nr || '',
      DEKRA: auto.dekra_bericht_nr || '',
      ERSTZULASSUNG: formatters.erstzulassung(auto.erstzulassung),
      KILOMETERSTAND: formatters.kilometer(auto.kilometer),
      EINZELPREIS_NETTO: formatters.price(einzelpreisNetto),
      EINZELPREIS_NETTO_NACH_RABATT: formatters.price(einzelpreisNettoNachRabatt),
    };
  });

  const gesamtpreisNetto = autosData.reduce((sum, auto) => {
    return sum + parseFloat(auto.EINZELPREIS_NETTO_NACH_RABATT.replace(/\./g, '').replace(',', '.'));
  }, 0);

  return { autosData, gesamtpreisNetto };
};

const callDocmosis = async (template: string, data: any) => {
  const response = await fetch('https://eu1.docmosis.com/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessKey: Deno.env.get('DOCMOSIS_API_KEY'),
      templateName: template,
      outputName: 'output',
      data,
    }),
  });

  if (!response.ok) throw new Error(`Docmosis API Error: ${response.statusText}`);
  return await response.arrayBuffer();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json();
    
    console.log('📥 Request:', { kunde: input.kunde?.name, format: input.format });

    if (!input.kunde || !input.bankkonto || !input.insolventes_unternehmen_name || 
        !input.kanzlei_name || !input.dekra_nummern || !input.format || !input.kontoinhaber_geschlecht) {
      throw new Error('Fehlende erforderliche Felder');
    }

    if (!['PDF', 'DOCX'].includes(input.format)) {
      throw new Error('Format muss PDF oder DOCX sein');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find entities
    const { data: insolventesUnternehmen } = await supabase
      .from('insolvente_unternehmen')
      .select('*')
      .ilike('name', input.insolventes_unternehmen_name)
      .limit(1)
      .maybeSingle();

    if (!insolventesUnternehmen) {
      throw new Error(`Insolventes Unternehmen "${input.insolventes_unternehmen_name}" nicht gefunden`);
    }

    const { data: kanzlei } = await supabase
      .from('anwaltskanzleien')
      .select('*')
      .ilike('name', input.kanzlei_name)
      .limit(1)
      .maybeSingle();

    if (!kanzlei) throw new Error(`Kanzlei "${input.kanzlei_name}" nicht gefunden`);

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
    const { data: existingBankkonto } = await supabase
      .from('bankkonten')
      .select('*')
      .eq('iban', input.bankkonto.iban)
      .limit(1)
      .maybeSingle();

    let bankkonto;
    if (existingBankkonto) {
      bankkonto = existingBankkonto;
    } else {
      const { data: newBankkonto, error: bankkontoError } = await supabase
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

      if (bankkontoError) throw new Error(`Bankkonto Fehler: ${bankkontoError.message}`);
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

    if (missingDekra.length > 0) {
      throw new Error(`DEKRA-Nummern nicht gefunden: ${missingDekra.join(', ')}`);
    }

    // Determine templates
    const kundeTyp = input.kunde.name.trim() === input.kunde.geschaeftsfuehrer.trim() ? 'privat' : 'unternehmen';
    const getTemplate = (base: string) => kanzlei.docmosis_prefix ? `${kanzlei.docmosis_prefix}-${base}` : base;
    
    const kaufvertragBase = kundeTyp === 'privat' 
      ? (autos.length === 1 ? 'Kaufvertrag-1-P.docx' : 'Kaufvertrag-M-P.docx')
      : (autos.length === 1 ? 'Kaufvertrag-1-U.docx' : 'Kaufvertrag-M-U.docx');

    const templates = {
      rechnung: getTemplate('Rechnung.docx'),
      kaufvertrag: getTemplate(kaufvertragBase),
      treuhandvertrag: getTemplate(input.kontoinhaber_geschlecht === 'M' ? 'Treuhandvertrag-M.docx' : 'Treuhandvertrag-W.docx'),
    };

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

    // Prepare common data
    const { autosData, gesamtpreisNetto } = prepareAutosData(autos, input.rabatt);
    const commonData = {
      DATUM: formatters.datum(new Date()),
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
      BANKKONTO_IBAN: formatters.iban(bankkonto.iban),
      BANKKONTO_BIC: bankkonto.bic || '',
      BANKKONTO_BANKNAME: bankkonto.bankname || '',
      AUTOS: autosData,
      RABATT_PROZENT: input.rabatt?.aktiv ? input.rabatt.prozent : 0,
      RABATT_AKTIV: input.rabatt?.aktiv || false,
    };

    console.log('📝 Generiere Dokumente...');

    // Generate Rechnung
    const mwstBetrag = gesamtpreisNetto * 0.19;
    const rechnungData = {
      ...commonData,
      RECHNUNGSNUMMER: rechnungsnummer,
      RECHNUNGSDATUM: formatters.datum(new Date()),
      GESAMTPREIS_NETTO: formatters.price(gesamtpreisNetto),
      MWST_BETRAG: formatters.price(mwstBetrag),
      GESAMTPREIS_BRUTTO: formatters.price(gesamtpreisNetto + mwstBetrag),
    };

    let rechnungBuffer = await callDocmosis(templates.rechnung, rechnungData);
    if (input.format === 'PDF') {
      const pdf = await PDFDocument.load(rechnungBuffer);
      if (pdf.getPageCount() > 1) pdf.removePage(0);
      rechnungBuffer = await pdf.save();
    }

    // Generate Kaufvertrag
    const { data: amountWords } = await supabase.functions.invoke('amount-to-words', {
      body: { amount: Math.round(gesamtpreisNetto) },
    });

    const kaufvertragData = {
      ...commonData,
      KUNDE_GESCHAEFTSFUEHRER: input.kunde.geschaeftsfuehrer || '',
      INSOLVENTES_UNTERNEHMEN_HANDELSREGISTER: insolventesUnternehmen.handelsregister || '',
      INSOLVENTES_UNTERNEHMEN_ADRESSE: insolventesUnternehmen.adresse || '',
      SPEDITION_NAME: spedition.name || '',
      SPEDITION_STRASSE: spedition.strasse || '',
      SPEDITION_PLZ_STADT: spedition.plz_stadt || '',
      GESAMTPREIS_NETTO: formatters.price(gesamtpreisNetto),
      GESAMTPREIS_IN_WORTEN: amountWords?.words || '',
    };

    const kaufvertragBuffer = await callDocmosis(templates.kaufvertrag, kaufvertragData);

    // Generate Treuhandvertrag
    const treuhandvertragBuffer = await callDocmosis(templates.treuhandvertrag, commonData);

    // Prepare response
    const toBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const ext = input.format === 'PDF' ? 'pdf' : 'docx';
    const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9\s]/g, '');

    return new Response(
      JSON.stringify({
        success: true,
        format: input.format,
        documents: {
          rechnung: {
            base64: toBase64(rechnungBuffer),
            filename: `Rechnung_${rechnungsnummer}.${ext}`,
            rechnungsnummer,
          },
          kaufvertrag: {
            base64: toBase64(kaufvertragBuffer),
            filename: `Kaufvertrag ${sanitize(input.kunde.geschaeftsfuehrer || 'Kunde')}.${ext}`,
          },
          treuhandvertrag: {
            base64: toBase64(treuhandvertragBuffer),
            filename: `Treuhandvertrag ${sanitize(input.kunde.name || 'Kunde')}.${ext}`,
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
