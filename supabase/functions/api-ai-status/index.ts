import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter API Key do header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key não fornecida. Use o header x-api-key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar API Key - Filtrar por api_type e archived na query (como nas outras APIs)
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, company_id, api_type, archived')
      .eq('api_key', apiKey)
      .eq('api_type', 'ai_status')
      .eq('archived', false)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'API Key inválida ou arquivada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar uso da API Key (como nas outras APIs)
    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq('id', apiKeyData.id);
    
    // Incrementar usage_count usando RPC (se disponível)
    try {
      await supabase.rpc('increment_usage_count', { key_id: apiKeyData.id });
    } catch (rpcError) {
      // Se RPC não existir, tenta incrementar manualmente
      const { data: current } = await supabase
        .from('api_keys')
        .select('usage_count')
        .eq('id', apiKeyData.id)
        .single();
      
      if (current) {
        await supabase
          .from('api_keys')
          .update({ usage_count: (current.usage_count || 0) + 1 })
          .eq('id', apiKeyData.id);
      }
    }

    // Buscar dados da empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('ai_enabled')
      .eq('id', apiKeyData.company_id)
      .single();

    if (companyError || !companyData) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada para esta API Key.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ai_enabled: companyData.ai_enabled || false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-ai-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
