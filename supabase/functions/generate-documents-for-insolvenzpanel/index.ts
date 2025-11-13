import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentGenerationInput {
  kunde: {
    name: string;
    geschaeftsfuehrer: string;
    adresse: string;
    plz: string;
    stadt: string;
  };
  bankkonto: {
    kontoinhaber: string;
    iban: string;
    bic: string;
    bankname: string;
  };
  insolventes_unternehmen_name: string;
  kanzlei_name: string;
  dekra_nummern: string[];
  rabatt?: {
    prozent: number;
    aktiv: boolean;
  } | null;
  format: 'PDF' | 'DOCX';
  kontoinhaber_geschlecht: 'M' | 'W';
}

interface DocumentGenerationResponse {
  success: boolean;
  format: 'PDF' | 'DOCX';
  documents: {
    rechnung: {
      base64: string;
      filename: string;
      rechnungsnummer: string;
    };
    kaufvertrag: {
      base64: string;
      filename: string;
    };
    treuhandvertrag: {
      base64: string;
      filename: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: DocumentGenerationInput = await req.json();
    
    console.log('📥 Insolvenzpanel request received:', {
      kunde_name: input.kunde?.name,
      insolventes_unternehmen: input.insolventes_unternehmen_name,
      kanzlei: input.kanzlei_name,
      dekra_count: input.dekra_nummern?.length,
      format: input.format,
    });

    // Validate input
    if (!input.kunde || !input.bankkonto || !input.insolventes_unternehmen_name || 
        !input.kanzlei_name || !input.dekra_nummern || !input.format || 
        !input.kontoinhaber_geschlecht) {
      throw new Error('Fehlende erforderliche Felder im Request');
    }

    if (!['PDF', 'DOCX'].includes(input.format)) {
      throw new Error('Format muss PDF oder DOCX sein');
    }

    if (!Array.isArray(input.dekra_nummern) || input.dekra_nummern.length === 0) {
      throw new Error('dekra_nummern muss ein nicht-leeres Array sein');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find Insolventes Unternehmen
    console.log('🔍 Suche Insolventes Unternehmen:', input.insolventes_unternehmen_name);
    
    const { data: insolventesUnternehmen, error: insolventError } = await supabase
      .from('insolvente_unternehmen')
      .select('*')
      .ilike('name', input.insolventes_unternehmen_name)
      .limit(1)
      .maybeSingle();

    if (insolventError) {
      console.error('❌ Fehler beim Suchen des insolventen Unternehmens:', insolventError);
      throw new Error(`Insolventes Unternehmen konnte nicht gefunden werden: ${insolventError.message}`);
    }

    if (!insolventesUnternehmen) {
      throw new Error(`Insolventes Unternehmen "${input.insolventes_unternehmen_name}" nicht gefunden`);
    }

    console.log('✅ Insolventes Unternehmen gefunden:', insolventesUnternehmen.id);

    // Find Kanzlei
    console.log('🔍 Suche Kanzlei:', input.kanzlei_name);
    
    const { data: kanzlei, error: kanzleiError } = await supabase
      .from('anwaltskanzleien')
      .select('*')
      .ilike('name', input.kanzlei_name)
      .limit(1)
      .maybeSingle();

    if (kanzleiError) {
      console.error('❌ Fehler beim Suchen der Kanzlei:', kanzleiError);
      throw new Error(`Kanzlei konnte nicht gefunden werden: ${kanzleiError.message}`);
    }

    if (!kanzlei) {
      throw new Error(`Kanzlei "${input.kanzlei_name}" nicht gefunden`);
    }

    console.log('✅ Kanzlei gefunden:', kanzlei.id);

    // Find Spedition
    console.log('🔍 Suche Spedition für Insolventes Unternehmen:', insolventesUnternehmen.id);
    
    const { data: spedition, error: speditionError } = await supabase
      .from('speditionen')
      .select('*')
      .eq('insolventes_unternehmen_id', insolventesUnternehmen.id)
      .limit(1)
      .maybeSingle();

    if (speditionError) {
      console.error('❌ Fehler beim Suchen der Spedition:', speditionError);
      throw new Error(`Spedition konnte nicht gefunden werden: ${speditionError.message}`);
    }

    if (!spedition) {
      throw new Error(`Keine Spedition für das insolvente Unternehmen "${insolventesUnternehmen.name}" verknüpft`);
    }

    console.log('✅ Spedition gefunden:', spedition.name);

    // Find or create Bankkonto
    console.log('🔍 Suche/Erstelle Bankkonto:', input.bankkonto.iban);
    
    const { data: existingBankkonto } = await supabase
      .from('bankkonten')
      .select('*')
      .eq('iban', input.bankkonto.iban)
      .limit(1)
      .maybeSingle();

    let bankkonto;

    if (existingBankkonto) {
      console.log('✅ Bankkonto bereits vorhanden:', existingBankkonto.id);
      bankkonto = existingBankkonto;
    } else {
      console.log('➕ Erstelle neues Bankkonto mit user_id:', insolventesUnternehmen.user_id);
      
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

      if (bankkontoError) {
        console.error('❌ Fehler beim Erstellen des Bankkontos:', bankkontoError);
        throw new Error(`Bankkonto konnte nicht erstellt werden: ${bankkontoError.message}`);
      }

      console.log('✅ Neues Bankkonto erstellt:', newBankkonto.id);
      bankkonto = newBankkonto;
    }

    // Find Autos by DEKRA numbers
    console.log('🔍 Suche Autos mit DEKRA-Nummern:', input.dekra_nummern);
    
    const { data: autos, error: autosError } = await supabase
      .from('autos')
      .select('*')
      .in('dekra_bericht_nr', input.dekra_nummern);

    if (autosError) {
      console.error('❌ Fehler beim Suchen der Autos:', autosError);
      throw new Error(`Autos konnten nicht gefunden werden: ${autosError.message}`);
    }

    const foundDekraNummern = autos.map(a => a.dekra_bericht_nr);
    const missingDekra = input.dekra_nummern.filter(d => !foundDekraNummern.includes(d));

    if (missingDekra.length > 0) {
      throw new Error(`DEKRA-Nummern nicht gefunden: ${missingDekra.join(', ')}`);
    }

    console.log('✅ Alle Autos gefunden:', autos.length);

    // Determine customer type
    const kundeTyp: 'privat' | 'unternehmen' = 
      input.kunde.name.trim() === input.kunde.geschaeftsfuehrer.trim() 
        ? 'privat' 
        : 'unternehmen';

    console.log('📋 Kunde-Typ ermittelt:', kundeTyp, {
      name: input.kunde.name,
      geschaeftsfuehrer: input.kunde.geschaeftsfuehrer,
    });

    // Determine template names
    const getTemplateName = (baseTemplate: string, prefix: string | null): string => {
      if (!prefix || prefix.trim() === '') return baseTemplate;
      return `${prefix.trim()}-${baseTemplate}`;
    };

    const anzahlAutos = autos.length;
    let kaufvertragBaseTemplate: string;
    
    if (kundeTyp === 'privat') {
      kaufvertragBaseTemplate = anzahlAutos === 1 
        ? 'Kaufvertrag-1-P.docx' 
        : 'Kaufvertrag-M-P.docx';
    } else {
      kaufvertragBaseTemplate = anzahlAutos === 1 
        ? 'Kaufvertrag-1-U.docx' 
        : 'Kaufvertrag-M-U.docx';
    }
    
    const kaufvertragTemplate = getTemplateName(kaufvertragBaseTemplate, kanzlei.docmosis_prefix);
    const rechnungTemplate = getTemplateName('Rechnung.docx', kanzlei.docmosis_prefix);
    const treuhandvertragBaseTemplate = input.kontoinhaber_geschlecht === 'M' 
      ? 'Treuhandvertrag-M.docx' 
      : 'Treuhandvertrag-W.docx';
    const treuhandvertragTemplate = getTemplateName(treuhandvertragBaseTemplate, kanzlei.docmosis_prefix);

    console.log('📄 Templates bestimmt:', {
      rechnung: rechnungTemplate,
      kaufvertrag: kaufvertragTemplate,
      treuhandvertrag: treuhandvertragTemplate,
    });

    // Generate Rechnungsnummer
    let rechnungsnummer: string;
    
    const { data: existingRechnungsnummer } = await supabase
      .from('rechnungsnummern')
      .select('*')
      .eq('user_id', insolventesUnternehmen.user_id)
      .maybeSingle();

    if (existingRechnungsnummer) {
      const neueNummer = existingRechnungsnummer.letzte_nummer + 1;
      await supabase
        .from('rechnungsnummern')
        .update({ letzte_nummer: neueNummer })
        .eq('id', existingRechnungsnummer.id);
      rechnungsnummer = String(neueNummer).padStart(6, '0');
    } else {
      await supabase
        .from('rechnungsnummern')
        .insert({ user_id: insolventesUnternehmen.user_id, letzte_nummer: 23976 });
      rechnungsnummer = '023976';
    }

    console.log('🔢 Rechnungsnummer generiert:', rechnungsnummer);

    // Generate documents
    console.log('📝 Starte Dokumenten-Generierung...');

    const results = {
      rechnung: null as any,
      kaufvertrag: null as any,
      treuhandvertrag: null as any,
    };

    try {
      // Generate Rechnung
      console.log('📄 Generiere Rechnung...');
      const rechnungData = await generateRechnung({
        kanzlei,
        kunde: input.kunde,
        bankkonto,
        insolventesUnternehmen,
        autos,
        rabatt: input.rabatt,
        rechnungsnummer,
        template: rechnungTemplate,
        format: input.format,
      });
      results.rechnung = rechnungData;
      console.log('✅ Rechnung generiert:', rechnungData.filename);

      // Generate Kaufvertrag
      console.log('📄 Generiere Kaufvertrag...');
      const kaufvertragData = await generateKaufvertrag({
        kanzlei,
        kunde: input.kunde,
        bankkonto,
        insolventesUnternehmen,
        spedition,
        autos,
        rabatt: input.rabatt,
        template: kaufvertragTemplate,
        format: input.format,
        supabase,
      });
      results.kaufvertrag = kaufvertragData;
      console.log('✅ Kaufvertrag generiert:', kaufvertragData.filename);

      // Generate Treuhandvertrag
      console.log('📄 Generiere Treuhandvertrag...');
      const treuhandvertragData = await generateTreuhandvertrag({
        kanzlei,
        kunde: input.kunde,
        bankkonto,
        insolventesUnternehmen,
        template: treuhandvertragTemplate,
        format: input.format,
      });
      results.treuhandvertrag = treuhandvertragData;
      console.log('✅ Treuhandvertrag generiert:', treuhandvertragData.filename);

    } catch (error) {
      console.error('❌ Dokumenten-Generierung fehlgeschlagen:', error);
      throw new Error(`Dokumenten-Generierung fehlgeschlagen: ${error.message}`);
    }

    console.log('✅ Alle Dokumente erfolgreich generiert');

    const response: DocumentGenerationResponse = {
      success: true,
      format: input.format,
      documents: {
        rechnung: {
          base64: results.rechnung.base64,
          filename: results.rechnung.filename,
          rechnungsnummer: rechnungsnummer,
        },
        kaufvertrag: {
          base64: results.kaufvertrag.base64,
          filename: results.kaufvertrag.filename,
        },
        treuhandvertrag: {
          base64: results.treuhandvertrag.base64,
          filename: results.treuhandvertrag.filename,
        },
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Edge Function Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unbekannter Fehler',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function: Generate Rechnung
async function generateRechnung(params: {
  kanzlei: any;
  kunde: any;
  bankkonto: any;
  insolventesUnternehmen: any;
  autos: any[];
  rabatt: any;
  rechnungsnummer: string;
  template: string;
  format: 'PDF' | 'DOCX';
}) {
  const { kanzlei, kunde, bankkonto, insolventesUnternehmen, autos, rabatt, rechnungsnummer, template, format } = params;

  const formatPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '0,00';
    return amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatKilometer = (km: number | null | undefined): string => {
    if (km === null || km === undefined) return '0';
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatErstzulassung = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  const formatDatum = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatIBAN = (iban: string | null | undefined): string => {
    if (!iban) return '';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  let autosData = autos.map((auto, index) => {
    const einzelpreisNetto = auto.einzelpreis_netto || 0;
    const rabattProzent = rabatt?.aktiv ? (rabatt.prozent || 0) : 0;
    const einzelpreisNettoNachRabatt = einzelpreisNetto * (1 - rabattProzent / 100);

    return {
      POSITION: index + 1,
      MARKE: auto.marke || '',
      MODELL: auto.modell || '',
      FAHRGESTELLNUMMER: auto.fahrgestell_nr || '',
      DEKRA: auto.dekra_bericht_nr || '',
      ERSTZULASSUNG: formatErstzulassung(auto.erstzulassung),
      KILOMETERSTAND: formatKilometer(auto.kilometer),
      EINZELPREIS_NETTO: formatPrice(einzelpreisNetto),
      EINZELPREIS_NETTO_NACH_RABATT: formatPrice(einzelpreisNettoNachRabatt),
    };
  });

  const gesamtpreisNetto = autosData.reduce((sum, auto) => {
    const preis = parseFloat(auto.EINZELPREIS_NETTO_NACH_RABATT.replace(/\./g, '').replace(',', '.'));
    return sum + preis;
  }, 0);

  const mwstBetrag = gesamtpreisNetto * 0.19;
  const gesamtpreisBrutto = gesamtpreisNetto + mwstBetrag;

  const jsonData = {
    RECHNUNGSNUMMER: rechnungsnummer,
    RECHNUNGSDATUM: formatDatum(new Date()),
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
    KUNDE_NAME: kunde.name || '',
    KUNDE_ADRESSE: kunde.adresse || '',
    KUNDE_PLZ: kunde.plz || '',
    KUNDE_STADT: kunde.stadt || '',
    INSOLVENTES_UNTERNEHMEN_NAME: insolventesUnternehmen.name || '',
    INSOLVENTES_UNTERNEHMEN_AMTSGERICHT: insolventesUnternehmen.amtsgericht || '',
    INSOLVENTES_UNTERNEHMEN_AKTENZEICHEN: insolventesUnternehmen.aktenzeichen || '',
    BANKKONTO_KONTOINHABER: bankkonto.kontoinhaber || '',
    BANKKONTO_IBAN: formatIBAN(bankkonto.iban),
    BANKKONTO_BIC: bankkonto.bic || '',
    BANKKONTO_BANKNAME: bankkonto.bankname || '',
    AUTOS: autosData,
    GESAMTPREIS_NETTO: formatPrice(gesamtpreisNetto),
    MWST_BETRAG: formatPrice(mwstBetrag),
    GESAMTPREIS_BRUTTO: formatPrice(gesamtpreisBrutto),
    RABATT_PROZENT: rabatt?.aktiv ? rabatt.prozent : 0,
    RABATT_AKTIV: rabatt?.aktiv || false,
  };

  const docmosisApiKey = Deno.env.get('DOCMOSIS_API_KEY');
  const docmosisResponse = await fetch('https://eu1.docmosis.com/api/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessKey: docmosisApiKey,
      templateName: template,
      outputName: 'output',
      data: jsonData,
    }),
  });

  if (!docmosisResponse.ok) {
    throw new Error(`Docmosis API Error: ${docmosisResponse.statusText}`);
  }

  const docmosisBuffer = await docmosisResponse.arrayBuffer();

  let finalBuffer = docmosisBuffer;
  if (format === 'PDF') {
    const pdfDoc = await PDFDocument.load(docmosisBuffer);
    if (pdfDoc.getPageCount() > 1) {
      pdfDoc.removePage(0);
      finalBuffer = await pdfDoc.save();
    }
  }

  const base64 = btoa(String.fromCharCode(...new Uint8Array(finalBuffer)));
  const filename = `Rechnung_${rechnungsnummer}.${format === 'PDF' ? 'pdf' : 'docx'}`;

  return { base64, filename };
}

// Helper function: Generate Kaufvertrag
async function generateKaufvertrag(params: {
  kanzlei: any;
  kunde: any;
  bankkonto: any;
  insolventesUnternehmen: any;
  spedition: any;
  autos: any[];
  rabatt: any;
  template: string;
  format: 'PDF' | 'DOCX';
  supabase: any;
}) {
  const { kanzlei, kunde, bankkonto, insolventesUnternehmen, spedition, autos, rabatt, template, format, supabase } = params;

  const formatPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '0,00';
    return amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatKilometer = (km: number | null | undefined): string => {
    if (km === null || km === undefined) return '0';
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatErstzulassung = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  const formatDatum = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatIBAN = (iban: string | null | undefined): string => {
    if (!iban) return '';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  let autosData = autos.map((auto, index) => {
    const einzelpreisNetto = auto.einzelpreis_netto || 0;
    const rabattProzent = rabatt?.aktiv ? (rabatt.prozent || 0) : 0;
    const einzelpreisNettoNachRabatt = einzelpreisNetto * (1 - rabattProzent / 100);

    return {
      POSITION: index + 1,
      MARKE: auto.marke || '',
      MODELL: auto.modell || '',
      FAHRGESTELLNUMMER: auto.fahrgestell_nr || '',
      DEKRA: auto.dekra_bericht_nr || '',
      ERSTZULASSUNG: formatErstzulassung(auto.erstzulassung),
      KILOMETERSTAND: formatKilometer(auto.kilometer),
      EINZELPREIS_NETTO: formatPrice(einzelpreisNetto),
      EINZELPREIS_NETTO_NACH_RABATT: formatPrice(einzelpreisNettoNachRabatt),
    };
  });

  const gesamtpreisNetto = autosData.reduce((sum, auto) => {
    const preis = parseFloat(auto.EINZELPREIS_NETTO_NACH_RABATT.replace(/\./g, '').replace(',', '.'));
    return sum + preis;
  }, 0);

  const { data: amountInWordsData, error: amountError } = await supabase.functions.invoke('amount-to-words', {
    body: { amount: Math.round(gesamtpreisNetto) },
  });

  if (amountError) {
    throw new Error(`Amount-to-words error: ${amountError.message}`);
  }

  const gesamtpreisInWorten = amountInWordsData?.words || '';

  const jsonData = {
    DATUM: formatDatum(new Date()),
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
    KUNDE_NAME: kunde.name || '',
    KUNDE_GESCHAEFTSFUEHRER: kunde.geschaeftsfuehrer || '',
    KUNDE_ADRESSE: kunde.adresse || '',
    KUNDE_PLZ: kunde.plz || '',
    KUNDE_STADT: kunde.stadt || '',
    INSOLVENTES_UNTERNEHMEN_NAME: insolventesUnternehmen.name || '',
    INSOLVENTES_UNTERNEHMEN_AMTSGERICHT: insolventesUnternehmen.amtsgericht || '',
    INSOLVENTES_UNTERNEHMEN_AKTENZEICHEN: insolventesUnternehmen.aktenzeichen || '',
    INSOLVENTES_UNTERNEHMEN_HANDELSREGISTER: insolventesUnternehmen.handelsregister || '',
    INSOLVENTES_UNTERNEHMEN_ADRESSE: insolventesUnternehmen.adresse || '',
    SPEDITION_NAME: spedition.name || '',
    SPEDITION_STRASSE: spedition.strasse || '',
    SPEDITION_PLZ_STADT: spedition.plz_stadt || '',
    BANKKONTO_KONTOINHABER: bankkonto.kontoinhaber || '',
    BANKKONTO_IBAN: formatIBAN(bankkonto.iban),
    BANKKONTO_BIC: bankkonto.bic || '',
    BANKKONTO_BANKNAME: bankkonto.bankname || '',
    AUTOS: autosData,
    GESAMTPREIS_NETTO: formatPrice(gesamtpreisNetto),
    GESAMTPREIS_IN_WORTEN: gesamtpreisInWorten,
    RABATT_PROZENT: rabatt?.aktiv ? rabatt.prozent : 0,
    RABATT_AKTIV: rabatt?.aktiv || false,
  };

  const docmosisApiKey = Deno.env.get('DOCMOSIS_API_KEY');
  const docmosisResponse = await fetch('https://eu1.docmosis.com/api/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessKey: docmosisApiKey,
      templateName: template,
      outputName: 'output',
      data: jsonData,
    }),
  });

  if (!docmosisResponse.ok) {
    throw new Error(`Docmosis API Error: ${docmosisResponse.statusText}`);
  }

  const docmosisBuffer = await docmosisResponse.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(docmosisBuffer)));

  const sanitizedKundeName = kunde.geschaeftsfuehrer?.replace(/[^a-zA-Z0-9\s]/g, '') || 'Kunde';
  const filename = `Kaufvertrag ${sanitizedKundeName}.${format === 'PDF' ? 'pdf' : 'docx'}`;

  return { base64, filename };
}

// Helper function: Generate Treuhandvertrag
async function generateTreuhandvertrag(params: {
  kanzlei: any;
  kunde: any;
  bankkonto: any;
  insolventesUnternehmen: any;
  template: string;
  format: 'PDF' | 'DOCX';
}) {
  const { kanzlei, kunde, bankkonto, insolventesUnternehmen, template, format } = params;

  const formatDatum = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatIBAN = (iban: string | null | undefined): string => {
    if (!iban) return '';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  const jsonData = {
    DATUM: formatDatum(new Date()),
    KANZLEI_NAME: kanzlei.name || '',
    KANZLEI_STRASSE: kanzlei.strasse || '',
    KANZLEI_PLZ: kanzlei.plz || '',
    KANZLEI_STADT: kanzlei.stadt || '',
    KANZLEI_TELEFON: kanzlei.telefon || '',
    KANZLEI_FAX: kanzlei.fax || '',
    KANZLEI_EMAIL: kanzlei.email || '',
    KANZLEI_WEBSITE: kanzlei.website || '',
    KANZLEI_RECHTSANWALT: kanzlei.rechtsanwalt || '',
    KUNDE_NAME: kunde.name || '',
    KUNDE_ADRESSE: kunde.adresse || '',
    KUNDE_PLZ: kunde.plz || '',
    KUNDE_STADT: kunde.stadt || '',
    INSOLVENTES_UNTERNEHMEN_NAME: insolventesUnternehmen.name || '',
    INSOLVENTES_UNTERNEHMEN_AMTSGERICHT: insolventesUnternehmen.amtsgericht || '',
    INSOLVENTES_UNTERNEHMEN_AKTENZEICHEN: insolventesUnternehmen.aktenzeichen || '',
    BANKKONTO_KONTOINHABER: bankkonto.kontoinhaber || '',
    BANKKONTO_IBAN: formatIBAN(bankkonto.iban),
    BANKKONTO_BIC: bankkonto.bic || '',
    BANKKONTO_BANKNAME: bankkonto.bankname || '',
  };

  const docmosisApiKey = Deno.env.get('DOCMOSIS_API_KEY');
  const docmosisResponse = await fetch('https://eu1.docmosis.com/api/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessKey: docmosisApiKey,
      templateName: template,
      outputName: 'output',
      data: jsonData,
    }),
  });

  if (!docmosisResponse.ok) {
    throw new Error(`Docmosis API Error: ${docmosisResponse.statusText}`);
  }

  const docmosisBuffer = await docmosisResponse.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(docmosisBuffer)));

  const sanitizedKundeName = kunde.name?.replace(/[^a-zA-Z0-9\s]/g, '') || 'Kunde';
  const filename = `Treuhandvertrag ${sanitizedKundeName}.${format === 'PDF' ? 'pdf' : 'docx'}`;

  return { base64, filename };
}
