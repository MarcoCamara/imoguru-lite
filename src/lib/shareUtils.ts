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

export const formatPropertyValue = (key: string, value: any): string => {
  if (!value) return '';
  
  switch (key) {
    case 'sale_price':
      return value ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
    case 'rental_price':
      return value ? `Aluguel: R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : '';
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
    default:
      return String(value);
  }
};

export const formatMessageWithTemplate = (template: ShareTemplate, property: any): string => {
  let message = template.message_format;
  
  template.fields.forEach(field => {
    const placeholder = `{{${field}}}`;
    const value = formatPropertyValue(field, property[field]);
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Remove empty lines and clean up
  message = message
    .split('\n')
    .filter(line => !line.match(/^[\s]*{{.*}}[\s]*$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  
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
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
  return true;
};

export const shareToEmail = async (property: any, message: string, images: string[]) => {
  const subject = encodeURIComponent(`Imóvel: ${property.title || 'Sem título'}`);
  const body = encodeURIComponent(message);
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
  
  window.location.href = mailtoUrl;
  return true;
};

export const shareToMessenger = async (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const messengerUrl = `fb-messenger://share?link=${encodedMessage}`;
  
  // Fallback to web if app not installed
  const webFallback = `https://www.messenger.com/`;
  
  try {
    window.open(messengerUrl, '_blank');
    setTimeout(() => window.open(webFallback, '_blank'), 1000);
  } catch {
    window.open(webFallback, '_blank');
  }
  
  return true;
};

export const shareToFacebook = async (message: string, images: string[]) => {
  const encodedMessage = encodeURIComponent(message);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedMessage}`;
  
  window.open(facebookUrl, '_blank', 'width=600,height=400');
  return true;
};

export const shareToInstagram = async (message: string) => {
  // Instagram doesn't have direct sharing API for web
  // Copy message to clipboard for user to paste
  try {
    await navigator.clipboard.writeText(message);
    return 'clipboard';
  } catch {
    return false;
  }
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
