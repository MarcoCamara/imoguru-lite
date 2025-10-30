import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ResetPasswordRequest = await req.json();
    console.log('Processing password reset for:', email);

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get system settings for branding
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['app_name', 'logo_url']);

    let appName = 'ImoGuru';
    let logoUrl = '';

    settings?.forEach((item) => {
      if (item.setting_key === 'app_name') {
        appName = item.setting_value as string;
      } else if (item.setting_key === 'logo_url') {
        logoUrl = item.setting_value as string;
      }
    });

    // Generate password reset link using Supabase
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('PUBLIC_FRONTEND_URL') ?? Deno.env.get('SUPABASE_URL')}/reset-password` // Usar PUBLIC_FRONTEND_URL ou SUPABASE_URL
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      throw error;
    }

    console.log('Reset link generated successfully');

    // Build HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
                      ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 120px; height: auto; margin-bottom: 15px;" />` : ''}
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${appName}</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Recuperação de Senha</h2>
                      <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                        Olá,
                      </p>
                      <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                        Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${data.properties.action_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                              Redefinir Senha
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou esta recuperação, pode ignorar este email com segurança.
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; color: #999; font-size: 12px;">
                          Para sua segurança, este link expirará em 1 hora.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        Este email foi enviado automaticamente por ${appName}
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${appName} <onboarding@resend.dev>`,
        to: [email],
        subject: `${appName} - Recuperação de Senha`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error('Failed to send email');
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reset-password-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
