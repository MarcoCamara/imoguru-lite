import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface BrandingPreviewProps {
  appName: string;
  appVersion: string; // Novo prop para a versão do sistema
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  logoSizeDesktop?: number; // Novo prop para o tamanho do logo no desktop
}

export default function BrandingPreview({ appName, appVersion, primaryColor, secondaryColor, logoUrl, faviconUrl, logoSizeDesktop }: BrandingPreviewProps) {
  const logoDisplaySize = logoSizeDesktop ? `${logoSizeDesktop}px` : '96px'; // Usar logoSizeDesktop ou um default maior

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
              className="flex items-center justify-center overflow-hidden"
              style={{ 
                backgroundColor: logoUrl ? 'transparent' : primaryColor, 
                height: logoDisplaySize, 
                width: logoDisplaySize,
                borderRadius: '0.5rem'
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 style={{ height: `calc(${logoDisplaySize} * 0.5)`, width: `calc(${logoDisplaySize} * 0.5)` }} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {appName || 'ImoGuru Rose Real State'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {appVersion || 'LITE 1.0'}
              </p>
            </div>
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
