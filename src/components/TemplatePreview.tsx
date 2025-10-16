import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatPropertyValue } from '@/lib/shareUtils';

interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    name: string;
    message_format?: string;
    content?: string;
    fields?: string[];
    platform?: string;
  };
  type: 'share' | 'authorization';
}

// Dados de exemplo de uma propriedade
const sampleProperty = {
  title: 'Apartamento Moderno no Centro',
  code: 'AP-001',
  purpose: 'Venda',
  property_type: 'Apartamento',
  status: 'Disponível',
  sale_price: 450000,
  rental_price: 2500,
  iptu_price: 1200,
  condo_price: 450,
  bedrooms: 3,
  suites: 1,
  bathrooms: 2,
  parking_spaces: 2,
  total_area: 120,
  useful_area: 95,
  city: 'São Paulo',
  neighborhood: 'Jardins',
  street: 'Rua Augusta, 1500',
  description: 'Belíssimo apartamento com acabamento de primeira, localizado em uma das melhores regiões da cidade.',
};

// Dados de exemplo do proprietário
const sampleOwner = {
  name: 'João da Silva',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  email: 'joao@email.com',
  phone: '(11) 98765-4321',
  address: 'Rua das Flores, 123',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
};

export default function TemplatePreview({ open, onOpenChange, template, type }: TemplatePreviewProps) {
  const formatContent = () => {
    const content = template.message_format || template.content || '';
    let formatted = content;

    // Substituir placeholders de propriedade
    Object.keys(sampleProperty).forEach((key) => {
      const value = formatPropertyValue(key, (sampleProperty as any)[key], sampleProperty);
      formatted = formatted.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    // Substituir placeholders de proprietário (para autorizações)
    if (type === 'authorization') {
      Object.keys(sampleOwner).forEach((key) => {
        const value = (sampleOwner as any)[key] || '';
        formatted = formatted.replace(new RegExp(`\\{\\{owner\\.${key}\\}\\}`, 'g'), value);
        formatted = formatted.replace(new RegExp(`\\{owner\\.${key}\\}`, 'g'), value);
      });
    }

    // Substituir variáveis do sistema
    formatted = formatted.replace(/\{\{app_name\}\}/g, 'ImoGuru');
    formatted = formatted.replace(/\{app_name\}/g, 'ImoGuru');
    formatted = formatted.replace(/\{\{logo_url\}\}/g, '[Logo da empresa]');
    formatted = formatted.replace(/\{logo_url\}/g, '[Logo da empresa]');

    // Limpar placeholders não preenchidos
    formatted = formatted.replace(/\{\{[^}]+\}\}/g, '[não disponível]');
    formatted = formatted.replace(/\{[^}]+\}/g, '[não disponível]');

    return formatted;
  };

  const isHtmlContent = (content: string) => {
    return content.includes('<') && content.includes('>');
  };

  const content = formatContent();
  const isHtml = isHtmlContent(template.message_format || template.content || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          {template.platform && (
            <p className="text-sm text-muted-foreground capitalize">
              Plataforma: {template.platform}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">
              Preview com dados de exemplo:
            </p>
            
            {isHtml ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {content}
              </pre>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>💡 Este é um preview usando dados de exemplo. O conteúdo real será preenchido com os dados do imóvel e proprietário.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
