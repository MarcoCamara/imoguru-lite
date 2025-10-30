import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

// Initialize Supabase client with service_role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    console.log('Received delete user request for userId:', userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deletar o usuário do sistema de autenticação do Supabase
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log('Result of supabaseAdmin.auth.admin.deleteUser:', authError);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // NOTA: As RLS policies e triggers de cascata no banco de dados devem lidar com a exclusão
    // das entradas correspondentes em 'profiles' e 'user_roles' automaticamente.
    // Se não houver, seria necessário adicioná-las aqui também com supabaseAdmin.from(...).delete().

    const successMessage = 'Usuário deletado com sucesso do sistema de autenticação.';
    console.log(successMessage);
    return new Response(JSON.stringify({ message: successMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('General error in delete-user edge function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
