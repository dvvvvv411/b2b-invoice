import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOCMOSIS_API_KEY = Deno.env.get('DOCMOSIS_API_KEY');
const DOCMOSIS_API_URL = 'https://eu1.dws4.docmosis.com/api/render';

// Helper functions for formatting
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Keine Authentifizierung' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT token
    // JWT is already validated by Supabase (verify_jwt = true in config.toml)
    const jwt = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Ungültiges Token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Parse request body
    const { kanzlei_id, kunde_id, bankkonto_id, insolvente_unternehmen_id, auto_ids, discounted_autos } = await req.json();

    // Validate input
    if (!kanzlei_id || !kunde_id || !bankkonto_id || !insolvente_unternehmen_id || !auto_ids || auto_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bitte wählen Sie alle erforderlichen Daten aus' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching data for user:', userId);

    // Fetch all data in parallel
    const [kanzleiResult, kundeResult, bankkontoResult, insolventResult, autosResult, rechnungsnummerResult] = await Promise.all([
      supabase.from('anwaltskanzleien').select('*').eq('id', kanzlei_id).eq('user_id', userId).single(),
      supabase.from('kunden').select('*').eq('id', kunde_id).eq('user_id', userId).single(),
      supabase.from('bankkonten').select('*').eq('id', bankkonto_id).eq('user_id', userId).single(),
      supabase.from('insolvente_unternehmen').select('*').eq('id', insolvente_unternehmen_id).eq('user_id', userId).single(),
      supabase.from('autos').select('*').in('id', auto_ids).eq('user_id', userId),
      supabase.from('rechnungsnummern').select('*').eq('user_id', userId).maybeSingle()
    ]);

    // Check for errors
    if (kanzleiResult.error) {
      console.error('Kanzlei error:', kanzleiResult.error);
      return new Response(
        JSON.stringify({ error: 'Kanzlei nicht gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (kundeResult.error) {
      console.error('Kunde error:', kundeResult.error);
      return new Response(
        JSON.stringify({ error: 'Kunde nicht gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (bankkontoResult.error) {
      console.error('Bankkonto error:', bankkontoResult.error);
      return new Response(
        JSON.stringify({ error: 'Bankkonto nicht gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (insolventResult.error) {
      console.error('Insolvente Unternehmen error:', insolventResult.error);
      return new Response(
        JSON.stringify({ error: 'Insolventes Unternehmen nicht gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (autosResult.error || !autosResult.data || autosResult.data.length === 0) {
      console.error('Autos error:', autosResult.error);
      return new Response(
        JSON.stringify({ error: 'Keine Autos gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kanzlei = kanzleiResult.data;
    const kunde = kundeResult.data;
    const bankkonto = bankkontoResult.data;
    const insolvent = insolventResult.data;
    
    // Use discounted autos if provided, otherwise use DB autos
    const autos = discounted_autos && discounted_autos.length > 0 ? discounted_autos : autosResult.data;

    // Get or create rechnungsnummer
    let currentNummer = rechnungsnummerResult.data?.letzte_nummer || 23975;
    const neueNummer = currentNummer + 1;

    // Update rechnungsnummer
    if (rechnungsnummerResult.data) {
      const { error: updateError } = await supabase
        .from('rechnungsnummern')
        .update({ letzte_nummer: neueNummer })
        .eq('id', rechnungsnummerResult.data.id);
      
      if (updateError) {
        console.error('Update rechnungsnummer error:', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('rechnungsnummern')
        .insert({ user_id: userId, letzte_nummer: neueNummer });
      
      if (insertError) {
        console.error('Insert rechnungsnummer error:', insertError);
      }
    }

    const rechnungsnummer = formatRechnungsnummer(neueNummer);

    console.log('Generated Rechnungsnummer:', rechnungsnummer);

    // Calculate prices
    const einzelpreise = autos.map(a => a.einzelpreis_netto || 0);
    const nettopreis = einzelpreise.reduce((sum, p) => sum + p, 0);
    const bruttopreis = nettopreis * 1.19;
    const mwst = bruttopreis - nettopreis;

    // Build JSON data for Docmosis
    const jsonData = {
      // Kanzlei
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
      
      // Bankkonto
      iban: bankkonto.iban,
      bic: bankkonto.bic,
      bank: bankkonto.bankname,
      kontoname: bankkonto.kontoname,
      
      // Kunde
      kunde_unternehmen: kunde.name,
      kunde_strasse: kunde.adresse,
      kunde_plzstadt: `${kunde.plz} ${kunde.stadt}`,
      
      // Insolvente Unternehmen
      inso_unternehmen: insolvent.name,
      zustaendiges_amtsgericht: insolvent.amtsgericht,
      aktenzeichen: insolvent.aktenzeichen,
      handelsregister: insolvent.handelsregister,
      
      // System
      datum: formatDatum(new Date()),
      rechnungsnummer: rechnungsnummer,
      
      // Autos
      autos: autos.map(auto => ({
        marke: auto.marke,
        modell: auto.modell,
        fahrgestellnr: auto.fahrgestell_nr,
        dekranr: auto.dekra_bericht_nr,
        erstzulassung: formatErstzulassung(auto.erstzulassung),
        kilometer: formatKilometer(auto.kilometer)
      })),
      
      // Preise
      epreis: einzelpreise.map(preis => ({
        einzelpreis: formatPrice(preis)
      })),
      nettopreis: formatPrice(nettopreis),
      mwst: formatPrice(mwst),
      bruttopreis: formatPrice(bruttopreis)
    };

    console.log('Calling Docmosis API for DOCX...');

    // Call Docmosis API - will return binary DOCX directly
    const docmosisResponse = await fetch(DOCMOSIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessKey: DOCMOSIS_API_KEY,
        templateName: 'Rechnung.docx',
        outputName: `Rechnung_${rechnungsnummer}.docx`,
        data: jsonData
      })
    });

    if (!docmosisResponse.ok) {
      const errorText = await docmosisResponse.text();
      console.error('Docmosis API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Fehler bei der DOCX-Generierung', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get binary DOCX data and convert to base64
    const docxBuffer = await docmosisResponse.arrayBuffer();
    const base64Docx = btoa(
      new Uint8Array(docxBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    console.log('DOCX generated successfully');

    return new Response(
      JSON.stringify({ 
        base64: base64Docx,
        rechnungsnummer: rechnungsnummer 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-rechnung-docx function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Interner Serverfehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});