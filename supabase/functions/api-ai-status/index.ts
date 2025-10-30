// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, company_id, api_type')
      .eq('api_key', apiKey)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (apiKeyData.api_type !== 'ai_status') {
        return new Response(JSON.stringify({ error: 'API key does not have permission for this action.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('ai_enabled')
      .eq('id', apiKeyData.company_id)
      .single();

    if (companyError || !companyData) {
        return new Response(JSON.stringify({ error: 'Company not found for this API key.' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Atualiza o last_used_at e incrementa o usage_count
    await supabaseAdmin
        .from('api_keys')
        .update({ 
            last_used_at: new Date().toISOString()
        })
        .eq('api_key', apiKey);

    await supabaseAdmin.rpc('increment_usage_count', { key_id: apiKeyData.id });


    return new Response(JSON.stringify({ ai_enabled: companyData.ai_enabled }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/api-ai-status' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
