import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sanitizeFilename = (name: string): string => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
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

    const requestBody = await req.json();
    const { 
      kanzlei_id,
      kunde_id,
      bankkonto_id,
      insolvente_unternehmen_id,
      gender
    } = requestBody;

    console.log('Generating Treuhandvertrag DOCX with:', { kanzlei_id, kunde_id, bankkonto_id, insolvente_unternehmen_id, gender });

    if (!gender || (gender !== 'M' && gender !== 'W')) {
      throw new Error('Invalid gender parameter. Must be "M" or "W".');
    }

    // Fetch all required data with user_id filter for RLS
    const [kanzleiResult, kundeResult, bankkontoResult, insoResult] = await Promise.all([
      supabase.from('anwaltskanzleien').select('*').eq('id', kanzlei_id).eq('user_id', userId).single(),
      supabase.from('kunden').select('*').eq('id', kunde_id).eq('user_id', userId).single(),
      supabase.from('bankkonten').select('*').eq('id', bankkonto_id).eq('user_id', userId).single(),
      supabase.from('insolvente_unternehmen').select('*').eq('id', insolvente_unternehmen_id).eq('user_id', userId).single()
    ]);

    if (kanzleiResult.error) throw kanzleiResult.error;
    if (kundeResult.error) throw kundeResult.error;
    if (bankkontoResult.error) throw bankkontoResult.error;
    if (insoResult.error) throw insoResult.error;

    const kanzlei = kanzleiResult.data;
    const kunde = kundeResult.data;
    const bankkonto = bankkontoResult.data;
    const inso = insoResult.data;

    // Format helpers
    const formatCurrentDate = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const formatIBAN = (iban: string | null) => {
      if (!iban) return '';
      const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
      return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
    };

    // Prepare JSON data for Docmosis
    const jsonData = {
      kunde_unternehmen: kunde.name || '',
      kunde_strasse: kunde.adresse || '',
      kunde_plzstadt: `${kunde.plz || ''} ${kunde.stadt || ''}`.trim(),
      kanzlei_name: kanzlei.name || '',
      kanzlei_strasse: kanzlei.strasse || '',
      kanzlei_plz: kanzlei.plz || '',
      kanzlei_stadt: kanzlei.stadt || '',
      aktenzeichen: inso.aktenzeichen || '',
      kontoname: bankkonto.kontoname || '',
      bank: bankkonto.bankname || '',
      iban: formatIBAN(bankkonto.iban),
      bic: bankkonto.bic || '',
      kanzlei_anwalt: kanzlei.rechtsanwalt || '',
      datum: formatCurrentDate()
    };

    console.log('Treuhandvertrag JSON data prepared:', jsonData);

    // Call Docmosis to generate DOCX
    const DOCMOSIS_API_KEY = Deno.env.get('DOCMOSIS_API_KEY');
    if (!DOCMOSIS_API_KEY) {
      throw new Error('DOCMOSIS_API_KEY is not configured');
    }

    const templateName = gender === 'M' ? 'Treuhandvertrag-M.docx' : 'Treuhandvertrag-W.docx';

    const docmosisResponse = await fetch('https://eu1.dws4.docmosis.com/api/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessKey: DOCMOSIS_API_KEY,
        templateName: templateName,
        outputName: 'treuhandvertrag.docx',
        data: jsonData
      })
    });

    if (!docmosisResponse.ok) {
      const errorText = await docmosisResponse.text();
      console.error('Docmosis error:', errorText);
      throw new Error(`Docmosis error: ${docmosisResponse.status}`);
    }

    const docxBuffer = await docmosisResponse.arrayBuffer();
    
    // Convert to Base64 for reliable transmission
    const base64Docx = btoa(
      new Uint8Array(docxBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('Treuhandvertrag DOCX generated successfully');

    const genderLabel = gender === 'M' ? 'Männlich' : 'Weiblich';
    const filename = `Treuhandvertrag ${genderLabel} ${sanitizeFilename(kunde.name)}.docx`;

    return new Response(
      JSON.stringify({ base64: base64Docx, filename }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-treuhandvertrag-docx function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
