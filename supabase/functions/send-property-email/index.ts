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
  const { property, images, appName, logoUrl } = data;
  
  const imagesHTML = images.slice(0, 3).map(url => `
    <img src="${url}" alt="${property.title}" style="width: 100%; max-width: 300px; height: 200px; object-fit: cover; border-radius: 8px; margin: 8px;" />
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${property.title}</title>
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
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Oportunidade Exclusiva de Imóvel</p>
                  </td>
                </tr>

                <!-- Property Title -->
                <tr>
                  <td style="padding: 30px 40px 20px 40px;">
                    <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">${property.title}</h2>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      <strong>Código:</strong> ${property.code} | 
                      <strong>Tipo:</strong> ${property.property_type} | 
                      <strong>Finalidade:</strong> ${property.purpose}
                    </p>
                  </td>
                </tr>

                <!-- Images -->
                ${images.length > 0 ? `
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                      ${imagesHTML}
                    </div>
                  </td>
                </tr>
                ` : ''}

                <!-- Location -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                      <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 18px;">📍 Localização</h3>
                      <p style="margin: 0; color: #666; font-size: 14px;">${property.neighborhood}, ${property.city}</p>
                    </div>
                  </td>
                </tr>

                <!-- Characteristics -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px;">🏠 Características</h3>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px; width: 50%;">
                          <strong style="color: #667eea;">🛏️ Dormitórios:</strong> ${property.bedrooms || 0}
                        </td>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px; width: 50%;">
                          <strong style="color: #667eea;">✨ Suítes:</strong> ${property.suites || 0}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                          <strong style="color: #667eea;">🚿 Banheiros:</strong> ${property.bathrooms || 0}
                        </td>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                          <strong style="color: #667eea;">🚗 Vagas:</strong> ${property.parking_spaces || 0}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                          <strong style="color: #667eea;">📐 Área Útil:</strong> ${property.useful_area || 0}m²
                        </td>
                        <td style="padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                          <strong style="color: #667eea;">📏 Área Total:</strong> ${property.total_area || 0}m²
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Description -->
                ${property.description ? `
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 18px;">📝 Descrição</h3>
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${property.description}</p>
                  </td>
                </tr>
                ` : ''}

                <!-- Prices -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; color: #ffffff;">
                      <h3 style="margin: 0 0 15px 0; font-size: 20px; text-align: center;">💰 Valores</h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        ${property.sale_price ? `
                        <tr>
                          <td style="color: #ffffff; font-size: 16px;"><strong>💵 Venda:</strong></td>
                          <td style="color: #ffffff; font-size: 18px; text-align: right;"><strong>${formatPrice(property.sale_price)}</strong></td>
                        </tr>
                        ` : ''}
                        ${property.rental_price ? `
                        <tr>
                          <td style="color: #ffffff; font-size: 16px;"><strong>🏠 Aluguel:</strong></td>
                          <td style="color: #ffffff; font-size: 18px; text-align: right;"><strong>${formatPrice(property.rental_price)}/mês</strong></td>
                        </tr>
                        ` : ''}
                        ${property.iptu_price ? `
                        <tr>
                          <td style="color: rgba(255,255,255,0.9); font-size: 14px;">📋 IPTU:</td>
                          <td style="color: rgba(255,255,255,0.9); font-size: 14px; text-align: right;">${formatPrice(property.iptu_price)}/ano</td>
                        </tr>
                        ` : ''}
                        ${property.condo_price ? `
                        <tr>
                          <td style="color: rgba(255,255,255,0.9); font-size: 14px;">🏢 Condomínio:</td>
                          <td style="color: rgba(255,255,255,0.9); font-size: 14px; text-align: right;">${formatPrice(property.condo_price)}/mês</td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Interessado? Entre em contato conosco!</p>
                    <p style="margin: 0; color: #999; font-size: 12px;">Este email foi enviado por ${appName}</p>
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
