import { supabase } from '@/integrations/supabase/client';

export type SharePlatform = 'whatsapp' | 'email' | 'messenger' | 'facebook' | 'instagram';

export interface ShareTemplate {
  id: string;
  name: string;
  platform: SharePlatform;
  message_format: string;
  fields: string[];
  include_images: boolean;
  max_images: number;
}

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
    case 'title':
    case 'property_type':
    case 'purpose':
    case 'city':
    case 'neighborhood':
    case 'description':
      return value ? String(value) : '';
    default:
      return value ? String(value) : '';
  }
};

export const formatMessageWithTemplate = async (template: ShareTemplate, property: any): Promise<string> => {
  let message = template.message_format || '';

  // Load system settings
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['app_name', 'logo_url']);
  
  const settings: any = { app_name: 'ImoGuru', logo_url: '' };
  systemSettings?.forEach((item) => {
    settings[item.setting_key] = item.setting_value;
  });

  // Normalize double-brace placeholders to single-brace to simplify replacement
  message = message.replace(/\{\{\s*(\w+)\s*\}\}/g, '{$1}');
  
  // Replace system variables
  message = message.replace(/\{app_name\}/g, settings.app_name);
  message = message.replace(/\{logo_url\}/g, settings.logo_url || '');
  
  // Replace property fields
  template.fields.forEach((field) => {
    const re = new RegExp(`\\{${field}\\}`, 'g');
    const value = formatPropertyValue(field, property[field], property);
    message = message.replace(re, value);
  });
  
  // Remove empty lines and clean up
  message = message
    .split('\n')
    .filter((line) => !line.match(/^[\s]*\{.*\}[\s]*$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return message;
};

export const getShareTemplates = async (): Promise<ShareTemplate[]> => {
  const { data, error } = await supabase
    .from('share_templates')
    .select('*')
    .eq('is_default', true)
    .order('platform');
  
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
  const encodedMessage = encodeURIComponent(message);
  
  // Detect if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // No mobile, perguntar se tem WhatsApp Business
    const useWhatsAppBusiness = confirm('Você possui WhatsApp Business instalado? Clique em OK para usar o WhatsApp Business ou Cancelar para usar o WhatsApp comum.');
    
    if (useWhatsAppBusiness) {
      // Tentar abrir WhatsApp Business primeiro
      window.location.href = `https://wa.me/?text=${encodedMessage}`;
    } else {
      // Abrir WhatsApp comum
      window.location.href = `whatsapp://send?text=${encodedMessage}`;
    }
  } else {
    // No desktop, sempre usar WhatsApp Web
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  }
  
  return true;
};

export const shareToEmail = async (property: any, message: string, images: string[], systemSettings?: any) => {
  try {
    // Get email from user prompt
    const email = prompt('Digite o email do destinatário:');
    if (!email) return false;

    // Get the default email template
    const { data: emailTemplate } = await supabase
      .from('share_templates')
      .select('message_format')
      .eq('platform', 'email')
      .eq('is_default', true)
      .single();

    // Call edge function to send formatted email
    const { data, error } = await supabase.functions.invoke('send-property-email', {
      body: {
        to: email,
        property: {
          title: property.title,
          code: property.code,
          description: property.description,
          property_type: property.property_type,
          purpose: property.purpose,
          city: property.city,
          neighborhood: property.neighborhood,
          bedrooms: property.bedrooms,
          suites: property.suites,
          bathrooms: property.bathrooms,
          parking_spaces: property.parking_spaces,
          useful_area: property.useful_area,
          total_area: property.total_area,
          sale_price: property.sale_price,
          rental_price: property.rental_price,
          iptu_price: property.iptu_price,
          condo_price: property.condo_price,
        },
        images: images,
        appName: systemSettings?.app_name || 'ImoGuru',
        logoUrl: systemSettings?.logo_url || null,
        emailTemplate: emailTemplate?.message_format || null,
      },
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const shareToMessenger = async (message: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Copiar mensagem para área de transferência
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
  }
  
  if (isMobile) {
    // Abrir Messenger app no mobile
    window.location.href = `fb-messenger://`;
    
    // Fallback para web após 2 segundos se o app não abrir
    setTimeout(() => {
      window.open('https://www.messenger.com/', '_blank');
    }, 2000);
  } else {
    // Abrir Messenger web no desktop
    window.open('https://www.messenger.com/', '_blank');
  }
  
  return true;
};

export const shareToFacebook = async (message: string, images: string[]) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Copiar mensagem para área de transferência
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
  }
  
  const propertyUrl = encodeURIComponent(window.location.href);
  const encodedMessage = encodeURIComponent(message);
  
  if (isMobile) {
    // Tentar abrir o app do Facebook no mobile
    const fbAppUrl = `fb://facewebmodal/f?href=${encodeURIComponent(`https://www.facebook.com/sharer/sharer.php?u=${propertyUrl}`)}`;
    window.location.href = fbAppUrl;
    
    // Fallback para web após 2 segundos se o app não abrir
    setTimeout(() => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${propertyUrl}&quote=${encodedMessage}`, '_blank');
    }, 2000);
  } else {
    // No desktop, abrir janela de compartilhamento do Facebook
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${propertyUrl}&quote=${encodedMessage}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }
  
  return true;
};

export const shareToInstagram = async (message: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Copiar mensagem para área de transferência
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
  
  if (isMobile) {
    // Tentar abrir o Instagram app no mobile
    window.location.href = 'instagram://';
    
    // Fallback para web após 1 segundo se o app não abrir
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 1000);
  } else {
    // No desktop, abrir Instagram web
    window.open('https://www.instagram.com/', '_blank');
  }
  
  return 'clipboard';
};

export const trackShare = async (propertyId: string, platform: SharePlatform) => {
  try {
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
