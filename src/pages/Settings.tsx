import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import BrandingPreview from '@/components/BrandingPreview';

interface SystemSettings {
  app_name: string;
  primary_color: string;
  secondary_color: string;
  max_images_per_property: number;
  max_image_size_mb: number;
  video_upload_enabled: boolean;
  video_links_enabled: boolean;
  logo_url?: string;
  favicon_url?: string;
  logo_size_mobile?: number;
  logo_size_tablet?: number;
  logo_size_desktop?: number;
  show_dashboard_metrics?: boolean;
  show_dashboard_charts?: boolean;
}

export default function Settings() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'ImoGuru',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    max_images_per_property: 20,
    max_image_size_mb: 5,
    video_upload_enabled: false,
    video_links_enabled: true,
    logo_size_mobile: 40,
    logo_size_tablet: 48,
    logo_size_desktop: 56,
    show_dashboard_metrics: true,
    show_dashboard_charts: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar as configurações.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      loadSettings();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach((item) => {
        // setting_value is jsonb, Supabase already parses it
        settingsObj[item.setting_key] = item.setting_value;
      });

      setSettings((prev) => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'O arquivo deve ter no máximo 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('system-branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('system-branding')
        .getPublicUrl(fileName);

      setSettings({ ...settings, logo_url: publicUrl });

      toast({
        title: 'Sucesso',
        description: 'Logo enviado com sucesso!',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o logo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({
        title: 'Erro',
        description: 'O favicon deve ter no máximo 500KB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon/favicon.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('system-branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('system-branding')
        .getPublicUrl(fileName);

      setSettings({ ...settings, favicon_url: publicUrl });

      toast({
        title: 'Sucesso',
        description: 'Favicon enviado com sucesso! As mudanças serão aplicadas após salvar.',
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o favicon.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        // setting_value is jsonb, no need to stringify
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">Gerencie as configurações do ImoGuru</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Configure a identidade visual do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app_name">Nome do Sistema</Label>
                <Input
                  id="app_name"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  placeholder="ImoGuru"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome que aparecerá no sistema e nas comunicações
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Logo do Sistema</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center bg-muted overflow-hidden">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      className="cursor-pointer"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload de logo personalizado (PNG, JPG ou SVG, máx. 2MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 border-2 border-dashed rounded-md flex items-center justify-center bg-muted overflow-hidden">
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                      className="cursor-pointer"
                      onChange={handleFaviconUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload de favicon (ICO, PNG 32x32, máx. 500KB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Tamanho do Logo (pixels)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="logo_size_mobile" className="text-xs text-muted-foreground">
                      Mobile
                    </Label>
                    <Input
                      id="logo_size_mobile"
                      type="number"
                      min="24"
                      max="80"
                      value={settings.logo_size_mobile}
                      onChange={(e) => setSettings({ ...settings, logo_size_mobile: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_size_tablet" className="text-xs text-muted-foreground">
                      Tablet
                    </Label>
                    <Input
                      id="logo_size_tablet"
                      type="number"
                      min="24"
                      max="96"
                      value={settings.logo_size_tablet}
                      onChange={(e) => setSettings({ ...settings, logo_size_tablet: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_size_desktop" className="text-xs text-muted-foreground">
                      Desktop
                    </Label>
                    <Input
                      id="logo_size_desktop"
                      type="number"
                      min="24"
                      max="120"
                      value={settings.logo_size_desktop}
                      onChange={(e) => setSettings({ ...settings, logo_size_desktop: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ajuste o tamanho do logo para cada tipo de dispositivo
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Mídia</CardTitle>
              <CardDescription>Defina limites para upload de imagens e vídeos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_images">Máximo de Imagens por Imóvel</Label>
                  <Input
                    id="max_images"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.max_images_per_property}
                    onChange={(e) =>
                      setSettings({ ...settings, max_images_per_property: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max_size">Tamanho Máximo por Imagem (MB)</Label>
                  <Input
                    id="max_size"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.max_image_size_mb}
                    onChange={(e) =>
                      setSettings({ ...settings, max_image_size_mb: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="video_upload">Permitir Upload de Vídeos</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários poderão fazer upload de arquivos de vídeo
                  </p>
                </div>
                <Switch
                  id="video_upload"
                  checked={settings.video_upload_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, video_upload_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="video_links">Permitir Links de Vídeos</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários poderão adicionar links do YouTube, Vimeo, etc.
                  </p>
                </div>
                <Switch
                  id="video_links"
                  checked={settings.video_links_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, video_links_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <BrandingPreview
            appName={settings.app_name}
            primaryColor={settings.primary_color}
            secondaryColor={settings.secondary_color}
            logoUrl={settings.logo_url}
            faviconUrl={settings.favicon_url}
          />

          <Card>
            <CardHeader>
              <CardTitle>Visualização do Dashboard</CardTitle>
              <CardDescription>Configure o que será exibido na página principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_metrics">Mostrar Cards de Estatísticas</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir cards com total de imóveis, vendas, locações, etc.
                  </p>
                </div>
                <Switch
                  id="show_metrics"
                  checked={settings.show_dashboard_metrics ?? true}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, show_dashboard_metrics: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_charts">Mostrar Gráficos</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir gráficos de distribuição e compartilhamentos
                  </p>
                </div>
                <Switch
                  id="show_charts"
                  checked={settings.show_dashboard_charts ?? true}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, show_dashboard_charts: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento Avançado</CardTitle>
              <CardDescription>Acesse configurações avançadas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/share-templates')}
              >
                Templates de Compartilhamento
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/authorization-templates')}
              >
                Templates de Autorização
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/print-templates')}
              >
                Templates de Impressão
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
