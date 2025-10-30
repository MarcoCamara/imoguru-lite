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
import { Loader2, MessageCircle, Mail, Facebook, Instagram, Send, Link2, FileImage, FileText } from 'lucide-react';
import {
  type SharePlatform,
  type ExportFormat,
  getShareTemplates,
  formatMessageWithTemplate,
  getPropertyImages,
  shareToWhatsApp,
  shareToEmail,
  shareToMessenger,
  shareToFacebook,
  shareToInstagram,
  trackShare,
  copyToClipboard,
  exportTemplate,
} from '@/lib/shareUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: any[]; // Modificado para aceitar um array de propriedades
}

const platformConfig = {
  whatsapp: { 
    icon: MessageCircle, 
    label: 'WhatsApp', 
    color: 'text-green-600',
    instruction: 'Template copiado! Cole no WhatsApp'
  },
  email: { 
    icon: Mail, 
    label: 'Email', 
    color: 'text-blue-600',
    instruction: 'Abre email e copia HTML formatado'
  },
  messenger: { 
    icon: Send, 
    label: 'Messenger', 
    color: 'text-blue-500',
    instruction: 'Template copiado! Cole no Messenger'
  },
  facebook: { 
    icon: Facebook, 
    label: 'Facebook', 
    color: 'text-blue-700',
    instruction: 'Template copiado! Cole no Facebook'
  },
  instagram: { 
    icon: Instagram, 
    label: 'Instagram', 
    color: 'text-pink-600',
    instruction: 'Template copiado! Cole no Instagram'
  },
};

