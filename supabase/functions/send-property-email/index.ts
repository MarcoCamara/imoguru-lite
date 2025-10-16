import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PropertyEmailRequest {
  to: string;
  property: {
    title: string;
    code: string;
    description?: string;
    property_type?: string;
    purpose?: string;
    city?: string;
    neighborhood?: string;
    bedrooms?: number;
    suites?: number;
    bathrooms?: number;
    parking_spaces?: number;
    useful_area?: number;
    total_area?: number;
    sale_price?: number;
    rental_price?: number;
    iptu_price?: number;
    condo_price?: number;
  };
  images: string[];
  appName: string;
  logoUrl?: string;
  emailTemplate?: string;
}

const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const generateEmailHTML = (data: PropertyEmailRequest): string => {
  const { property, images, appName, logoUrl, to } = data;
  const propertyUrl = `${Deno.env.get('VITE_SUPABASE_URL') || ''}/property/${property.title}`;
  
  const imagesHTML = images.slice(0, 4).map((url, idx) => `
    ${(idx % 2 === 0) ? '<tr>' : ''}
    <td style="width: 48%; padding: 6px; ${(idx + 1) % 2 === 0 ? '' : 'padding-right: 4%;'}">
      <img src="${url}" alt="Imagem ${idx + 1}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block;" />
    </td>
    ${(idx + 1) % 2 === 0 ? '</tr>' : ''}
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Imóvel - ${appName}</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 15px !important; }
            .image-grid { display: block !important; }
            .image-grid img { width: 100% !important; margin-bottom: 10px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 180px; height: auto; margin-bottom: 20px; border-radius: 8px;" />` : ''}
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${property.title}</h1>
                    <p style="margin: 15px 0 0; color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 500;">${property.purpose}</p>
                  </td>
                </tr>

                <!-- Price -->
                <tr>
                  <td style="padding: 35px 30px; text-align: center; background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);">
                    <p style="margin: 0; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Valor</p>
                    <p style="margin: 15px 0 0; font-size: 42px; color: #667eea; font-weight: 800; letter-spacing: -1px;">
                      ${property.sale_price ? formatPrice(property.sale_price) : property.rental_price ? formatPrice(property.rental_price) + '/mês' : 'Consulte'}
                    </p>
                  </td>
                </tr>

                <!-- Images -->
                ${images.length > 0 ? `
                <tr>
                  <td class="content" style="padding: 30px;">
                    <h2 style="margin: 0 0 20px; font-size: 22px; color: #333; font-weight: 700;">📸 Galeria de Fotos</h2>
                    <table role="presentation" class="image-grid" style="width: 100%; border-collapse: collapse;">
                      ${imagesHTML}
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Characteristics -->
                <tr>
                  <td class="content" style="padding: 30px; background-color: #fafbfc;">
                    <h2 style="margin: 0 0 25px; font-size: 22px; color: #333; font-weight: 700;">✨ Características</h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                      <tr>
                        ${property.bedrooms ? `<td style="padding: 20px; width: 33%; text-align: center; border-right: 1px solid #f0f0f0;">
                          <div style="font-size: 32px; margin-bottom: 8px;">🛏️</div>
                          <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 4px;">${property.bedrooms}</div>
                          <div style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Quartos</div>
                        </td>` : ''}
                        ${property.bathrooms ? `<td style="padding: 20px; width: 33%; text-align: center; border-right: 1px solid #f0f0f0;">
                          <div style="font-size: 32px; margin-bottom: 8px;">🚿</div>
                          <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 4px;">${property.bathrooms}</div>
                          <div style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Banheiros</div>
                        </td>` : ''}
                        ${property.useful_area ? `<td style="padding: 20px; width: 33%; text-align: center;">
                          <div style="font-size: 32px; margin-bottom: 8px;">📐</div>
                          <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 4px;">${property.useful_area}</div>
                          <div style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">m²</div>
                        </td>` : ''}
                      </tr>
                      ${property.suites || property.parking_spaces ? `
                      <tr>
                        ${property.suites ? `<td style="padding: 20px; text-align: center; border-right: 1px solid #f0f0f0; border-top: 1px solid #f0f0f0;">
                          <div style="font-size: 32px; margin-bottom: 8px;">⭐</div>
                          <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 4px;">${property.suites}</div>
                          <div style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Suítes</div>
                        </td>` : '<td style="border-top: 1px solid #f0f0f0;"></td>'}
                        ${property.parking_spaces ? `<td style="padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;" colspan="2">
                          <div style="font-size: 32px; margin-bottom: 8px;">🚗</div>
                          <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 4px;">${property.parking_spaces}</div>
                          <div style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Vagas</div>
                        </td>` : '<td style="border-top: 1px solid #f0f0f0;" colspan="2"></td>'}
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>

                <!-- Location -->
                ${property.neighborhood || property.city ? `
                <tr>
                  <td class="content" style="padding: 30px;">
                    <h2 style="margin: 0 0 20px; font-size: 22px; color: #333; font-weight: 700;">📍 Localização</h2>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
                      <p style="margin: 0; font-size: 16px; color: #555; line-height: 1.8;">
                        ${property.neighborhood ? `<strong>${property.neighborhood}</strong><br>` : ''}
                        ${property.city || ''}
                      </p>
                    </div>
                  </td>
                </tr>
                ` : ''}


                <!-- Description -->
                ${property.description ? `
                <tr>
                  <td class="content" style="padding: 30px; background-color: #fafbfc;">
                    <h2 style="margin: 0 0 20px; font-size: 22px; color: #333; font-weight: 700;">📝 Descrição</h2>
                    <p style="margin: 0; font-size: 16px; color: #555; line-height: 1.8;">${property.description}</p>
                  </td>
                </tr>
                ` : ''}

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <a href="${propertyUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Ver Imóvel Completo
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%); border-top: 1px solid #dee2e6;">
                    <p style="margin: 0 0 15px; font-size: 15px; color: #666; font-weight: 600;">
                      📧 Este email foi enviado por <strong>${appName}</strong>
                    </p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #888;">
                      Entre em contato para mais informações
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #aaa;">
                      © ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.
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
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, property, images, appName, logoUrl, emailTemplate }: PropertyEmailRequest = await req.json();

    console.log('Sending property email to:', to);
    console.log('Using custom template:', !!emailTemplate);

    let html = '';

    // If custom template provided, use it
    if (emailTemplate) {
      html = emailTemplate
        .replace(/\{\{?title\}?\}/g, property.title || '')
        .replace(/\{\{?code\}?\}/g, property.code || '')
        .replace(/\{\{?description\}?\}/g, property.description || '')
        .replace(/\{\{?property_type\}?\}/g, property.property_type || '')
        .replace(/\{\{?purpose\}?\}/g, property.purpose || '')
        .replace(/\{\{?city\}?\}/g, property.city || '')
        .replace(/\{\{?neighborhood\}?\}/g, property.neighborhood || '')
        .replace(/\{\{?bedrooms\}?\}/g, property.bedrooms?.toString() || '0')
        .replace(/\{\{?suites\}?\}/g, property.suites?.toString() || '0')
        .replace(/\{\{?bathrooms\}?\}/g, property.bathrooms?.toString() || '0')
        .replace(/\{\{?parking_spaces\}?\}/g, property.parking_spaces?.toString() || '0')
        .replace(/\{\{?total_area\}?\}/g, property.total_area?.toString() || '')
        .replace(/\{\{?useful_area\}?\}/g, property.useful_area?.toString() || '')
        .replace(/\{\{?sale_price\}?\}/g, property.sale_price ? formatPrice(property.sale_price) : '')
        .replace(/\{\{?rental_price\}?\}/g, property.rental_price ? formatPrice(property.rental_price) + '/mês' : '')
        .replace(/\{\{?iptu_price\}?\}/g, property.iptu_price ? formatPrice(property.iptu_price) + '/ano' : '')
        .replace(/\{\{?condo_price\}?\}/g, property.condo_price ? formatPrice(property.condo_price) + '/mês' : '')
        .replace(/\{\{?app_name\}?\}/g, appName)
        .replace(/\{\{?logo_url\}?\}/g, logoUrl || '');

      // Add images if available
      if (images.length > 0) {
        const imageHtml = images.slice(0, 3).map(url => `
          <div style="margin: 10px 0;">
            <img src="${url}" alt="${property.title}" style="max-width: 100%; height: auto; border-radius: 8px;" />
          </div>
        `).join('');
        html += `<div style="margin-top: 20px;">${imageHtml}</div>`;
      }
    } else {
      // Use default template
      html = generateEmailHTML({ to, property, images, appName, logoUrl });
    }

    const emailResponse = await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: [to],
      subject: `${property.title} - ${property.code}`,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-property-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
