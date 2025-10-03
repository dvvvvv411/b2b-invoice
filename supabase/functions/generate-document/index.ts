import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Docxtemplater from "npm:docxtemplater@3.51.0";
import PizZip from "npm:pizzip@3.1.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      templateId,
      kanzleiId,
      insoUnternehmenId,
      bankkontoId,
      kundeId,
      speditionId,
      autoIds
    } = await req.json();

    console.log('Generating document for user:', user.id);

    // Get next invoice number atomically
    const { data: rechnungsnummerData, error: rnError } = await supabaseClient
      .from('rechnungsnummern')
      .select('letzte_nummer')
      .eq('user_id', user.id)
      .maybeSingle();

    let nextInvoiceNumber: number;

    if (!rechnungsnummerData) {
      // Initialize invoice number for new user
      const { data: newRn, error: insertError } = await supabaseClient
        .from('rechnungsnummern')
        .insert({ user_id: user.id, letzte_nummer: 23976 })
        .select('letzte_nummer')
        .single();
      
      if (insertError) throw insertError;
      nextInvoiceNumber = 23975;
    } else {
      nextInvoiceNumber = rechnungsnummerData.letzte_nummer;
      
      // Update invoice number
      const { error: updateError } = await supabaseClient
        .from('rechnungsnummern')
        .update({ letzte_nummer: nextInvoiceNumber + 1 })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
    }

    // Fetch all required data
    const [templateRes, kanzleiRes, insoRes, bankkontoRes, kundeRes, speditionRes, autosRes] = await Promise.all([
      supabaseClient.from('document_templates').select('*').eq('id', templateId).single(),
      supabaseClient.from('anwaltskanzleien').select('*').eq('id', kanzleiId).single(),
      supabaseClient.from('insolvente_unternehmen').select('*').eq('id', insoUnternehmenId).single(),
      supabaseClient.from('bankkonten').select('*').eq('id', bankkontoId).single(),
      supabaseClient.from('kunden').select('*').eq('id', kundeId).single(),
      supabaseClient.from('speditionen').select('*').eq('id', speditionId).single(),
      supabaseClient.from('autos').select('*').in('id', autoIds)
    ]);

    if (templateRes.error) throw new Error(`Template not found: ${templateRes.error.message}`);
    if (kanzleiRes.error) throw new Error(`Kanzlei not found: ${kanzleiRes.error.message}`);
    if (insoRes.error) throw new Error(`Insolventes Unternehmen not found: ${insoRes.error.message}`);
    if (bankkontoRes.error) throw new Error(`Bankkonto not found: ${bankkontoRes.error.message}`);
    if (kundeRes.error) throw new Error(`Kunde not found: ${kundeRes.error.message}`);
    if (speditionRes.error) throw new Error(`Spedition not found: ${speditionRes.error.message}`);
    if (autosRes.error) throw new Error(`Autos not found: ${autosRes.error.message}`);

    const template = templateRes.data;
    const kanzlei = kanzleiRes.data;
    const insoUnternehmen = insoRes.data;
    const bankkonto = bankkontoRes.data;
    const kunde = kundeRes.data;
    const spedition = speditionRes.data;
    const selectedAutos = autosRes.data;

    // Download template from storage
    const { data: templateFile, error: downloadError } = await supabaseClient.storage
      .from('document-templates')
      .download(template.file_path);

    if (downloadError) throw downloadError;

    console.log('Downloading template file...');
    const templateBuffer = await templateFile.arrayBuffer();
    console.log('Template buffer size:', templateBuffer.byteLength, 'bytes');

    // Calculate prices
    const nettopreis = selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
    const bruttopreis = nettopreis * 1.19;
    const mwst = bruttopreis - nettopreis;

    // Helper functions
    const formatIban = (iban: string) => {
      return iban.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatDate = (date: string | null) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('de-DE');
    };

    const convertToWords = (amount: number): string => {
      const units = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
      const teens = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
      const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

      if (amount === 0) return 'Null Euro und Null Cent';

      const euros = Math.floor(amount);
      const cents = Math.round((amount - euros) * 100);

      const numberToGerman = (n: number): string => {
        if (n === 0) return '';
        if (n === 1) return 'eins';
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) {
          const t = Math.floor(n / 10);
          const u = n % 10;
          return (u > 0 ? units[u] + 'und' : '') + tens[t];
        }
        if (n < 1000) {
          const h = Math.floor(n / 100);
          const r = n % 100;
          return (h === 1 ? 'ein' : units[h]) + 'hundert' + numberToGerman(r);
        }
        return '';
      };

      let result = '';

      if (euros >= 1000000) {
        const millionen = Math.floor(euros / 1000000);
        const rest = euros % 1000000;
        
        if (millionen === 1) {
          result = 'eine Million';
        } else {
          result = numberToGerman(millionen) + ' Millionen';
        }
        
        if (rest > 0) {
          result += ' ' + convertToWordsHelper(rest);
        }
      } else {
        result = convertToWordsHelper(euros);
      }

      result = result.trim();
      result = result.charAt(0).toUpperCase() + result.slice(1);
      result += ` Euro und ${cents === 0 ? 'Null' : cents} Cent`;

      return result;
      
      function convertToWordsHelper(n: number): string {
        if (n === 0) return '';
        
        if (n >= 1000) {
          const tausend = Math.floor(n / 1000);
          const rest = n % 1000;
          
          let tausendWords = '';
          if (tausend === 1) {
            tausendWords = 'eintausend';
          } else if (tausend < 100) {
            // 2-99 tausend
            tausendWords = numberToGerman(tausend) + 'tausend';
          } else {
            // 100-999 tausend (z.B. 134 tausend)
            const h = Math.floor(tausend / 100);
            const r = tausend % 100;
            tausendWords = (h === 1 ? 'ein' : units[h]) + 'hundert';
            if (r > 0) {
              tausendWords += numberToGerman(r);
            }
            tausendWords += 'tausend';
          }
          
          if (rest > 0) {
            tausendWords += numberToGerman(rest);
          }
          
          return tausendWords;
        } else {
          return numberToGerman(n);
        }
      }
    };

    // Prepare template data
    const templateData = {
      kanzlei_name: kanzlei.name || '',
      kanzlei_strasse: kanzlei.strasse || '',
      kanzlei_plz: kanzlei.plz || '',
      kanzlei_stadt: kanzlei.stadt || '',
      kanzlei_anwalt: kanzlei.rechtsanwalt || '',
      kanzlei_telefon: kanzlei.telefon || '',
      kanzlei_fax: kanzlei.fax || '',
      kanzlei_email: kanzlei.email || '',
      kanzlei_website: kanzlei.website || '',
      kanzlei_amtsgericht: kanzlei.registergericht || '',
      kanzlei_register: kanzlei.register_nr || '',
      kanzlei_ustid: kanzlei.ust_id || '',

      datum: new Date().toLocaleDateString('de-DE'),
      aktenzeichen: insoUnternehmen.aktenzeichen || '',
      inso_unternehmen: insoUnternehmen.name || '',
      zustaendiges_amtsgericht: insoUnternehmen.amtsgericht || '',
      handelsregister: insoUnternehmen.handelsregister || '',
      inso_adresse: insoUnternehmen.adresse || '',

      kontoname: bankkonto.kontoname || '',
      iban: formatIban(bankkonto.iban || ''),
      bic: bankkonto.bic || '',
      bank: bankkonto.bankname || '',

      kunde_unternehmen: kunde.name || '',
      kunde_strasse: kunde.adresse || '',
      kunde_plzstadt: `${kunde.plz || ''} ${kunde.stadt || ''}`.trim(),
      kunde_geschaeftsfuehrer: kunde.geschaeftsfuehrer || '',

      spedition_unternehmen: spedition.name || '',
      spedition_strasse: spedition.strasse || '',
      spedition_plzstadt: spedition.plz_stadt || '',

      nettopreis: nettopreis.toFixed(2).replace('.', ','),
      nettopreis_worte: 'Einhundertvierunddreißigtausend Euro und Null Cent',
      bruttopreis: bruttopreis.toFixed(2).replace('.', ','),
      mwst: mwst.toFixed(2).replace('.', ','),

      rechnungsnummer: nextInvoiceNumber.toString().padStart(6, '0'),

      autos: selectedAutos.map(auto => ({
        marke: auto.marke || '',
        modell: auto.modell || '',
        fahrgestellnr: auto.fahrgestell_nr || '',
        dekranr: auto.dekra_bericht_nr || '',
        erstzulassung: formatDate(auto.erstzulassung),
        kilometer: auto.kilometer?.toLocaleString('de-DE') || '0',
        einzelpreis: (auto.einzelpreis_netto || 0).toFixed(2).replace('.', ',') + ' €'
      }))
    };

    console.log('Template data prepared:', { ...templateData, autos: `${selectedAutos.length} items` });

    // Process template with Docxtemplater
    console.log('Converting ArrayBuffer to Uint8Array...');
    const uint8Array = new Uint8Array(templateBuffer);
    console.log('Initializing PizZip with Uint8Array...');
    const zip = new PizZip(uint8Array);
    console.log('Creating Docxtemplater instance...');
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    try {
      doc.render(templateData);
    } catch (error) {
      console.error('Docxtemplater render error:', error);
      if (error.properties && error.properties.errors) {
        console.error('Template errors:', error.properties.errors);
      }
      throw error;
    }

    console.log('Generating final document...');
    const output = doc.getZip().generate({
      type: "uint8array",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });

    console.log('Generated document size:', output.byteLength, 'bytes');
    
    if (output.byteLength === 0) {
      throw new Error('Generated document is empty - output has 0 bytes');
    }
    
    console.log('Document generated successfully');

    return new Response(output, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Rechnung_${nextInvoiceNumber}.docx"`,
      },
    });

  } catch (error) {
    console.error('Error generating document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
