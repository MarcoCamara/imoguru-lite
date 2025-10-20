import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface TemplatePreviewLiveProps {
  content: string;
  width: number;
  height: number;
  type: 'share' | 'print' | 'authorization';
}

export function TemplatePreviewLive({ content, width, height, type }: TemplatePreviewLiveProps) {
  // Mock data para preview
  const mockData = {
    title: 'Apartamento no Centro',
    code: 'IMO-001234',
    property_type: 'Apartamento',
    city: 'São Paulo',
    neighborhood: 'Centro',
    sale_price: 'R$ 450.000',
    rental_price: 'R$ 2.500',
    bedrooms: '3',
    bathrooms: '2',
    parking_spaces: '2',
    total_area: '85',
    street: 'Rua das Flores',
    description: 'Lindo apartamento no coração da cidade',
    owner_name: 'João Silva',
    owner_cpf_cnpj: '123.456.789-00',
    owner_email: 'joao@email.com',
    owner_phone: '(11) 98765-4321',
    full_address: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    price: 'R$ 450.000',
    date: new Date().toLocaleDateString('pt-BR'),
    agency_name: 'ImoGuru',
    purpose: 'venda',
  };

  // Replace placeholders with mock data
  const processedContent = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return mockData[key as keyof typeof mockData] || match;
  });

  const aspectRatio = width / height;
  const scale = Math.min(1, 600 / width); // Scale to fit max 600px width

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-sm">Preview em Tempo Real</h3>
          <p className="text-xs text-muted-foreground">
            {width}x{height}px (escala: {Math.round(scale * 100)}%)
          </p>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <AspectRatio ratio={aspectRatio}>
            <div 
              className="w-full h-full overflow-auto p-4"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${100 / scale}%`,
                height: `${100 / scale}%`,
              }}
            >
              {type === 'print' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {processedContent}
                </div>
              )}
            </div>
          </AspectRatio>
        </div>
      </CardContent>
    </Card>
  );
}