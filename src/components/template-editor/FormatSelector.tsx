import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface FormatSize {
  width: number;
  height: number;
  label: string;
  category: string;
}

const predefinedFormats: FormatSize[] = [
  // Instagram
  { width: 1080, height: 1080, label: 'Post Quadrado', category: 'Instagram' },
  { width: 1080, height: 1350, label: 'Post Retrato', category: 'Instagram' },
  { width: 1080, height: 1920, label: 'Stories/Reels', category: 'Instagram' },
  
  // Facebook
  { width: 1200, height: 630, label: 'Post Paisagem', category: 'Facebook' },
  { width: 1080, height: 1080, label: 'Post Quadrado', category: 'Facebook' },
  { width: 820, height: 312, label: 'Capa', category: 'Facebook' },
  
  // WhatsApp
  { width: 1080, height: 1920, label: 'Status', category: 'WhatsApp' },
  { width: 800, height: 600, label: 'Imagem Compartilhável', category: 'WhatsApp' },
  
  // Impressão
  { width: 2480, height: 3508, label: 'A4 (300dpi)', category: 'Impressão' },
  { width: 3508, height: 4961, label: 'A3 (300dpi)', category: 'Impressão' },
  { width: 1754, height: 2480, label: 'A5 (300dpi)', category: 'Impressão' },
  
  // Email
  { width: 600, height: 800, label: 'Email Marketing', category: 'Email' },
  { width: 600, height: 400, label: 'Email Banner', category: 'Email' },
];

interface FormatSelectorProps {
  width: number;
  height: number;
  onChange: (width: number, height: number) => void;
}

export function FormatSelector({ width, height, onChange }: FormatSelectorProps) {
  const handlePresetChange = (value: string) => {
    if (value === 'custom') return;
    
    // Verificar se é um header (categoria)
    if (value.startsWith('header-')) return;
    
    const format = predefinedFormats.find(
      f => `${f.width}x${f.height}` === value
    );
    
    if (format) {
      onChange(format.width, format.height);
    }
  };

  const categories = Array.from(new Set(predefinedFormats.map(f => f.category)));
  
  // Encontrar o formato atual ou marcar como personalizado
  const currentValue = predefinedFormats.find(f => f.width === width && f.height === height) 
    ? `${width}x${height}` 
    : 'custom';

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label>Formato do Material</Label>
          <Select
            value={currentValue}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um formato">
                {currentValue === 'custom' 
                  ? `Personalizado (${width}x${height}px)` 
                  : predefinedFormats.find(f => `${f.width}x${f.height}` === currentValue)?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="custom">
                📐 Personalizado {currentValue === 'custom' ? `(${width}x${height}px)` : ''}
              </SelectItem>
              {categories.map((category, catIndex) => (
                <div key={`category-group-${category}`}>
                  {catIndex > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-muted/30 select-none">
                    {category === 'Instagram' && '📷 '}
                    {category === 'Facebook' && '👍 '}
                    {category === 'WhatsApp' && '💬 '}
                    {category === 'Email' && '📧 '}
                    {category === 'Impressão' && '🖨️ '}
                    {category}
                  </div>
                  {predefinedFormats
                    .filter(f => f.category === category)
                    .map((format, formatIndex) => (
                      <SelectItem
                        key={`${category}-${formatIndex}-${format.width}x${format.height}`}
                        value={`${format.width}x${format.height}`}
                        className="pl-6"
                      >
                        {format.label} <span className="text-muted-foreground text-xs">({format.width}×{format.height}px)</span>
                      </SelectItem>
                    ))
                  }
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width">Largura (px)</Label>
            <Input
              id="width"
              type="number"
              min="100"
              max="10000"
              value={width}
              onChange={(e) => onChange(parseInt(e.target.value) || 100, height)}
            />
          </div>
          <div>
            <Label htmlFor="height">Altura (px)</Label>
            <Input
              id="height"
              type="number"
              min="100"
              max="10000"
              value={height}
              onChange={(e) => onChange(width, parseInt(e.target.value) || 100)}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Proporção: {(width / height).toFixed(2)}:1
        </div>
      </CardContent>
    </Card>
  );
}