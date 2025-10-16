import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PrintTemplateProps {
  properties: any[];
}

export default function PrintTemplate({ properties }: PrintTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>({
    app_name: 'ImoGuru',
    logo_url: null,
  });

  useEffect(() => {
    loadTemplate();
    loadSystemSettings();
  }, []);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error loading print template:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'logo_url']);

      if (error) throw error;

      const settingsObj: any = { app_name: 'ImoGuru', logo_url: null };
      data?.forEach((item) => {
        settingsObj[item.setting_key] = item.setting_value;
      });

      setSystemSettings(settingsObj);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const generateQRCode = async (propertyId: string) => {
    try {
      const url = `${window.location.origin}/property/${propertyId}`;
      return await QRCode.toDataURL(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  };

  const formatPropertyContent = (templateContent: string, property: any, qrCodeUrl: string) => {
    let formatted = templateContent;

    // Replace property data
    formatted = formatted.replace(/{{title}}/g, property.title || '');
    formatted = formatted.replace(/{{code}}/g, property.code || '');
    formatted = formatted.replace(/{{property_type}}/g, property.property_type || '');
    formatted = formatted.replace(/{{purpose}}/g, property.purpose === 'venda' ? 'Venda' : 'Locação');
    formatted = formatted.replace(/{{city}}/g, property.city || '');
    formatted = formatted.replace(/{{state}}/g, property.state || '');
    formatted = formatted.replace(/{{street}}/g, property.street || '');
    formatted = formatted.replace(/{{number}}/g, property.number || '');
    formatted = formatted.replace(/{{bedrooms}}/g, String(property.bedrooms || 0));
    formatted = formatted.replace(/{{bathrooms}}/g, String(property.bathrooms || 0));
    formatted = formatted.replace(/{{parking_spaces}}/g, String(property.parking_spaces || 0));
    formatted = formatted.replace(/{{total_area}}/g, property.total_area ? String(property.total_area) : 'N/A');
    formatted = formatted.replace(/{{status}}/g, property.status || '');
    formatted = formatted.replace(/{{description}}/g, property.description || '');
    
    const price = property.purpose === 'venda' 
      ? (property.sale_price || 0).toLocaleString('pt-BR') 
      : (property.rental_price || 0).toLocaleString('pt-BR');
    formatted = formatted.replace(/{{price}}/g, price);

    // Replace system settings
    formatted = formatted.replace(/{{app_name}}/g, systemSettings.app_name);
    formatted = formatted.replace(/{{logo}}/g, systemSettings.logo_url 
      ? `<img src="${systemSettings.logo_url}" alt="Logo" style="height: 40px;" />`
      : systemSettings.app_name
    );

    // Replace QR code
    formatted = formatted.replace(/{{qrcode}}/g, `<img src="${qrCodeUrl}" alt="QR Code" style="width: 100px; height: 100px;" />`);

    // Replace images
    if (property.property_images && property.property_images.length > 0) {
      const imagesHtml = property.property_images.slice(0, 6).map((img: any) => 
        `<img src="${img.url}" alt="Imagem do imóvel" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;" />`
      ).join('');
      formatted = formatted.replace(/{{images}}/g, `<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0;">${imagesHtml}</div>`);
    } else {
      formatted = formatted.replace(/{{images}}/g, '');
    }

    return formatted;
  };

  const handlePrint = async () => {
    if (!template) {
      toast({
        title: 'Erro',
        description: 'Nenhum template de impressão configurado.',
        variant: 'destructive',
      });
      return;
    }

    // Gerar QR Codes para todos os imóveis
    const qrCodes = await Promise.all(
      properties.map(p => generateQRCode(p.id))
    );

    // Criar janela de impressão
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imóveis - ${systemSettings.app_name}</title>
          <style>
            @media print {
              @page { margin: 2cm; }
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
            
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
          </style>
        </head>
        <body>
          ${properties.map((property, index) => 
            formatPropertyContent(template.content, property, qrCodes[index]) + 
            (index < properties.length - 1 ? '<div class="page-break"></div>' : '')
          ).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregamento das imagens
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <Button onClick={handlePrint} variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Imprimir Selecionados
    </Button>
  );
}
