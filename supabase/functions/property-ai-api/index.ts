import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Verificação da API Key
  const apiKey = req.headers.get('x-api-key');
  const expectedApiKey = Deno.env.get('AI_API_KEY');

  if (!apiKey || apiKey !== expectedApiKey) {
    return new Response(JSON.stringify({ error: 'Acesso não autorizado: API Key inválida ou ausente.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /property-ai-api/search
  if (req.method === 'POST' && url.pathname.endsWith('/search')) {
    try {
      const { filters } = await req.json();

      let query = supabaseAdmin
        .from('properties')
        .select(`
          id,
          title,
          description,
          purpose,
          status,
          sale_price,
          rental_price,
          total_area,
          built_area,
          bedrooms,
          bathrooms,
          parking_spaces,
          city,
          state,
          neighborhood,
          address_complement,
          property_images ( url, is_cover )
        `)
        .eq('published', true);

      // Aplicar filtros dinamicamente
      if (filters) {
        for (const key in filters) {
          if (filters.hasOwnProperty(key)) {
            query = query.filter(key, 'ilike', `%{filters[key]}%`);
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in property search Edge Function:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /property-ai-api/company/:company_id/status
  if (req.method === 'GET' && url.pathname.includes('/company/') && url.pathname.endsWith('/status')) {
    try {
      const parts = url.pathname.split('/');
      const companyId = parts[parts.length - 2]; // company_id é a penúltima parte da URL

      if (!companyId) {
        return new Response(JSON.stringify({ error: 'Company ID é obrigatório.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('ai_agent_enabled')
        .eq('id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return new Response(JSON.stringify({ error: 'Empresa não encontrada.' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        console.error('Error fetching company status:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ai_agent_enabled: data?.ai_agent_enabled || false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in company status Edge Function:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});
