import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();
    
    if (amount === null || amount === undefined) {
      throw new Error('Amount is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Converting amount to words:', amount);

    const prompt = `Du bist ein Assistent, der Geldbeträge in deutsche Wörter umwandelt.

WICHTIGE REGELN:
1. Schreibe die Zahl aus, wie sie im Deutschen gesprochen wird
2. Verwende "Euro" für den Euro-Betrag und "Cent" für die Cent-Beträge
3. Verwende "und" zwischen Euro und Cent
4. Bei 0 Cent schreibe "null Cent"
5. Keine Anführungszeichen in der Antwort
6. Kleinschreibung am Anfang
7. Keine zusätzlichen Erklärungen, nur die Wörter
8. Format: "xxxxx Euro und xx Cent"

Beispiele:
- 2158.20 → zweitausendeinhundertachtundfünfzig Euro und zwanzig Cent
- 14203.15 → vierzehntausendzweihundertdrei Euro und fünfzehn Cent
- 1197.00 → eintausendeinhundertsiebenundneunzig Euro und null Cent

Betrag: ${amount} €

Gib NUR die Wörter zurück, nichts anderes.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein Assistent der Zahlen in deutsche Wörter umwandelt. Antworte nur mit den Wörtern, keine zusätzlichen Erklärungen.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const words = data.choices[0].message.content.trim();

    console.log('Amount in words:', words);

    return new Response(
      JSON.stringify({ words }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in amount-to-words function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
