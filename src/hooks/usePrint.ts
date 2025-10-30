import { useRef } from 'react';

interface PrintData {
  properties: any[];
  company?: any;
  showFullAddress?: boolean; // Nova propriedade para controlar endereço
}

export const usePrint = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const printProperties = (data: PrintData) => {
    // Criar elemento temporário para impressão
    const printElement = document.createElement('div');
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.top = '-9999px';
    printElement.style.width = '210mm'; // A4 width
    printElement.style.minHeight = '297mm'; // A4 height
    printElement.style.backgroundColor = 'white';
    printElement.style.padding = '20px';
    printElement.style.fontFamily = 'Arial, sans-serif';
    printElement.style.fontSize = '12px';
    printElement.style.lineHeight = '1.4';
    
    // Montar template simples de impressão
    const template = `
      <div style="max-width: 100%; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #333; margin: 0; font-size: 24px;">${data.company?.name || 'ImoGuru'}</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Informações dos Imóveis</p>
        </div>
        
        ${data.properties.map((property, index) => `
          <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <h2 style="color: #333; margin-bottom: 15px; font-size: 18px;">${property.title} - ${property.code}</h2>
            
            ${property.property_images && property.property_images.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Fotos do Imóvel</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                  ${property.property_images.slice(0, 6).map((image: any) => `
                    <div style="text-align: center;">
                      <img 
                        src="${image.url}" 
                        alt="${property.title}" 
                        style="width: 100%; max-width: 150px; height: 100px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;"
                        onerror="this.style.display='none'"
                      />
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Informações Básicas</h3>
                <p style="margin: 5px 0;"><strong>Tipo:</strong> ${property.property_type}</p>
                <p style="margin: 5px 0;"><strong>Finalidade:</strong> ${property.purpose}</p>
                <p style="margin: 5px 0;"><strong>Condição:</strong> ${property.condition}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${property.status}</p>
              </div>
              
              <div>
                <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Características</h3>
                <p style="margin: 5px 0;"><strong>Dormitórios:</strong> ${property.bedrooms}</p>
                <p style="margin: 5px 0;"><strong>Suítes:</strong> ${property.suites}</p>
                <p style="margin: 5px 0;"><strong>Banheiros:</strong> ${property.bathrooms}</p>
                <p style="margin: 5px 0;"><strong>Vagas:</strong> ${property.parking_spaces}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Áreas</h3>
              <p style="margin: 5px 0;"><strong>Área Total:</strong> ${property.total_area ? property.total_area + 'm²' : 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Área Útil:</strong> ${property.useful_area ? property.useful_area + 'm²' : 'N/A'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Localização</h3>
              ${data.showFullAddress ? `
                <p style="margin: 5px 0;"><strong>Endereço:</strong> ${property.street}, ${property.number}</p>
                <p style="margin: 5px 0;"><strong>Bairro:</strong> ${property.neighborhood}</p>
                <p style="margin: 5px 0;"><strong>Cidade:</strong> ${property.city} - ${property.state}</p>
                <p style="margin: 5px 0;"><strong>CEP:</strong> ${property.cep}</p>
              ` : `
                <p style="margin: 5px 0;"><strong>Bairro:</strong> ${property.neighborhood}</p>
                <p style="margin: 5px 0;"><strong>Cidade:</strong> ${property.city} - ${property.state}</p>
              `}
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Valores</h3>
              ${property.sale_price ? `<p style="margin: 5px 0;"><strong>Preço de Venda:</strong> R$ ${property.sale_price.toLocaleString('pt-BR')}</p>` : ''}
              ${property.rental_price ? `<p style="margin: 5px 0;"><strong>Preço de Locação:</strong> R$ ${property.rental_price.toLocaleString('pt-BR')}</p>` : ''}
              ${property.condo_fee ? `<p style="margin: 5px 0;"><strong>Condomínio:</strong> R$ ${property.condo_fee.toLocaleString('pt-BR')}</p>` : ''}
            </div>
            
            ${property.description ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #666; margin-bottom: 10px; font-size: 14px;">Descrição</h3>
                <p style="line-height: 1.6; margin: 5px 0;">${property.description}</p>
              </div>
            ` : ''}
            
            ${index < data.properties.length - 1 ? '<div style="border-bottom: 1px solid #ddd; margin: 30px 0;"></div>' : ''}
          </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          <p style="margin: 5px 0;">Impresso em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          ${data.company?.phone ? `<p style="margin: 5px 0;">Contato: ${data.company.phone}</p>` : ''}
          ${data.company?.email ? `<p style="margin: 5px 0;">Email: ${data.company.email}</p>` : ''}
        </div>
      </div>
    `;
    
    printElement.innerHTML = template;
    document.body.appendChild(printElement);
    
    // Configurar estilos de impressão
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * { visibility: hidden; }
        .print-content, .print-content * { visibility: visible; }
        .print-content { 
          position: absolute !important; 
          left: 0 !important; 
          top: 0 !important; 
          width: 100% !important; 
          background: white !important;
          color: black !important;
        }
        @page { 
          margin: 1cm; 
          size: A4;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Marcar elemento para impressão
    printElement.className = 'print-content';
    
    // Abrir interface de impressão
    window.print();
    
    // Limpar elementos temporários após impressão
    setTimeout(() => {
      if (document.body.contains(printElement)) {
        document.body.removeChild(printElement);
      }
      if (document.head.contains(printStyles)) {
        document.head.removeChild(printStyles);
      }
    }, 1000);
  };

  return { printProperties };
};
