import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import QRCode from 'qrcode';

interface PrintTemplateProps {
  properties: any[];
}

export default function PrintTemplate({ properties }: PrintTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const generateQRCode = async (propertyId: string) => {
    try {
      const url = `${window.location.origin}/property/${propertyId}`;
      return await QRCode.toDataURL(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;

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
          <title>Imóveis - ImoGuru</title>
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
            
            .property {
              border: 1px solid #ddd;
              padding: 20px;
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .property-header {
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            
            .property-title {
              font-size: 24px;
              font-weight: bold;
              color: #8b5cf6;
              margin-bottom: 5px;
            }
            
            .property-code {
              font-size: 14px;
              color: #666;
            }
            
            .property-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .property-field {
              margin-bottom: 10px;
            }
            
            .field-label {
              font-weight: bold;
              color: #666;
              font-size: 12px;
              text-transform: uppercase;
            }
            
            .field-value {
              font-size: 14px;
              margin-top: 2px;
            }
            
            .property-images {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 20px 0;
            }
            
            .property-image {
              width: 100%;
              height: 150px;
              object-fit: cover;
              border-radius: 8px;
            }
            
            .property-description {
              margin: 20px 0;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            
            .property-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            
            .qr-code {
              width: 100px;
              height: 100px;
            }
            
            .contact-info {
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${properties.map((property, index) => `
            <div class="property">
              <div class="property-header">
                <div class="property-title">${property.title}</div>
                <div class="property-code">Código: ${property.code}</div>
              </div>
              
              <div class="property-grid">
                <div class="property-field">
                  <div class="field-label">Tipo</div>
                  <div class="field-value">${property.property_type}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Finalidade</div>
                  <div class="field-value">${property.purpose === 'venda' ? 'Venda' : 'Locação'}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Localização</div>
                  <div class="field-value">${property.city} - ${property.state}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Endereço</div>
                  <div class="field-value">${property.street}, ${property.number}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Dormitórios</div>
                  <div class="field-value">${property.bedrooms}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Banheiros</div>
                  <div class="field-value">${property.bathrooms}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Vagas</div>
                  <div class="field-value">${property.parking_spaces}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Área Total</div>
                  <div class="field-value">${property.total_area ? property.total_area + ' m²' : 'N/A'}</div>
                </div>
                <div class="property-field">
                  <div class="field-label">Valor</div>
                  <div class="field-value">
                    R$ ${property.purpose === 'venda' 
                      ? (property.sale_price || 0).toLocaleString('pt-BR') 
                      : (property.rental_price || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div class="property-field">
                  <div class="field-label">Status</div>
                  <div class="field-value">${property.status}</div>
                </div>
              </div>
              
              ${property.property_images && property.property_images.length > 0 ? `
                <div class="property-images">
                  ${property.property_images.slice(0, 6).map((img: any) => `
                    <img src="${img.url}" alt="Imagem do imóvel" class="property-image" />
                  `).join('')}
                </div>
              ` : ''}
              
              ${property.description ? `
                <div class="property-description">
                  <div class="field-label">Descrição</div>
                  <div>${property.description}</div>
                </div>
              ` : ''}
              
              <div class="property-footer">
                <img src="${qrCodes[index]}" alt="QR Code" class="qr-code" />
                <div class="contact-info">
                  <div style="font-size: 18px; font-weight: bold;">ImoGuru</div>
                  <div>www.imoguru.com.br</div>
                  <div>contato@imoguru.com.br</div>
                </div>
              </div>
            </div>
            ${index < properties.length - 1 ? '<div class="page-break"></div>' : ''}
          `).join('')}
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
