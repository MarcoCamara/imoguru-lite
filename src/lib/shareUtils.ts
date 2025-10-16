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

  // Get property URL
  const propertyUrl = `${window.location.origin}/property/${property.id}`;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Normalize double-brace placeholders to single-brace to simplify replacement
  message = message.replace(/\{\{\s*(\w+)\s*\}\}/g, '{$1}');
  
  // Replace system variables
  message = message.replace(/\{app_name\}/g, settings.app_name);
  message = message.replace(/\{logo_url\}/g, settings.logo_url || '');
  message = message.replace(/\{property_url\}/g, propertyUrl);
  message = message.replace(/\{current_date\}/g, currentDate);
  
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
    // Try WhatsApp app
    window.location.href = `whatsapp://send?text=${encodedMessage}`;
  } else {
    // Desktop: use WhatsApp Web
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
  
  // Copy message to clipboard
  await copyToClipboard(message);
  
  if (isMobile) {
    // Open Messenger app
    window.location.href = `fb-messenger://`;
  } else {
    // Desktop: open Messenger web
    window.open('https://www.messenger.com/', '_blank');
  }
  
  return true;
};

export const shareToFacebook = async (message: string, images: string[]) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Copy message to clipboard
  await copyToClipboard(message);
  
  if (isMobile) {
    // Try to open Facebook app
    window.location.href = 'fb://';
  } else {
    // Desktop: open Facebook
    window.open('https://www.facebook.com/', '_blank');
  }
  
  return true;
};

export const shareToInstagram = async (message: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Copy message to clipboard
  await copyToClipboard(message);
  
  if (isMobile) {
    // Try to open Instagram app
    window.location.href = 'instagram://';
  } else {
    // Desktop: open Instagram web
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
