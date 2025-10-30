import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TemplatePreviewLiveProps {
  content: string;
  width: number;
  height: number;
  type: 'share' | 'print' | 'authorization';
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  photoColumns?: number;
  photoPlacement?: 'before_text' | 'after_text' | 'intercalated';
  maxPhotos?: number;
  showPhotos?: boolean;
}

export function TemplatePreviewLive({ content, width, height, type, zoomLevel = 1.0, onZoomChange, photoColumns = 1, photoPlacement = 'after_text', maxPhotos = 10, showPhotos = true }: TemplatePreviewLiveProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    const newZoom = Math.min(4.0, zoomLevel + 0.25);
    if (onZoomChange) onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.25, zoomLevel - 0.25);
    if (onZoomChange) onZoomChange(newZoom);
  };
  
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
    useful_area: '75',
    street: 'Rua das Flores',
    number: '123',
    state: 'SP',
    description: 'Lindo apartamento no coração da cidade com vista panorâmica e acabamento de primeira linha.',
    owner_name: 'João Silva',
    owner_cpf_cnpj: '123.456.789-00',
    owner_email: 'joao@email.com',
    owner_phone: '(11) 98765-4321',
    full_address: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    price: 'R$ 450.000',
    date: new Date().toLocaleDateString('pt-BR'),
    agency_name: 'ImoGuru Rose Real State',
    purpose: 'Venda',
    status: 'Disponível',
    qrcode: '<div style="width: 120px; height: 120px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; background: #f5f5f5; margin: 10px auto;">QR Code</div>',
    system_logo: '<div style="width: 100px; height: 40px; border: 1px solid #ccc; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 10px;">Logo Sistema</div>',
    company_logo: '<div style="width: 100px; height: 40px; border: 1px solid #ccc; background: #d0d0d0; display: flex; align-items: center; justify-content: center; font-size: 10px;">Logo Empresa</div>',
    company_primary_color: '#8b5cf6',
    company_secondary_color: '#ec4899',
    images: [
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+1',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+2',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+3',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+4',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+5',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Foto+6',
    ]
  };

  // Geração de grid de imagens mockadas (só se showPhotos for true)
  const photosToShow = showPhotos ? mockData.images.slice(0, maxPhotos) : [];
  const photoWidth = Math.floor(width / photoColumns) - 10; // Calcula largura baseada nas colunas e na largura do template
  
  const mockImagesGrid = showPhotos ? `
    <div style="display: grid; grid-template-columns: repeat(${photoColumns}, 1fr); gap: 8px; margin-top: 16px; margin-bottom: 16px;">
      ${photosToShow.map(imgSrc => `<img src="${imgSrc}" style="width: 100%; max-width: ${photoWidth}px; height: auto; object-fit: cover;" />`).join('')}
    </div>
  ` : '';

  // Primeiro processar line_break
  let processedContent = content.replace(/\{\{line_break\}\}/g, '<br><br>');
  
  // Depois processar outros placeholders
  processedContent = processedContent.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key === 'images') return ''; // Remove placeholder original se existir, será inserido depois
    if (key === 'qrcode' || key === 'system_logo' || key === 'company_logo') {
      // Retornar HTML dos placeholders visuais
      return mockData[key as keyof typeof mockData] as string || match;
    }
    const value = mockData[key as keyof typeof mockData];
    return value !== undefined ? String(value) : match;
  });

  // Inserir a grade de imagens com base no photoPlacement
  if (type === 'print') {
    if (photoPlacement === 'before_text') {
      processedContent = mockImagesGrid + processedContent;
    } else if (photoPlacement === 'after_text') {
      processedContent = processedContent + mockImagesGrid;
    } else if (photoPlacement === 'intercalated') {
      const paragraphs = processedContent.split(/(<p>.*?<\/p>)/g).filter(p => p.trim() !== '');
      let imageIndex = 0;
      let newContent = [];
      for (let i = 0; i < paragraphs.length; i++) {
        newContent.push(paragraphs[i]);
        if (imageIndex < mockData.images.length) {
          newContent.push(mockImagesGrid);
          imageIndex++;
        }
      }
      processedContent = newContent.join('');
    }
  } else if (type === 'share') {
    // Para templates de compartilhamento, sempre adicionar fotos no final
    processedContent = processedContent + mockImagesGrid;
  }

  const aspectRatio = width / height;
  const scale = zoomLevel; // Escala direta: 1.0 = 100%, 2.0 = 200%, etc

  const PreviewContent = () => (
    <div 
      className="w-full h-full overflow-auto p-4"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
        height: `${100 / scale}%`,
      }}
    >
      {type === 'print' || type === 'share' ? (
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
  );

  return (
    <>
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Preview em Tempo Real</h3>
              <p className="text-xs text-muted-foreground">
                {width}x{height}px (escala: {Math.round(scale * 100)}%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Controles de Zoom */}
              {onZoomChange && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              {/* Botão Tela Cheia */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Tela Cheia
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <AspectRatio ratio={aspectRatio}>
              <PreviewContent />
            </AspectRatio>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Tela Cheia */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="relative w-full h-full">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full h-full overflow-auto bg-white p-8">
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm max-w-5xl mx-auto">
                <AspectRatio ratio={aspectRatio}>
                  <PreviewContent />
                </AspectRatio>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}