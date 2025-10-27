import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BankkontoInput {
  user_id: string;
  kontoname: string;
  kontoinhaber: string;
  kontoinhaber_geschlecht?: 'M' | 'W';
  iban: string;
  bic: string;
  bankname: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Incoming request to create-bankkonto-api');

    // Parse request body
    let body: BankkontoInput;
    try {
      body = await req.json();
      console.log('📋 Request body received:', { ...body, iban: body.iban?.substring(0, 6) + '***' });
    } catch (error) {
      console.error('❌ Failed to parse JSON:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    const requiredFields = ['user_id', 'kontoname', 'kontoinhaber', 'iban', 'bic', 'bankname'];
    const missingFields = requiredFields.filter(field => !body[field as keyof BankkontoInput]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields',
          details: `Required fields: ${missingFields.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate user_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.user_id)) {
      console.error('❌ Invalid user_id format:', body.user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid user_id format',
          details: 'user_id must be a valid UUID' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate kontoinhaber_geschlecht
    const geschlecht = body.kontoinhaber_geschlecht || 'M';
    if (geschlecht !== 'M' && geschlecht !== 'W') {
      console.error('❌ Invalid kontoinhaber_geschlecht:', geschlecht);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid kontoinhaber_geschlecht',
          details: 'kontoinhaber_geschlecht must be either "M" or "W"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate IBAN format (basic validation)
    const ibanCleaned = body.iban.replace(/\s/g, '').toUpperCase();
    if (ibanCleaned.length < 15 || ibanCleaned.length > 34 || !/^[A-Z0-9]+$/.test(ibanCleaned)) {
      console.error('❌ Invalid IBAN format:', body.iban);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid IBAN format',
          details: 'IBAN must be 15-34 characters and contain only letters and numbers' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate BIC format
    const bicCleaned = body.bic.replace(/\s/g, '').toUpperCase();
    if (bicCleaned.length < 8 || bicCleaned.length > 11 || !/^[A-Z0-9]+$/.test(bicCleaned)) {
      console.error('❌ Invalid BIC format:', body.bic);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid BIC format',
          details: 'BIC must be 8-11 characters and contain only letters and numbers' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('💾 Attempting to create bankkonto for user:', body.user_id);

    // Insert bankkonto into database
    const { data, error } = await supabase
      .from('bankkonten')
      .insert({
        user_id: body.user_id,
        kontoname: body.kontoname.trim(),
        kontoinhaber: body.kontoinhaber.trim(),
        kontoinhaber_geschlecht: geschlecht,
        iban: ibanCleaned,
        bic: bicCleaned,
        bankname: body.bankname.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create bankkonto',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Bankkonto created successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
