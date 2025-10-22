import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed admin user ID for admin@admin.de
const ADMIN_USER_ID = '364d382b-2080-4458-84e9-ddf950b8c2e9';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[create-bestellung-api] Request received', {
      timestamp: new Date().toISOString(),
      method: req.method,
    });

    // Parse request body
    const { kunde, dekra_nummern, rabatt } = await req.json();

    // Validate kunde fields
    if (!kunde?.name || kunde.name.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Kundenname ist erforderlich',
            field: 'kunde.name'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!kunde?.adresse || kunde.adresse.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Adresse ist erforderlich',
            field: 'kunde.adresse'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!kunde?.plz || !/^\d{5}$/.test(kunde.plz)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'PLZ muss genau 5 Ziffern haben',
            field: 'kunde.plz'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!kunde?.stadt || kunde.stadt.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Stadt ist erforderlich',
            field: 'kunde.stadt'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!kunde?.geschaeftsfuehrer || kunde.geschaeftsfuehrer.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Geschäftsführer ist erforderlich',
            field: 'kunde.geschaeftsfuehrer'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dekra_nummern
    if (!Array.isArray(dekra_nummern) || dekra_nummern.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Mindestens eine DEKRA-Nummer erforderlich',
            field: 'dekra_nummern'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate rabatt
    if (typeof rabatt?.aktiv !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rabatt aktiv muss boolean sein',
            field: 'rabatt.aktiv'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rabatt.aktiv && (typeof rabatt.prozent !== 'number' || rabatt.prozent < 0 || rabatt.prozent > 100)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rabatt muss zwischen 0 und 100 liegen',
            field: 'rabatt.prozent'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-bestellung-api] Validation passed', {
      kunde_name: kunde.name,
      dekra_count: dekra_nummern.length,
      rabatt_aktiv: rabatt.aktiv
    });

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auto-detect kunde_typ: privat if name matches geschaeftsfuehrer, else unternehmen
    const kundeTyp = kunde.name.toLowerCase().trim() === kunde.geschaeftsfuehrer.toLowerCase().trim()
      ? 'privat'
      : 'unternehmen';

    console.log('[create-bestellung-api] Detected kunde_typ:', kundeTyp);

    // Create kunde
    const { data: neuerKunde, error: kundeError } = await supabase
      .from('kunden')
      .insert({
        user_id: ADMIN_USER_ID,
        name: kunde.name,
        adresse: kunde.adresse,
        plz: kunde.plz,
        stadt: kunde.stadt,
        geschaeftsfuehrer: kunde.geschaeftsfuehrer
      })
      .select()
      .single();

    if (kundeError) {
      console.error('[create-bestellung-api] Error creating kunde:', kundeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Fehler beim Erstellen des Kunden'
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-bestellung-api] Kunde created:', {
      kunde_id: neuerKunde.id,
      kunde_typ: kundeTyp
    });

    // Keep DEKRA numbers as pure numbers (remove any non-digits)
    const formattierteDekraNummern = dekra_nummern.map((num: string) => {
      return String(num).replace(/\D/g, ''); // nur Zahlen behalten
    });

    console.log('[create-bestellung-api] Cleaned DEKRA numbers:', formattierteDekraNummern);

    // Create bestellung
    const { data: bestellung, error: bestellungError } = await supabase
      .from('bestellungen')
      .insert({
        user_id: ADMIN_USER_ID,
        kunde_id: neuerKunde.id,
        dekra_nummern: formattierteDekraNummern,
        rabatt_aktiv: rabatt.aktiv || false,
        rabatt_prozent: rabatt.aktiv ? rabatt.prozent : null,
        kunde_typ: kundeTyp
      })
      .select()
      .single();

    if (bestellungError) {
      console.error('[create-bestellung-api] Error creating bestellung:', bestellungError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Fehler beim Erstellen der Bestellung'
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-bestellung-api] Bestellung created:', {
      bestellung_id: bestellung.id,
      kunde_id: neuerKunde.id,
      kunde_typ: kundeTyp
    });

    // Generate generator URL
    const origin = req.headers.get('origin') || 'https://your-domain.com';
    const generatorUrl = `${origin}/admin/dokumente-erstellen?bestellung=${bestellung.id}`;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bestellung_id: bestellung.id,
          kunde_id: neuerKunde.id,
          kunde_typ: kundeTyp,
          generator_url: generatorUrl
        },
        message: 'Bestellung erfolgreich erstellt'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[create-bestellung-api] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
