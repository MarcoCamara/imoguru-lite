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

      if (error) {
        console.error('Error loading print template:', error);
        throw error;
      }
      
      console.log('✅ Template carregado com sucesso:', data);
      setTemplate(data);
      
      if (!data) {
        toast({
          title: 'Aviso',
          description: 'Nenhum template de impressão padrão encontrado. Configure um template em Configurações.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar template:', error);
      toast({
        title: 'Erro ao carregar template',
        description: error?.message || 'Verifique se existe um template padrão configurado.',
        variant: 'destructive',
      });
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
    formatted = formatted.replace(/{{neighborhood}}/g, property.neighborhood || '');
    formatted = formatted.replace(/{{public_address}}/g, property.public_address || '');
    formatted = formatted.replace(/{{bedrooms}}/g, String(property.bedrooms || 0));
    formatted = formatted.replace(/{{bathrooms}}/g, String(property.bathrooms || 0));
    formatted = formatted.replace(/{{parking_spaces}}/g, String(property.parking_spaces || 0));
    formatted = formatted.replace(/{{total_area}}/g, property.total_area ? String(property.total_area) : 'N/A');
    formatted = formatted.replace(/{{area_total}}/g, property.total_area ? String(property.total_area) : 'N/A');
    formatted = formatted.replace(/{{status}}/g, property.status || '');
    formatted = formatted.replace(/{{description}}/g, property.description || '');
    
    // Replace prices
    const salePrice = property.sale_price ? `R$ ${property.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado';
    const rentalPrice = property.rental_price ? `R$ ${property.rental_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado';
    const condominiumFee = property.condominium_fee ? `R$ ${property.condominium_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado';
    const iptu = property.iptu ? `R$ ${property.iptu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado';
    
    formatted = formatted.replace(/{{sale_price}}/g, salePrice);
    formatted = formatted.replace(/{{rental_price}}/g, rentalPrice);
    formatted = formatted.replace(/{{condominium_fee}}/g, condominiumFee);
    formatted = formatted.replace(/{{iptu}}/g, iptu);
    
    const price = property.purpose === 'venda' ? salePrice : rentalPrice;
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

    if (!properties || properties.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum imóvel selecionado para impressão.',
        variant: 'destructive',
      });
      return;
    }

    if (!template.content || template.content.trim() === '') {
      toast({
        title: 'Erro',
        description: 'O template de impressão está vazio. Configure um template válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Gerar QR Codes para todos os imóveis
      const qrCodes = await Promise.all(
        properties.map(async (p) => {
          try {
            const qr = await generateQRCode(p.id);
            return qr || ''; // Retornar string vazia se falhar
          } catch (error) {
            console.error('Erro ao gerar QR Code para imóvel:', p.id, error);
            return '';
          }
        })
      );

      // Validar se pelo menos um QR Code foi gerado (ou se é opcional)
      console.log('QR Codes gerados:', qrCodes.filter(q => q !== '').length, 'de', qrCodes.length);

      // Criar janela de impressão
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) {
        toast({
          title: 'Erro',
          description: 'Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão bloqueados.',
          variant: 'destructive',
        });
        return;
      }

      // Formatar conteúdo de cada propriedade
      const formattedProperties = properties.map((property, index) => {
        try {
          const content = formatPropertyContent(template.content, property, qrCodes[index] || '');
          // Verificar se o conteúdo está vazio após formatação
          if (!content || content.trim() === '' || content.trim() === template.content) {
            console.warn('Conteúdo vazio ou não formatado para imóvel:', property.id);
            return `<div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
              <h2>${property.title || property.code || 'Imóvel sem título'}</h2>
              <p><strong>Código:</strong> ${property.code || 'N/A'}</p>
              <p><strong>Erro:</strong> Template não formatou corretamente. Verifique os dados do imóvel.</p>
            </div>`;
          }
          return content;
        } catch (error) {
          console.error('Erro ao formatar propriedade:', property.id, error);
          return `<div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
            <h2>${property.title || property.code || 'Imóvel sem título'}</h2>
            <p><strong>Erro:</strong> Não foi possível formatar esta propriedade.</p>
          </div>`;
        }
      });

      const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imóveis - ${systemSettings.app_name}</title>
          <style>
            @media print {
              @page { 
                margin: 2cm; 
                size: A4;
              }
              body { 
                margin: 0; 
                height: auto !important;
                min-height: auto !important;
              }
              .page-break { 
                page-break-after: always; 
              }
              /* Eliminar páginas em branco no final */
              body > div:last-child {
                page-break-after: auto !important;
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
              }
              /* Remover espaços vazios */
              body > div:empty {
                display: none !important;
              }
              /* Eliminar espaços extras que causam páginas em branco */
              body *:last-child {
                margin-bottom: 0 !important;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            
            /* Garantir que imagens sejam carregadas */
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${formattedProperties.map((content, index) => 
            content + 
            (index < formattedProperties.length - 1 ? '<div class="page-break"></div>' : '')
          ).join('')}
        </body>
      </html>
    `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar carregamento das imagens antes de imprimir
      printWindow.onload = () => {
        // Aguardar um pouco mais para garantir que todas as imagens sejam carregadas
        setTimeout(() => {
          // Verificar se a janela ainda está aberta
          if (!printWindow.closed) {
            printWindow.print();
          }
        }, 1000);
      };
      
      // Fallback: se onload não disparar, tentar após 2 segundos
      setTimeout(() => {
        if (!printWindow.closed && printWindow.document.readyState === 'complete') {
          printWindow.print();
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao imprimir:', error);
      toast({
        title: 'Erro ao imprimir',
        description: error?.message || 'Ocorreu um erro ao preparar a impressão.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Imprimir ({properties.length})
    </Button>
  );
}
