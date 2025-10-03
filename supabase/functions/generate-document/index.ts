import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

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

    const templateBuffer = await templateFile.arrayBuffer();

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
      const thousands = ['', 'tausend', 'million', 'milliarde'];

      if (amount === 0) return 'Null Euro und Null Cent';

      const euros = Math.floor(amount);
      const cents = Math.round((amount - euros) * 100);

      let result = '';

      // Convert euros
      if (euros >= 1000) {
        const tausend = Math.floor(euros / 1000);
        const rest = euros % 1000;
        
        if (tausend === 1) {
          result = 'eintausend';
        } else if (tausend < 10) {
          result = units[tausend] + 'tausend';
        } else if (tausend < 20) {
          result = teens[tausend - 10] + 'tausend';
        } else {
          const t = Math.floor(tausend / 10);
          const u = tausend % 10;
          result = (u > 0 ? units[u] + 'und' : '') + tens[t] + 'tausend';
        }

        if (rest > 0) {
          if (rest < 10) {
            result += units[rest];
          } else if (rest < 20) {
            result += teens[rest - 10];
          } else if (rest < 100) {
            const t = Math.floor(rest / 10);
            const u = rest % 10;
            result += (u > 0 ? units[u] + 'und' : '') + tens[t];
          } else {
            const h = Math.floor(rest / 100);
            const r = rest % 100;
            result += (h === 1 ? 'ein' : units[h]) + 'hundert';
            if (r > 0) {
              if (r < 10) {
                result += units[r];
              } else if (r < 20) {
                result += teens[r - 10];
              } else {
                const t = Math.floor(r / 10);
                const u = r % 10;
                result += (u > 0 ? units[u] + 'und' : '') + tens[t];
              }
            }
          }
        }
      } else if (euros < 10) {
        result = units[euros];
      } else if (euros < 20) {
        result = teens[euros - 10];
      } else if (euros < 100) {
        const t = Math.floor(euros / 10);
        const u = euros % 10;
        result = (u > 0 ? units[u] + 'und' : '') + tens[t];
      } else {
        const h = Math.floor(euros / 100);
        const r = euros % 100;
        result = (h === 1 ? 'ein' : units[h]) + 'hundert';
        if (r > 0) {
          if (r < 10) {
            result += units[r];
          } else if (r < 20) {
            result += teens[r - 10];
          } else {
            const t = Math.floor(r / 10);
            const u = r % 10;
            result += (u > 0 ? units[u] + 'und' : '') + tens[t];
          }
        }
      }

      result = result.charAt(0).toUpperCase() + result.slice(1);
      result += ` Euro und ${cents === 0 ? 'Null' : cents} Cent`;

      return result;
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
      nettopreis_worte: convertToWords(nettopreis),
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
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(templateData);

    const output = doc.getZip().generate({
      type: "uint8array",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

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
