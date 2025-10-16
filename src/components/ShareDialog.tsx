import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Mail, Facebook, Instagram, Send, Link2, Eye, Check, Globe } from 'lucide-react';
import {
  type SharePlatform,
  getShareTemplates,
  formatMessageWithTemplate,
  getPropertyImages,
  shareToWhatsApp,
  shareToEmail,
  shareToMessenger,
  shareToFacebook,
  shareToInstagram,
  trackShare,
  canUseWebShare,
  shareViaWebShare,
  copyToClipboard,
} from '@/lib/shareUtils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: any;
}

const platformConfig = {
  whatsapp: { 
    icon: MessageCircle, 
    label: 'WhatsApp', 
    color: 'text-green-600',
    instruction: 'Abrirá WhatsApp Web (desktop) ou app (mobile)'
  },
  email: { 
    icon: Mail, 
    label: 'Email', 
    color: 'text-blue-600',
    instruction: 'Digite o email do destinatário para enviar'
  },
  messenger: { 
    icon: Send, 
    label: 'Messenger', 
    color: 'text-blue-500',
    instruction: 'Texto copiado! Abra o Messenger e cole'
  },
  facebook: { 
    icon: Facebook, 
    label: 'Facebook', 
    color: 'text-blue-700',
    instruction: 'Texto copiado! Cole ao criar post no Facebook'
  },
  instagram: { 
    icon: Instagram, 
    label: 'Instagram', 
    color: 'text-pink-600',
    instruction: 'Texto copiado! Cole na legenda ao criar post'
  },
};

export default function ShareDialog({ open, onOpenChange, property }: ShareDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<SharePlatform[]>(['whatsapp']);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any>({ app_name: 'ImoGuru', logo_url: null });
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplates();
      loadSystemSettings();
    }
  }, [open]);

  const loadSystemSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'logo_url']);

      const settings: any = { app_name: 'ImoGuru', logo_url: null };
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      setSystemSettings(settings);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await getShareTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar templates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const togglePlatform = (platform: SharePlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleCopyLink = async () => {
    const propertyUrl = `${window.location.origin}/property/${property.id}`;
    const success = await copyToClipboard(propertyUrl);
    
    if (success) {
      toast({
        title: '✅ Link copiado!',
        description: 'O link do imóvel foi copiado para área de transferência.',
        duration: 5000,
      });
    } else {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Selecione uma plataforma',
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.platform === selectedPlatforms[0]);
    if (template) {
      const message = await formatMessageWithTemplate(template, property);
      setPreviewMessage(message);
      setShowPreview(true);
    }
  };

  const handleWebShare = async () => {
    const propertyUrl = `${window.location.origin}/property/${property.id}`;
    const template = templates.find(t => t.platform === 'whatsapp');
    const message = template ? await formatMessageWithTemplate(template, property) : '';
    
    const success = await shareViaWebShare(
      `Imóvel - ${property.title || property.property_type}`,
      message,
      propertyUrl
    );

    if (success) {
      await trackShare(property.id, 'whatsapp');
      toast({
        title: '✅ Compartilhado com sucesso!',
        duration: 3000,
      });
      onOpenChange(false);
    }
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Selecione ao menos uma plataforma',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      for (const platform of selectedPlatforms) {
        const template = templates.find(t => t.platform === platform);
        if (!template) continue;

        const message = await formatMessageWithTemplate(template, property);
        const images = getPropertyImages(property, template.max_images);

        let result: any = false;

        switch (platform) {
          case 'whatsapp':
            result = await shareToWhatsApp(message, images);
            break;
          case 'email':
            result = await shareToEmail(property, message, images, systemSettings);
            break;
          case 'messenger':
            result = await shareToMessenger(message);
            break;
          case 'facebook':
            result = await shareToFacebook(message, images);
            break;
          case 'instagram':
            result = await shareToInstagram(message);
            break;
        }

        if (result) {
          await trackShare(property.id, platform);
          
          if (result === 'clipboard') {
            toast({
              title: `✅ ${platformConfig[platform].label}`,
              description: platformConfig[platform].instruction,
              duration: 7000,
            });
          } else {
            toast({
              title: `✅ ${platformConfig[platform].label}`,
              description: platformConfig[platform].instruction,
              duration: 5000,
            });
          }
        }
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao compartilhar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Imóvel</DialogTitle>
          <DialogDescription>
            Selecione as plataformas onde deseja compartilhar este imóvel
          </DialogDescription>
        </DialogHeader>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Web Share API Button (if available) */}
            {canUseWebShare() && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <Button 
                  onClick={handleWebShare} 
                  className="w-full"
                  size="lg"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  Compartilhar via Sistema
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Escolha o app de preferência no seu dispositivo
                </p>
              </div>
            )}

            {/* Copy Link Button */}
            <Button 
              onClick={handleCopyLink} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Link2 className="mr-2 h-5 w-5" />
              Copiar Link do Imóvel
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou compartilhe diretamente
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const Icon = config.icon;
                const template = templates.find(t => t.platform === platform);
                
                if (!template) return null;

                return (
                  <div key={platform} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={platform}
                        checked={selectedPlatforms.includes(platform as SharePlatform)}
                        onCheckedChange={() => togglePlatform(platform as SharePlatform)}
                      />
                      <Label
                        htmlFor={platform}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <div className="flex-1">
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.instruction}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Preview */}
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handlePreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Ocultar Preview' : 'Ver Preview da Mensagem'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {previewMessage || 'Selecione uma plataforma para ver o preview'}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 justify-end pt-4">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const Icon = config.icon;
                const template = templates.find(t => t.platform === platform);
                
                if (!template) return null;

                return (
                  <div key={platform} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={platform}
                        checked={selectedPlatforms.includes(platform as SharePlatform)}
                        onCheckedChange={() => togglePlatform(platform as SharePlatform)}
                      />
                      <Label
                        htmlFor={platform}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <div className="flex-1">
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.instruction}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Preview */}
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handlePreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Ocultar Preview' : 'Ver Preview da Mensagem'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {previewMessage || 'Selecione uma plataforma para ver o preview'}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleShare} disabled={loading || selectedPlatforms.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Compartilhar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
