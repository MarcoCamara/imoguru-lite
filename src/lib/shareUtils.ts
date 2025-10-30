import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type SharePlatform = 'whatsapp' | 'email' | 'messenger' | 'facebook' | 'instagram';
export type ExportFormat = 'jpg' | 'pdf';

export interface ShareTemplate {
  id: string;
  name: string;
  platform: SharePlatform;
  message_format: string;
  fields: string[];
  include_images: boolean;
  max_images: number;
}

// Check if Web Share API is available
export const canUseWebShare = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

// Share via native Web Share API
export const shareViaWebShare = async (title: string, text: string, url: string): Promise<boolean> => {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    await navigator.share({
      title,
      text,
      url,
    });
    return true;
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      console.error('Error sharing via Web Share API:', error);
    }
    return false;
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

export const formatPropertyValue = (key: string, value: any, property?: any): string => {
  if (!value && key !== 'price') return '';
  
  switch (key) {
    case 'price':
      // Use sale_price or rental_price based on what's available
      if (property?.sale_price) {
        return `R$ ${Number(property.sale_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (property?.rental_price) {
        return `R$ ${Number(property.rental_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`;
      }
      return '';
    case 'sale_price':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
    case 'rental_price':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : '';
    case 'iptu_price':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano` : '';
    case 'condo_price':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : '';
    case 'total_area':
    case 'useful_area':
      return value ? String(value) : '';
    case 'bedrooms':
    case 'suites':
    case 'bathrooms':
    case 'parking_spaces':
      return value ? String(value) : '0';
    case 'purpose':
      return value === 'venda' ? 'Venda' : value === 'locacao' ? 'Locação' : (value ? String(value) : '');
    case 'status':
      const statusMap: any = {
        disponivel: 'Disponível',
        reservado: 'Reservado',
        vendido: 'Vendido',
        alugado: 'Alugado'
      };
      return value ? (statusMap[value] || String(value)) : '';
    case 'title':
    case 'property_type':
    case 'city':
    case 'neighborhood':
    case 'street':
    case 'code':
    case 'description':
      return value ? String(value) : '';
    default:
      return value ? String(value) : '';
  }
};

/**
 * Converte HTML em texto simples formatado para redes sociais (com suporte a Markdown do WhatsApp)
 */
const htmlToPlainText = (html: string): string => {
  let text = html;

  // Manter links clicáveis (extrai a URL e coloca no final ou inline)
  // Ex: <a href="http://link.com">Texto</a> -> Texto (http://link.com)
  text = text.replace(/<a href="([^"]+)">([^<]+)<\/a>/gi, '$2 ($1)');

  // Converter para Markdown do WhatsApp
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '*$1*');
  text = text.replace(/<b>(.*?)<\/b>/gi, '*$1*');
  text = text.replace(/<em>(.*?)<\/em>/gi, '_$1_');
  text = text.replace(/<i>(.*?)<\/i>/gi, '_$1_');
  text = text.replace(/<s>(.*?)<\/s>/gi, '~$1~');
  text = text.replace(/<strike>(.*?)<\/strike>/gi, '~$1~');

  // Converter quebras de linha e parágrafos
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  
  // Converter listas
  text = text.replace(/<li[^>]*>/gi, '\n• ');

  // Remover todas as outras tags (como <img> de logos)
  text = text.replace(/<[^>]+>/g, '');
  
  // Decodificar entidades HTML
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  
  // Limpar múltiplas quebras de linha
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
};

export const formatMessageWithTemplate = async (template: ShareTemplate, property: any, forceHtml: boolean = false): Promise<string> => {
  let message = template.message_format || '';

  // Carregar dados do sistema
  const { data: systemSettingsData } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['app_name']);

  // Carregar dados da empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('slug, name, logo_url')
    .eq('id', property.company_id)
    .single() as { data: { slug: string; name: string; logo_url: string } | null; error: any };

  if (companyError) {
    console.error('Error fetching company data:', companyError.message);
  }
  
  const settings: any = { app_name: 'ImoGuru' };
  systemSettingsData?.forEach((item) => {
    settings[item.setting_key] = item.setting_value;
  });

  const propertyUrl = `${window.location.origin}/public-property/${company?.slug || 'company'}/property/${property.id}`;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // 1. Montar um mapa com todos os valores de substituição
  const replacements: { [key: string]: string | undefined } = {
    // Adicionar todos os campos do imóvel
    ...property,
    
    // Placeholders do sistema e da empresa
    app_name: settings.app_name,
    agency_name: company?.name || settings.app_name,
    property_url: forceHtml ? `<a href="${propertyUrl}">${propertyUrl}</a>` : propertyUrl,
    current_date: currentDate,
    line_break: forceHtml ? '<br><br>' : '\n',
    
    // Placeholders visuais (só para HTML)
    company_logo: (forceHtml && company?.logo_url) ? `<img src="${company.logo_url}" alt="Logo" style="max-width: 150px; height: auto;" />` : '',

    // Placeholders de valores formatados (sobrescrevem os do imóvel)
    price: formatPropertyValue('price', null, property),
    sale_price: formatPropertyValue('sale_price', property.sale_price, property),
    rental_price: formatPropertyValue('rental_price', property.rental_price, property),
    bedrooms: formatPropertyValue('bedrooms', property.bedrooms, property),
    bathrooms: formatPropertyValue('bathrooms', property.bathrooms, property),
    parking_spaces: formatPropertyValue('parking_spaces', property.parking_spaces, property),
    total_area: formatPropertyValue('total_area', property.total_area, property),
  };

  // 2. Substituir todos os placeholders {{campo}} ou {campo}
  message = message.replace(/\{\{?(\w+)\}?}/g, (match, key) => {
    return replacements[key] !== undefined ? String(replacements[key]) : '';
  });

  // 3. Se for para texto (WhatsApp), converter o resultado para texto plano formatado
  if (!forceHtml) {
    message = htmlToPlainText(message);
  }
  
  return message;
};

