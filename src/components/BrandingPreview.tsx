import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface BrandingPreviewProps {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export default function BrandingPreview({ appName, primaryColor, secondaryColor, logoUrl, faviconUrl }: BrandingPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview do Branding</CardTitle>
        <CardDescription>Veja como ficará a identidade visual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: logoUrl ? 'transparent' : primaryColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
              {appName || 'ImoGuru'}
            </h2>
            {faviconUrl && (
              <div className="ml-auto h-8 w-8 rounded flex items-center justify-center overflow-hidden border">
                <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <button 
              className="w-full px-4 py-2 rounded-md text-white font-medium transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Botão Primário
            </button>
            
            <button 
              className="w-full px-4 py-2 rounded-md text-white font-medium transition-colors"
              style={{ backgroundColor: secondaryColor }}
            >
              Botão Secundário
            </button>
            
            <div className="p-4 rounded-md" style={{ backgroundColor: `${primaryColor}20` }}>
              <p className="text-sm" style={{ color: primaryColor }}>
                Exemplo de card com cor primária
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>• As cores serão aplicadas automaticamente em todo o sistema</p>
          <p>• Logo e favicon podem ser customizados via upload acima</p>
          <p>• Salve as configurações para aplicar as mudanças</p>
        </div>
      </CardContent>
    </Card>
  );
}