export default function ShareDialog({ open, onOpenChange, properties }: ShareDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<SharePlatform[]>(['whatsapp']);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<SharePlatform | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any>({ app_name: 'ImoGuru', logo_url: null });
  const [companySocialMedia, setCompanySocialMedia] = useState<{facebook?: string, instagram?: string}>({});
  const [selectedTemplateForPlatform, setSelectedTemplateForPlatform] = useState<Record<SharePlatform, string>>({
    whatsapp: '',
    email: '',
    messenger: '',
    facebook: '',
    instagram: '',
  });

  useEffect(() => {
    if (open && properties.length > 0) {
      loadTemplates();
      loadSystemSettings();
      loadCompanySocialMedia();
    }
  }, [open, properties]);

  useEffect(() => {
    // Inicializar selectedTemplateForPlatform quando templates são carregados
    if (templates.length > 0) {
      const initialSelection: Record<SharePlatform, string> = {
        whatsapp: '',
        email: '',
        messenger: '',
        facebook: '',
        instagram: '',
      };
      (Object.keys(platformConfig) as SharePlatform[]).forEach(platform => {
        const defaultTemplate = templates.find(t => t.platform === platform && t.is_default);
        if (defaultTemplate) {
          initialSelection[platform] = defaultTemplate.id;
        } else {
          const firstTemplate = templates.find(t => t.platform === platform);
          if (firstTemplate) {
            initialSelection[platform] = firstTemplate.id;
          }
        }
      });
      setSelectedTemplateForPlatform(initialSelection);
    }
  }, [templates]);

  const loadCompanySocialMedia = async () => {
    try {
      if (properties.length === 0) return;
      
      const companyId = properties[0].company_id;
      const { data, error } = await supabase
        .from('companies')
        .select('facebook, instagram')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      setCompanySocialMedia({
        facebook: data?.facebook || undefined,
        instagram: data?.instagram || undefined,
      });
    } catch (error) {
      console.error('Error loading company social media:', error);
    }
  };

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

  const handleCopyLink = async (platform?: SharePlatform) => {
    try {
      // Gerar links para todas as propriedades selecionadas (páginas públicas)
      const allPropertyUrls = await Promise.all(properties.map(async (prop) => {
        const { data: company } = await supabase
          .from('companies')
          .select('slug')
          .eq('id', prop.company_id)
          .single() as { data: { slug: string } | null };
        
        return `${window.location.origin}/public-property/${company?.slug || 'company'}/property/${prop.id}`;
      }));

      const linksString = allPropertyUrls.join('\n');

      const success = await copyToClipboard(linksString);
      
      if (success) {
        toast({
          title: '✅ Link(s) copiado(s)!',
          description: properties.length === 1 
            ? 'O link da página pública foi copiado.' 
            : `${properties.length} links foram copiados.`,
          duration: 3000,
        });
      } else {
        toast({
          title: 'Erro ao copiar',
          description: 'Não foi possível copiar os links.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error copying links:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar os links.',
        variant: 'destructive',
      });
    }
  };

  const handleShareLink = async (platform: SharePlatform) => {
    try {
      setLoadingPlatform(platform);
      
      // Gerar link para a propriedade
      const prop = properties[0];
      const { data: company } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', prop.company_id)
        .single() as { data: { slug: string } | null };
      
      const propertyUrl = `${window.location.origin}/public-property/${company?.slug || 'company'}/property/${prop.id}`;
      
      // Copiar para área de transferência
      await copyToClipboard(propertyUrl);
      
      // Abrir a rede social respectiva
      let socialUrl = '';
      switch (platform) {
        case 'whatsapp':
          socialUrl = `https://wa.me/?text=${encodeURIComponent(propertyUrl)}`;
          break;
        case 'facebook':
          socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
          break;
        case 'messenger':
          socialUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(propertyUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.href)}`;
          break;
        case 'instagram':
          // Instagram não permite compartilhamento direto via URL, então apenas copiar
          socialUrl = companySocialMedia.instagram || 'https://www.instagram.com/';
          break;
        case 'email':
          const subject = `Confira este imóvel: ${prop.title || prop.code}`;
          socialUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(propertyUrl)}`;
          break;
      }
      
      if (socialUrl) {
        window.open(socialUrl, '_blank');
      }
      
      toast({
        title: `✅ Link copiado e ${platformConfig[platform].label} aberto!`,
        description: 'Cole o link (Ctrl+V) na rede social',
        duration: 4000,
      });
      
      setLoadingPlatform(null);
    } catch (error) {
      console.error('Error sharing link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar o link.',
        variant: 'destructive',
      });
      setLoadingPlatform(null);
    }
  };

  const handleExport = async (platform: SharePlatform, format: ExportFormat) => {
    try {
      const templateId = selectedTemplateForPlatform[platform];
      if (!templateId) {
        toast({
          title: 'Erro',
          description: 'Selecione um template primeiro.',
          variant: 'destructive',
        });
        return;
      }

      const template = templates.find(t => t.id === templateId);
      if (!template) {
        toast({
          title: 'Erro',
          description: 'Template não encontrado.',
          variant: 'destructive',
        });
        return;
      }

      setLoadingPlatform(platform);

      // Exportar cada propriedade
      for (const prop of properties) {
        await exportTemplate(template, prop, format);
      }

      toast({
        title: `✅ ${format.toUpperCase()} exportado!`,
        description: properties.length === 1 
          ? `Template exportado como ${format.toUpperCase()}.` 
          : `${properties.length} templates exportados como ${format.toUpperCase()}.`,
        duration: 3000,
      });

      setLoadingPlatform(null);
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o template.',
        variant: 'destructive',
      });
      setLoadingPlatform(null);
    }
  };

  const handleShare = async (platformToShare: SharePlatform, templateId: string, closeAfter: boolean = false) => {
    console.log(`🚀 Iniciando compartilhamento em ${platformToShare} com template ${templateId}`);
    setLoadingPlatform(platformToShare);

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error(`Template não encontrado para ${platformConfig[platformToShare].label}.`);

      // Compartilhar cada propriedade individualmente
      for (const prop of properties) {
        // Para email, gerar HTML. Para outras plataformas, gerar texto simples
        const forceHtml = platformToShare === 'email';
        const message = await formatMessageWithTemplate(template, prop, forceHtml);
        const images = getPropertyImages(prop, template.max_images);

        let result: any = false;

        switch (platformToShare) {
          case 'whatsapp':
            console.log(`📱 Compartilhando em WhatsApp`);
            result = await shareToWhatsApp(message, images);
            break;
          case 'email':
            console.log(`📧 Compartilhando em Email`);
            result = await shareToEmail(prop, message, images, systemSettings);
            if (result) {
              toast({
                title: '📧 Email preparado!',
                description: 'O conteúdo HTML formatado foi copiado. Cole (Ctrl+V) no corpo do email que será aberto.',
                duration: 6000,
              });
            }
            break;
          case 'messenger':
            console.log(`💬 Compartilhando em Messenger`);
            result = await shareToMessenger(message);
            break;
          case 'facebook':
            console.log(`👍 Compartilhando em Facebook`);
            result = await shareToFacebook(message, images, companySocialMedia.facebook);
            break;
          case 'instagram':
            console.log(`📷 Compartilhando em Instagram`);
            result = await shareToInstagram(message, companySocialMedia.instagram);
            break;
        }

        console.log(`✅ Resultado do compartilhamento em ${platformToShare}:`, result);
        
        if (result) {
          let contactInfo: { email?: string } | undefined;
          if (platformToShare === 'email') {
            contactInfo = { email: undefined };
          }
          await trackShare(prop.id, platformToShare, contactInfo);
        }
      }

      // Toast genérico (exceto para email que já tem toast específico)
      if (platformToShare !== 'email') {
        toast({
          title: `✅ ${platformConfig[platformToShare].label} aberto!`,
          description: `Template copiado para área de transferência. Cole (Ctrl+V) no ${platformConfig[platformToShare].label}`,
          duration: 5000,
        });
      }

      // Só fecha o diálogo se closeAfter for true (chamado por handleShareAllSelected)
      if (closeAfter) {
        onOpenChange(false);
      }

    } catch (error: any) {
      console.error(`Erro ao compartilhar em ${platformToShare}:`, error);
      toast({
        title: 'Erro ao compartilhar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleShareAllSelected = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Selecione ao menos uma plataforma',
        description: 'Marque os checkboxes das plataformas que deseja compartilhar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    
    try {
      for (const platform of selectedPlatforms) {
        const templateId = selectedTemplateForPlatform[platform];
        if (templateId) {
          await handleShare(platform, templateId, false); // closeAfter = false, pois vamos fechar manualmente no final
          successCount++;
        }
      }
      
      // Fecha o diálogo após compartilhar todas as plataformas
      onOpenChange(false);
      
      toast({
        title: '✅ Compartilhamento concluído!',
        description: `Imóveis compartilhados em ${successCount} plataforma(s).`,
        duration: 4000,
      });
      
    } catch (error) {
      console.error("Erro ao compartilhar tudo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar em todas as plataformas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Imóvel</DialogTitle>
          <DialogDescription>
            Selecione as plataformas e templates para compartilhar este imóvel
          </DialogDescription>
        </DialogHeader>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Seção de Compartilhamento Direto */}
            <div className="space-y-4">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const Icon = config.icon;
                const platformTemplates = templates.filter(t => t.platform === platform);

                return (
                  <Card key={platform} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={platform}
                          checked={selectedPlatforms.includes(platform as SharePlatform)}
                          onCheckedChange={() => togglePlatform(platform as SharePlatform)}
                        />
                        <Label
                          htmlFor={platform}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Icon className={`h-6 w-6 ${config.color}`} />
                          <h4 className="font-semibold">{config.label}</h4>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Seletor de Template (sempre visível) */}
                        {platformTemplates.length > 0 && (
                          <Select
                            value={selectedTemplateForPlatform[platform as SharePlatform]}
                            onValueChange={(value) =>
                              setSelectedTemplateForPlatform(prev => ({ ...prev, [platform]: value }))
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[200px]">
                              <SelectValue placeholder="Selecionar Template" />
                            </SelectTrigger>
                            <SelectContent>
                              {platformTemplates.map(tpl => (
                                <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyLink(platform as SharePlatform)}
                          title="Copiar Link da Página Pública"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleExport(platform as SharePlatform, 'jpg')}
                          disabled={loadingPlatform !== null || !selectedTemplateForPlatform[platform as SharePlatform]}
                          title="Exportar como JPG"
                        >
                          <FileImage className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleExport(platform as SharePlatform, 'pdf')}
                          disabled={loadingPlatform !== null || !selectedTemplateForPlatform[platform as SharePlatform]}
                          title="Exportar como PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleShareLink(platform as SharePlatform)}
                          disabled={loadingPlatform !== null}
                          title="Compartilhar apenas o link da página pública"
                          className="flex-1"
                        >
                          {loadingPlatform === platform ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>🔗 </>}
                          Link
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleShare(platform as SharePlatform, selectedTemplateForPlatform[platform as SharePlatform])}
                          disabled={loadingPlatform !== null || !selectedTemplateForPlatform[platform as SharePlatform]}
                          title="Compartilhar com template formatado"
                          className="flex-1"
                        >
                          {loadingPlatform === platform && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Template
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-end pt-4 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
