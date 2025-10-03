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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT token
    let userId: string;
    try {
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
      
      if (!userId) {
        throw new Error('No user ID in token');
      }
    } catch (tokenError) {
      console.error('Token parsing error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { 
      kanzlei_id,
      kunde_id,
      bankkonto_id,
      insolvente_unternehmen_id,
      spedition_id,
      auto_id
    } = await req.json();

    console.log('Generating Kaufvertrag DOCX with:', { kanzlei_id, kunde_id, bankkonto_id, insolvente_unternehmen_id, spedition_id, auto_id });

    // Fetch all required data with user_id filter for RLS
    const [kanzleiResult, kundeResult, bankkontoResult, insoResult, speditionResult, autoResult] = await Promise.all([
      supabase.from('anwaltskanzleien').select('*').eq('id', kanzlei_id).eq('user_id', userId).single(),
      supabase.from('kunden').select('*').eq('id', kunde_id).eq('user_id', userId).single(),
      supabase.from('bankkonten').select('*').eq('id', bankkonto_id).eq('user_id', userId).single(),
      supabase.from('insolvente_unternehmen').select('*').eq('id', insolvente_unternehmen_id).eq('user_id', userId).single(),
      supabase.from('speditionen').select('*').eq('id', spedition_id).eq('user_id', userId).single(),
      supabase.from('autos').select('*').eq('id', auto_id).eq('user_id', userId).single()
    ]);

    if (kanzleiResult.error) throw kanzleiResult.error;
    if (kundeResult.error) throw kundeResult.error;
    if (bankkontoResult.error) throw bankkontoResult.error;
    if (insoResult.error) throw insoResult.error;
    if (speditionResult.error) throw speditionResult.error;
    if (autoResult.error) throw autoResult.error;

    const kanzlei = kanzleiResult.data;
    const kunde = kundeResult.data;
    const bankkonto = bankkontoResult.data;
    const inso = insoResult.data;
    const spedition = speditionResult.data;
    const auto = autoResult.data;

    // Calculate prices
    const nettopreis = auto.einzelpreis_netto || 0;
    const bruttopreis = nettopreis * 1.19;

    // Get amount in words
    const { data: wordsData, error: wordsError } = await supabase.functions.invoke('amount-to-words', {
      body: { amount: nettopreis }
    });

    const nettopreisInWorten = wordsData?.words || 'Fehler bei der Konvertierung';

    // Format data
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    };

    const formatKilometer = (km: number) => {
      return new Intl.NumberFormat('de-DE').format(km);
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${month}/${year}`;
    };

    const formatCurrentDate = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      return `${day}.${month}.${year}`;
    };

    // Prepare JSON data for Docmosis
    const jsonData = {
      kanzlei_name: kanzlei.name || '',
      kanzlei_strasse: kanzlei.strasse || '',
      kanzlei_plz: kanzlei.plz || '',
      kanzlei_stadt: kanzlei.stadt || '',
      kanzlei_telefon: kanzlei.telefon || '',
      kanzlei_fax: kanzlei.fax || '',
      kanzlei_email: kanzlei.email || '',
      kanzlei_website: kanzlei.website || '',
      kanzlei_amtsgericht: kanzlei.registergericht || '',
      kanzlei_register: kanzlei.register_nr || '',
      kanzlei_ustid: kanzlei.ust_id || '',
      kanzlei_anwalt: kanzlei.rechtsanwalt || '',
      
      iban: bankkonto.iban || '',
      bic: bankkonto.bic || '',
      bank: bankkonto.bankname || '',
      
      kunde_unternehmen: kunde.name || '',
      kunde_strasse: kunde.adresse || '',
      kunde_plzstadt: `${kunde.plz || ''} ${kunde.stadt || ''}`.trim(),
      
      datum: formatCurrentDate(),
      aktenzeichen: inso.aktenzeichen || '',
      
      inso_unternehmen: inso.name || '',
      zustaendiges_amtsgericht: inso.amtsgericht || '',
      handelsregister: inso.handelsregister || '',
      inso_adresse: inso.adresse || '',
      
      marke: auto.marke || '',
      modell: auto.modell || '',
      fahrgestellnr: auto.fahrgestell_nr || '',
      dekranr: auto.dekra_bericht_nr || '',
      erstzulassung: formatDate(auto.erstzulassung),
      kilometer: formatKilometer(auto.kilometer || 0),
      einzelpreis: formatPrice(nettopreis),
      
      nettopreis: formatPrice(nettopreis),
      nettopreis_worte: nettopreisInWorten,
      bruttopreis: formatPrice(bruttopreis),
      
      spedition_unternehmen: spedition.name || '',
      spedition_strasse: spedition.strasse || '',
      spedition_plzstadt: spedition.plz_stadt || ''
    };

    console.log('Kaufvertrag JSON data prepared:', jsonData);

    // Call Docmosis to generate DOCX
    const DOCMOSIS_API_KEY = Deno.env.get('DOCMOSIS_API_KEY');
    if (!DOCMOSIS_API_KEY) {
      throw new Error('DOCMOSIS_API_KEY is not configured');
    }

    const formData = new FormData();
    formData.append('accessKey', DOCMOSIS_API_KEY);
    formData.append('templateName', 'Kaufvertrag 1 Fahrzeug Privat.docx');
    formData.append('outputName', 'kaufvertrag.docx');
    formData.append('data', JSON.stringify(jsonData));

    const docmosisResponse = await fetch('https://eu2.dws4.docmosis.com/api/render', {
      method: 'POST',
      body: formData,
    });

    if (!docmosisResponse.ok) {
      const errorText = await docmosisResponse.text();
      console.error('Docmosis error:', errorText);
      throw new Error(`Docmosis error: ${docmosisResponse.status}`);
    }

    const docxBlob = await docmosisResponse.blob();
    const docxBuffer = await docxBlob.arrayBuffer();

    console.log('Kaufvertrag DOCX generated successfully');

    return new Response(docxBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Kaufvertrag_${auto.marke}_${auto.modell}.docx"`,
      },
    });

  } catch (error) {
    console.error('Error in generate-kaufvertrag-docx function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
