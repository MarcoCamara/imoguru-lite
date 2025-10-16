const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPropertyEmail = async ({ to, property, message, images = [] }) => {
  const imageHtml = images.slice(0, 5).map(img => `
    <img src="${img}" alt="Property image" style="width: 100%; max-width: 300px; height: auto; margin: 10px 0; border-radius: 8px;">
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏡 ${property.title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>
                  
                  ${property.description ? `
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">${property.description}</p>
                    </div>
                  ` : ''}
                  
                  <h3 style="color: #667eea; margin: 20px 0 10px 0;">📍 Localização</h3>
                  <p style="color: #555; margin: 0;">${property.street || ''} ${property.number || ''}, ${property.neighborhood || ''} - ${property.city || ''}/${property.state || ''}</p>
                  
                  ${imageHtml ? `
                    <h3 style="color: #667eea; margin: 30px 0 15px 0;">📸 Fotos do Imóvel</h3>
                    <div style="text-align: center;">
                      ${imageHtml}
                    </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${property.url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ver Imóvel Completo
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0;">Este email foi enviado via ImoGuru</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: 'ImoGuru <onboarding@resend.dev>',
    to: [to],
    subject: `Confira este imóvel: ${property.title}`,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, resetToken, resetUrl }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Redefinir Senha</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Você solicitou a redefinição de senha da sua conta ImoGuru.
                  </p>
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Clique no botão abaixo para criar uma nova senha:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Redefinir Senha
                    </a>
                  </div>
                  
                  <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                    Se você não solicitou esta redefinição, pode ignorar este email com segurança.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0;">Este email foi enviado via ImoGuru</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: 'ImoGuru <onboarding@resend.dev>',
    to: [to],
    subject: 'Redefinir Senha - ImoGuru',
    html,
  });
};

module.exports = {
  sendPropertyEmail,
  sendPasswordResetEmail,
};