export const getShareTemplates = async (): Promise<ShareTemplate[]> => {
  const { data, error } = await supabase
    .from('share_templates')
    .select('*')
    .eq('archived', false) // Buscar todos os templates não arquivados
    .order('platform')
    .order('is_default', { ascending: false }) // Defaults primeiro
    .order('name');
  
  if (error) throw error;
  
  return (data || []).map(template => ({
    id: template.id,
    name: template.name,
    platform: template.platform as SharePlatform,
    message_format: template.message_format || '',
    fields: Array.isArray(template.fields) ? template.fields : JSON.parse(template.fields as string),
    include_images: template.include_images,
    max_images: template.max_images,
  }));
};

export const getPropertyImages = (property: any, maxImages: number = 5): string[] => {
  if (!property.property_images || property.property_images.length === 0) return [];
  
  const sortedImages = [...property.property_images].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });
  
  return sortedImages.slice(0, maxImages).map(img => img.url);
};

export const shareToWhatsApp = async (message: string, images: string[]) => {
  try {
    // Copiar mensagem para clipboard
    await navigator.clipboard.writeText(message);
    
    // Abrir WhatsApp Web ou App
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Error sharing to WhatsApp:', error);
    return false;
  }
};

export const shareToEmail = async (property: any, htmlMessage: string, images: string[], systemSettings?: any) => {
  try {
    // Criar email HTML completo com formatação
    const htmlEmail = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    img { max-width: 100%; height: auto; }
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
    .photo-grid img { width: 100%; height: auto; border-radius: 8px; object-fit: cover; aspect-ratio: 1/1; }
    h2, h3 { color: #2563eb; }
    .property-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
${htmlMessage}
</body>
</html>`;

    // FORÇA a cópia de HTML para clipboard
    try {
      const htmlBlob = new Blob([htmlEmail], { type: 'text/html' });
      const textBlob = new Blob([htmlMessage], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
    } catch (clipErr) {
      // Fallback absoluto: copia apenas o HTML como texto
      await navigator.clipboard.writeText(htmlEmail);
    }
    
    // Abrir cliente de email
    const subject = `${property.property_type || 'Imóvel'} - ${property.title || property.code}`;
    const encodedSubject = encodeURIComponent(subject);
    window.location.href = `mailto:?subject=${encodedSubject}`;
    
    return true;
  } catch (error) {
    console.error('Error opening email client:', error);
    return false;
  }
};

export const shareToMessenger = async (message: string) => {
  try {
    // Copiar mensagem para clipboard
    await navigator.clipboard.writeText(message);
    
    // Abrir Messenger
    const messengerUrl = `https://www.facebook.com/messages/`;
    window.open(messengerUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const shareToFacebook = async (message: string, images: string[], companyFacebookUrl?: string) => {
  try {
    // Copiar mensagem para clipboard
    await navigator.clipboard.writeText(message);
    
    // Abrir Facebook no feed para o usuário colar
    const facebookUrl = 'https://www.facebook.com/';
    window.open(facebookUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const shareToInstagram = async (message: string, companyInstagramUrl?: string) => {
  try {
    // Copiar mensagem para clipboard
    await navigator.clipboard.writeText(message);
    
    // Abrir Instagram (perfil da empresa se disponível, senão home)
    const instagramUrl = companyInstagramUrl || 'https://www.instagram.com/';
    window.open(instagramUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const trackShare = async (propertyId: string, platform: SharePlatform, contactInfo?: { name?: string, email?: string, phone?: string }) => {
  try {
    // Atualizar estatísticas de compartilhamento
    const { data: stats } = await supabase
      .from('property_statistics')
      .select('*')
      .eq('property_id', propertyId)
      .single();
    
    if (stats) {
      const shareField = `shares_${platform}` as keyof typeof stats;
      const currentValue = stats[shareField] as number || 0;
      
      await supabase
        .from('property_statistics')
        .update({ [shareField]: currentValue + 1 })
        .eq('property_id', propertyId);
    }
  } catch (error) {
    console.error('Error tracking share:', error);
  }
};

/**
 * Exporta template como JPG ou PDF
 */
export const exportTemplate = async (
  template: ShareTemplate,
  property: any,
  format: ExportFormat = 'jpg'
): Promise<boolean> => {
  try {
    // Gerar o conteúdo formatado com o template
    const message = await formatMessageWithTemplate(template, property);
    const images = getPropertyImages(property, template.max_images);

    // Criar elemento HTML temporário para renderização
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '14px';
    container.style.lineHeight = '1.6';
    container.style.color = '#333333';

    // Inserir conteúdo do template
    container.innerHTML = message;

    // Se incluir imagens, adicionar ao container
    if (template.include_images && images.length > 0) {
      const photoColumns = (template as any).photo_columns || 2;
      const gridDiv = document.createElement('div');
      gridDiv.style.display = 'grid';
      gridDiv.style.gridTemplateColumns = `repeat(${photoColumns}, 1fr)`;
      gridDiv.style.gap = '10px';
      gridDiv.style.marginTop = '20px';

      for (const imgUrl of images) {
        const imgWrapper = document.createElement('div');
        imgWrapper.style.aspectRatio = '1/1';
        imgWrapper.style.overflow = 'hidden';
        imgWrapper.style.borderRadius = '8px';

        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS

        imgWrapper.appendChild(img);
        gridDiv.appendChild(imgWrapper);
      }

      container.appendChild(gridDiv);
    }

    document.body.appendChild(container);

    // Aguardar imagens carregarem
    const imgs = container.querySelectorAll('img');
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true); // Continuar mesmo se imagem falhar
            }
          })
      )
    );

    // Converter para canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Maior qualidade
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Remover elemento temporário
    document.body.removeChild(container);

    const propertyTitle = property.title || property.code || 'Imovel';
    const filename = `${propertyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${template.platform}`;

    if (format === 'jpg') {
      // Exportar como JPG
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `${filename}.jpg`;
      link.href = imgData;
      link.click();
    } else {
      // Exportar como PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
    }

    return true;
  } catch (error) {
    console.error('Error exporting template:', error);
    return false;
  }
};
