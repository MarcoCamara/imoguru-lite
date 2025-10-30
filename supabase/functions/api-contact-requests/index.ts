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

    // Validar API Key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, company_id, api_type, archived')
      .eq('api_key', apiKey)
      .eq('api_type', 'contact_requests')
      .eq('archived', false)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'API Key inválida ou arquivada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar uso da API Key
    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: supabase.rpc('increment', { row_id: apiKeyData.id })
      })
      .eq('id', apiKeyData.id);

    // Buscar solicitações de contato da empresa
    const { data: contactRequests, error: requestsError } = await supabase
      .from('public_contact_requests')
      .select(`
        id,
        name,
        email,
        phone,
        message,
        created_at,
        responded_at,
        responded_by,
        properties(
          id,
          code,
          title,
          property_type,
          purpose,
          sale_price,
          rental_price,
          public_address,
          city,
          state
        )
      `)
      .eq('company_id', apiKeyData.company_id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      throw requestsError;
    }

    // Formatar resposta
    const formattedRequests = contactRequests.map(request => ({
      id: request.id,
      contact: {
        name: request.name,
        email: request.email,
        phone: request.phone,
      },
      message: request.message,
      property: request.properties ? {
        id: request.properties.id,
        code: request.properties.code,
        title: request.properties.title,
        type: request.properties.property_type,
        purpose: request.properties.purpose,
        sale_price: request.properties.sale_price,
        rental_price: request.properties.rental_price,
        location: {
          public_address: request.properties.public_address,
          city: request.properties.city,
          state: request.properties.state,
        }
      } : null,
      status: request.responded_at ? 'responded' : 'pending',
      created_at: request.created_at,
      responded_at: request.responded_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: formattedRequests.length,
        pending_count: formattedRequests.filter(r => r.status === 'pending').length,
        responded_count: formattedRequests.filter(r => r.status === 'responded').length,
        data: formattedRequests,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-contact-requests:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

