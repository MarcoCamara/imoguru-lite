import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase ausente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key não fornecida. Use o header x-api-key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, company_id, api_type, archived, usage_count')
      .eq('api_key', apiKey)
      .eq('api_type', 'ai_status')
      .eq('archived', false)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'API Key inválida ou arquivada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const newUsageCount = (apiKeyData.usage_count || 0) + 1;

    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: newUsageCount,
      })
      .eq('id', apiKeyData.id);

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('ai_agent_enabled')
      .eq('id', apiKeyData.company_id)
      .single();

    if (companyError || !companyData) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada para esta API Key.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiEnabled = companyData.ai_agent_enabled === true;

    return new Response(
      JSON.stringify({
        status: aiEnabled ? 'active' : 'inactive',
        ai_enabled: aiEnabled,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in api-ai-status:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao verificar o status da IA.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

