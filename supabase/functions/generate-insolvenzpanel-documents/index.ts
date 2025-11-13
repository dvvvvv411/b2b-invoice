import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOCMOSIS_API_KEY = Deno.env.get('DOCMOSIS_API_KEY');
const DOCMOSIS_URL = 'https://eu1.dws4.docmosis.com/api/render';

// Helper functions
const formatPrice = (value: number | null): string => {
  if (value === null || value === undefined) return '0,00 €';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('€', '').trim() + ' €';
};

const formatKilometer = (km: number | null): string => {
  if (km === null || km === undefined) return '0';
  return new Intl.NumberFormat('de-DE').format(km);
};

const formatErstzulassung = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
};

const formatDatum = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatRechnungsnummer = (nummer: number): string => {
  return String(nummer).padStart(6, '0');
};

const formatIBAN = (iban: string | null): string => {
  if (!iban) return '';
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
};

const getTemplateName = (baseTemplate: string, prefix: string | null): string => {
  if (!prefix || prefix.trim() === '') return baseTemplate;
  return `${prefix.trim()}-${baseTemplate}`;
};

const sanitizeFilename = (name: string): string => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      format,
      kunde,
      bankkonto,
      insolventes_unternehmen_name,
      kanzlei_name,
      dekra_nummern,
      rabatt_prozent,
      rabatt_aktiv
    } = await req.json();

    console.log('Insolvenzpanel request:', { format, insolventes_unternehmen_name, kanzlei_name, dekra_nummern });

    // Validate input
    if (!format || !kunde || !bankkonto || !insolventes_unternehmen_name || !kanzlei_name || !dekra_nummern || dekra_nummern.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Pflichtfelder' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (format !== 'pdf' && format !== 'docx') {
      return new Response(
        JSON.stringify({ error: 'Format muss pdf oder docx sein' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Find entities (GLOBAL, no user_id filter)
    const [insolventResult, kanzleiResult] = await Promise.all([
      supabase.from('insolvente_unternehmen').select('*').ilike('name', insolventes_unternehmen_name).limit(1).single(),
      supabase.from('anwaltskanzleien').select('*').ilike('name', kanzlei_name).limit(1).single()
    ]);

    if (insolventResult.error || !insolventResult.data) {
      console.error('Insolventes Unternehmen not found:', insolventResult.error);
      return new Response(
        JSON.stringify({ error: `Insolventes Unternehmen "${insolventes_unternehmen_name}" nicht gefunden` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (kanzleiResult.error || !kanzleiResult.data) {
      console.error('Kanzlei not found:', kanzleiResult.error);
      return new Response(
        JSON.stringify({ error: `Kanzlei "${kanzlei_name}" nicht gefunden` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const insolvent = insolventResult.data;
    const kanzlei = kanzleiResult.data;

    // Find Spedition via insolventes_unternehmen_id
    const { data: spedition, error: speditionError } = await supabase
      .from('speditionen')
      .select('*')
      .eq('insolventes_unternehmen_id', insolvent.id)
      .limit(1)
      .single();

    if (speditionError || !spedition) {
      console.error('Spedition not found:', speditionError);
      return new Response(
        JSON.stringify({ error: 'Keine Spedition für dieses Insolvente Unternehmen konfiguriert' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create Bankkonto
    const cleanIBAN = bankkonto.iban.replace(/\s/g, '');
    let { data: foundBankkonto } = await supabase
      .from('bankkonten')
      .select('*')
      .eq('iban', cleanIBAN)
      .limit(1)
      .single();

    if (!foundBankkonto) {
      console.log('Creating new Bankkonto');
      const { data: newBankkonto, error: insertError } = await supabase
        .from('bankkonten')
        .insert({
          user_id: insolvent.user_id,
          iban: bankkonto.iban,
          bic: bankkonto.bic,
          kontoinhaber: bankkonto.kontoinhaber,
          kontoname: bankkonto.kontoinhaber,
          bankname: bankkonto.bankname,
          kontoinhaber_geschlecht: bankkonto.kontoinhaber_geschlecht
        })
        .select()
        .single();

      if (insertError || !newBankkonto) {
        console.error('Failed to create Bankkonto:', insertError);
        return new Response(
          JSON.stringify({ error: 'Fehler beim Anlegen des Bankkontos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      foundBankkonto = newBankkonto;
    }

    // Find Autos by DEKRA numbers
    const { data: autos, error: autosError } = await supabase
      .from('autos')
      .select('*')
      .in('dekra_bericht_nr', dekra_nummern);

    if (autosError || !autos || autos.length !== dekra_nummern.length) {
      const gefunden = autos?.map(a => a.dekra_bericht_nr) || [];
      const fehlend = dekra_nummern.filter(nr => !gefunden.includes(nr));
      console.error('DEKRA-Nummern nicht gefunden:', fehlend);
      return new Response(
        JSON.stringify({ error: `DEKRA-Nummern nicht gefunden: ${fehlend.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine kunde type
    const kundeTyp = kunde.unternehmensname === kunde.ansprechpartner ? 'privat' : 'unternehmen';
    
    // Determine template
    const anzahl = autos.length > 1 ? 'M' : '1';
    const typ = kundeTyp === 'privat' ? 'P' : 'U';
    const kaufvertragBaseTemplate = `Kaufvertrag-${anzahl}-${typ}.${format === 'pdf' ? 'pdf' : 'docx'}`;

    // Apply discount if active
    let autosData = autos;
    if (rabatt_aktiv && rabatt_prozent) {
      autosData = autos.map(auto => ({
        ...auto,
        einzelpreis_netto: auto.einzelpreis_netto * (1 - rabatt_prozent / 100)
      }));
    }

    // Generate Rechnungsnummer
    const { data: rnData } = await supabase
      .from('rechnungsnummern')
      .select('*')
      .eq('user_id', insolvent.user_id)
      .maybeSingle();

    let neueNummer = (rnData?.letzte_nummer || 23975) + 1;

    if (rnData) {
      await supabase.from('rechnungsnummern').update({ letzte_nummer: neueNummer }).eq('id', rnData.id);
    } else {
      await supabase.from('rechnungsnummern').insert({ user_id: insolvent.user_id, letzte_nummer: neueNummer });
    }

    const rechnungsnummer = formatRechnungsnummer(neueNummer);

    // Calculate prices
    const einzelpreise = autosData.map(a => a.einzelpreis_netto || 0);
    const nettopreis = einzelpreise.reduce((sum, p) => sum + p, 0);
    const bruttopreis = nettopreis * 1.19;
    const mwst = bruttopreis - nettopreis;

    // Get amount in words for Kaufvertrag
    const { data: wordsData } = await supabase.functions.invoke('amount-to-words', {
      body: { amount: nettopreis }
    });
    const nettopreisInWorten = wordsData?.words || 'Fehler bei der Konvertierung';

    // Prepare Rechnung data
    const rechnungData = {
      kanzlei_name: kanzlei.name,
      kanzlei_strasse: kanzlei.strasse,
      kanzlei_plz: kanzlei.plz,
      kanzlei_stadt: kanzlei.stadt,
      kanzlei_telefon: kanzlei.telefon,
      kanzlei_fax: kanzlei.fax,
      kanzlei_email: kanzlei.email,
      kanzlei_website: kanzlei.website,
      kanzlei_amtsgericht: kanzlei.registergericht,
      kanzlei_register: kanzlei.register_nr,
      kanzlei_ustid: kanzlei.ust_id,
      kanzlei_anwalt: kanzlei.rechtsanwalt,
      iban: formatIBAN(foundBankkonto.iban),
      bic: foundBankkonto.bic,
      bank: foundBankkonto.bankname,
      kontoname: foundBankkonto.kontoname,
      kunde_unternehmen: kunde.unternehmensname,
      kunde_strasse: `${kunde.adresse} ${kunde.hausnummer}`,
      kunde_plzstadt: `${kunde.plz} ${kunde.stadt}`,
      inso_unternehmen: insolvent.name,
      zustaendiges_amtsgericht: insolvent.amtsgericht,
      aktenzeichen: insolvent.aktenzeichen,
      handelsregister: insolvent.handelsregister,
      datum: formatDatum(new Date()),
      rechnungsnummer: rechnungsnummer,
      autos: autosData.map(auto => ({
        marke: auto.marke,
        modell: auto.modell,
        fahrgestellnr: auto.fahrgestell_nr,
        dekranr: auto.dekra_bericht_nr,
        erstzulassung: formatErstzulassung(auto.erstzulassung),
        kilometer: formatKilometer(auto.kilometer)
      })),
      epreis: einzelpreise.map(preis => ({ einzelpreis: formatPrice(preis) })),
      nettopreis: formatPrice(nettopreis),
      mwst: formatPrice(mwst),
      bruttopreis: formatPrice(bruttopreis)
    };

    // Prepare Kaufvertrag data
    const kaufvertragData = {
      kanzlei_name: kanzlei.name,
      kanzlei_strasse: kanzlei.strasse,
      kanzlei_plz: kanzlei.plz,
      kanzlei_stadt: kanzlei.stadt,
      kanzlei_telefon: kanzlei.telefon,
      kanzlei_fax: kanzlei.fax,
      kanzlei_email: kanzlei.email,
      kanzlei_website: kanzlei.website,
      kanzlei_amtsgericht: kanzlei.registergericht,
      kanzlei_register: kanzlei.register_nr,
      kanzlei_ustid: kanzlei.ust_id,
      kanzlei_anwalt: kanzlei.rechtsanwalt,
      iban: formatIBAN(foundBankkonto.iban),
      bic: foundBankkonto.bic,
      bank: foundBankkonto.bankname,
      kunde_unternehmen: kunde.unternehmensname,
      kunde_strasse: `${kunde.adresse} ${kunde.hausnummer}`,
      kunde_plzstadt: `${kunde.plz} ${kunde.stadt}`,
      kunde_geschaeftsfuehrer: kunde.ansprechpartner,
      datum: formatDatum(new Date()),
      aktenzeichen: insolvent.aktenzeichen,
      inso_unternehmen: insolvent.name,
      zustaendiges_amtsgericht: insolvent.amtsgericht,
      handelsregister: insolvent.handelsregister,
      inso_adresse: insolvent.adresse,
      autos: autosData.map(auto => ({
        marke: auto.marke,
        modell: auto.modell,
        fahrgestellnr: auto.fahrgestell_nr,
        dekranr: auto.dekra_bericht_nr,
        erstzulassung: formatErstzulassung(auto.erstzulassung),
        kilometer: formatKilometer(auto.kilometer),
        einzelpreis: formatPrice(auto.einzelpreis_netto || 0)
      })),
      nettopreis: formatPrice(nettopreis),
      nettopreis_worte: nettopreisInWorten,
      bruttopreis: formatPrice(bruttopreis),
      spedition_unternehmen: spedition.name,
      spedition_strasse: spedition.strasse,
      spedition_plzstadt: spedition.plz_stadt
    };

    // Prepare Treuhandvertrag data
    const treuhandBaseTemplate = `Treuhandvertrag-${bankkonto.kontoinhaber_geschlecht}.${format === 'pdf' ? 'pdf' : 'docx'}`;
    const treuhandData = {
      kanzlei_name: kanzlei.name,
      kanzlei_strasse: kanzlei.strasse,
      kanzlei_plz: kanzlei.plz,
      kanzlei_stadt: kanzlei.stadt,
      kanzlei_telefon: kanzlei.telefon,
      kanzlei_fax: kanzlei.fax,
      kanzlei_email: kanzlei.email,
      kanzlei_website: kanzlei.website,
      kanzlei_amtsgericht: kanzlei.registergericht,
      kanzlei_register: kanzlei.register_nr,
      kanzlei_ustid: kanzlei.ust_id,
      kanzlei_anwalt: kanzlei.rechtsanwalt,
      iban: formatIBAN(foundBankkonto.iban),
      bic: foundBankkonto.bic,
      bank: foundBankkonto.bankname,
      kontoinhaber: foundBankkonto.kontoinhaber,
      kunde_unternehmen: kunde.unternehmensname,
      kunde_strasse: `${kunde.adresse} ${kunde.hausnummer}`,
      kunde_plzstadt: `${kunde.plz} ${kunde.stadt}`,
      inso_unternehmen: insolvent.name,
      zustaendiges_amtsgericht: insolvent.amtsgericht,
      aktenzeichen: insolvent.aktenzeichen,
      handelsregister: insolvent.handelsregister,
      datum: formatDatum(new Date()),
      nettopreis: formatPrice(nettopreis)
    };

    console.log('Generating 3 documents in parallel...');

    // Call Docmosis 3 times in parallel
    const [rechnungResponse, kaufvertragResponse, treuhandResponse] = await Promise.all([
      fetch(DOCMOSIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: DOCMOSIS_API_KEY,
          templateName: getTemplateName(`Rechnung.${format === 'pdf' ? 'pdf' : 'docx'}`, kanzlei.docmosis_prefix),
          outputName: `Rechnung_${rechnungsnummer}.${format === 'pdf' ? 'pdf' : 'docx'}`,
          data: rechnungData
        })
      }),
      fetch(DOCMOSIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: DOCMOSIS_API_KEY,
          templateName: getTemplateName(kaufvertragBaseTemplate, kanzlei.docmosis_prefix),
          outputName: `Kaufvertrag ${sanitizeFilename(kunde.unternehmensname)}.${format === 'pdf' ? 'pdf' : 'docx'}`,
          data: kaufvertragData
        })
      }),
      fetch(DOCMOSIS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: DOCMOSIS_API_KEY,
          templateName: getTemplateName(treuhandBaseTemplate, kanzlei.docmosis_prefix),
          outputName: `Treuhandvertrag ${sanitizeFilename(kunde.unternehmensname)}.${format === 'pdf' ? 'pdf' : 'docx'}`,
          data: treuhandData
        })
      })
    ]);

    if (!rechnungResponse.ok || !kaufvertragResponse.ok || !treuhandResponse.ok) {
      const errors = [];
      if (!rechnungResponse.ok) errors.push(`Rechnung: ${rechnungResponse.status}`);
      if (!kaufvertragResponse.ok) errors.push(`Kaufvertrag: ${kaufvertragResponse.status}`);
      if (!treuhandResponse.ok) errors.push(`Treuhandvertrag: ${treuhandResponse.status}`);
      
      console.error('Docmosis errors:', errors);
      return new Response(
        JSON.stringify({ error: 'Fehler bei der Dokumenten-Generierung: ' + errors.join(', ') }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('All documents generated, converting to Base64...');

    // Convert all to Base64
    const [rechnungBuffer, kaufvertragBuffer, treuhandBuffer] = await Promise.all([
      rechnungResponse.arrayBuffer(),
      kaufvertragResponse.arrayBuffer(),
      treuhandResponse.arrayBuffer()
    ]);

    const toBase64 = (buffer: ArrayBuffer) => {
      return btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    };

    const suffix = format === 'pdf' ? 'pdf' : 'docx';

    console.log('Success! Returning 3 documents.');

    return new Response(
      JSON.stringify({
        rechnung: {
          base64: toBase64(rechnungBuffer),
          filename: `Rechnung_${rechnungsnummer}.${suffix}`
        },
        kaufvertrag: {
          base64: toBase64(kaufvertragBuffer),
          filename: `Kaufvertrag ${sanitizeFilename(kunde.unternehmensname)}.${suffix}`
        },
        treuhandvertrag: {
          base64: toBase64(treuhandBuffer),
          filename: `Treuhandvertrag ${sanitizeFilename(kunde.unternehmensname)}.${suffix}`
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-insolvenzpanel-documents:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Interner Serverfehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
