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
      .eq('api_type', 'properties')
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

    // Buscar imóveis da empresa (sem nome do proprietário e endereço completo)
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        code,
        title,
        description,
        property_type,
        purpose,
        status,
        sale_price,
        rental_price,
        condominium_fee,
        iptu,
        area_total,
        area_built,
        bedrooms,
        bathrooms,
        suites,
        parking_spaces,
        public_address,
        city,
        state,
        neighborhood,
        cep,
        accepts_exchange,
        available_for_partnership,
        property_images(url, is_cover, display_order),
        property_features(feature_name),
        created_at,
        updated_at
      `)
      .eq('company_id', apiKeyData.company_id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (propertiesError) {
      throw propertiesError;
    }

    // Formatar resposta
    const formattedProperties = properties.map(property => ({
      ...property,
      images: property.property_images
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.url) || [],
      features: property.property_features?.map((f: any) => f.feature_name) || [],
      property_images: undefined,
      property_features: undefined,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: formattedProperties.length,
        data: formattedProperties,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in api-properties:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

