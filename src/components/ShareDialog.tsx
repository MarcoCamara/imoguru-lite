import { useState, useEffect } from 'react';
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
import { Loader2, MessageCircle, Mail, Facebook, Instagram, Send } from 'lucide-react';
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
} from '@/lib/shareUtils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: any;
}

const platformConfig = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-600' },
  messenger: { icon: Send, label: 'Messenger', color: 'text-blue-500' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-700' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
};

export default function ShareDialog({ open, onOpenChange, property }: ShareDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<SharePlatform[]>(['whatsapp']);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

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
            result = await shareToEmail(property, message, images);
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
              title: `${platformConfig[platform].label}: Copiado!`,
              description: 'Texto copiado para área de transferência. Cole no Instagram.',
            });
          } else {
            toast({
              title: `Compartilhado via ${platformConfig[platform].label}!`,
              description: platform === 'whatsapp' ? 'Selecione os contatos para enviar.' : undefined,
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
      <DialogContent className="sm:max-w-md">
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
            <div className="space-y-4">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const Icon = config.icon;
                const template = templates.find(t => t.platform === platform);
                
                if (!template) return null;

                return (
                  <div key={platform} className="flex items-center space-x-3">
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
                      <span className="font-medium">{config.label}</span>
                    </Label>
                  </div>
                );
              })}
            </div>

            {selectedPlatforms.includes('instagram') && (
              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                <strong>Instagram:</strong> O texto será copiado para a área de transferência.
                Cole-o ao criar um novo post.
              </div>
            )}

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
