import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Building2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandingPreview from '@/components/BrandingPreview';
import CompanyManagement from '@/components/CompanyManagement';
import UserManagement from '@/components/UserManagement';
import { ApiKeysManagement } from '@/components/ApiKeysManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SystemSettings {
  app_name: string; // Será 'Versão do Sistema'
  system_display_name?: string; // Novo campo para o 'Nome do Sistema' exibido
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
  logo_size_login?: number;
  show_dashboard_metrics?: boolean;
  show_dashboard_charts?: boolean;
  font_family?: string; // Novo campo
  font_size?: number; // Novo campo
  show_version_in_header?: boolean; // Flag para exibir/ocultar versão no cabeçalho
}

export default function Settings() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  
  // Ordem das abas de configurações
  const settingsTabsOrder = ['system', 'companies', 'users', 'apis', 'advanced'];
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'LITE 1.0',
    system_display_name: 'ImoGuru Rose Real State',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    max_images_per_property: 20,
    max_image_size_mb: 5,
    video_upload_enabled: false,
    video_links_enabled: true,
    logo_size_mobile: 40,
    logo_size_tablet: 48,
    logo_size_desktop: 56,
    logo_size_login: 48,
    show_dashboard_metrics: true,
    show_dashboard_charts: true,
    font_family: 'Arial',
    font_size: 24,
    show_version_in_header: true,
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
        .select('setting_key, setting_value')
        .in('setting_key', [
          'app_name',
          'system_display_name',
          'primary_color',
          'secondary_color',
          'max_images_per_property',
          'max_image_size_mb',
          'video_upload_enabled',
          'video_links_enabled',
          'logo_url',
          'favicon_url',
          'logo_size_mobile',
          'logo_size_tablet',
          'logo_size_desktop',
          'logo_size_login',
          'show_dashboard_metrics',
          'show_dashboard_charts',
          'font_family',
          'font_size',
          'show_version_in_header',
        ]);

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

  const goToNextTab = () => {
    const currentIndex = settingsTabsOrder.indexOf(activeTab);
    if (currentIndex < settingsTabsOrder.length - 1) {
      const nextTab = settingsTabsOrder[currentIndex + 1];
      setActiveTab(nextTab);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = settingsTabsOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      const previousTab = settingsTabsOrder[currentIndex - 1];
      setActiveTab(previousTab);
    }
  };

  const isFirstTab = () => activeTab === settingsTabsOrder[0];
  const isLastTab = () => activeTab === settingsTabsOrder[settingsTabsOrder.length - 1];

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* TabsList com 5 itens: Sistema, Empresas, Usuários, APIs, Avançado */}
          <div className="w-full overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
            <TabsList className="inline-flex h-10 w-max min-w-full sm:w-full sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2 flex-nowrap sm:flex-wrap">
              <TabsTrigger value="system" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Sistema</TabsTrigger>
              <TabsTrigger value="companies" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Empresas</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Usuários</TabsTrigger>
              <TabsTrigger value="apis" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">APIs</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Avançado</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Configure a identidade visual do sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Novo campo para Nome do Sistema */}
              <div>
                <Label htmlFor="system_display_name">Nome do Sistema</Label>
                <Input
                  id="system_display_name"
                  value={settings.system_display_name || ''}
                  onChange={(e) => setSettings({ ...settings, system_display_name: e.target.value })}
                  placeholder="Nome completo do sistema (Ex: ImoGuru Rose Real State)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome que aparecerá no sistema, na tela de login e nas comunicações
                </p>
              </div>

              {/* Campo existente renomeado para Versão do Sistema */}
              <div>
                <Label htmlFor="app_name">Versão do Sistema</Label>
                <Input
                  id="app_name"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  placeholder="LITE 1.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: LITE 1.0, Enterprise Edition
                </p>
              </div>

              {/* Flag para exibir/ocultar versão no cabeçalho */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="show_version_in_header">Exibir Versão no Cabeçalho</Label>
                  <p className="text-xs text-muted-foreground">
                    Controla se a versão do sistema aparece no cabeçalho de todas as páginas
                  </p>
                </div>
                <Switch
                  id="show_version_in_header"
                  checked={settings.show_version_in_header ?? true}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_version_in_header: checked })}
                />
              </div>

              {/* Font Family Selection */}
              <div>
                <Label htmlFor="font_family">Fonte do Sistema</Label>
                <Select
                  value={settings.font_family}
                  onValueChange={(value) => setSettings({ ...settings, font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Tahoma">Tahoma</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Lucida Console">Lucida Console</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Escolha a fonte principal para a versão do sistema
                </p>
              </div>

              {/* Font Size Input */}
              <div>
                <Label htmlFor="font_size">Tamanho da Fonte (px)</Label>
                <Input
                  id="font_size"
                  type="number"
                  min="12"
                  max="48"
                  value={settings.font_size}
                  onChange={(e) => setSettings({ ...settings, font_size: parseInt(e.target.value) })}
                  placeholder="24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ajuste o tamanho da fonte para a versão do sistema
                </p>
              </div>

              {/* Logo do Sistema e Favicon em uma nova linha */}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo do Sistema */}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload de logo personalizado (PNG, JPG ou SVG, máx. 2MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload de favicon (ICO, PNG 32x32, máx. 500KB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tamanho do Logo no Dashboard (pixels) e Tamanho do Logo na Tela de Login (pixels) em uma nova linha */}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tamanho do Logo no Dashboard (pixels) - Mais largo */}
                <div className="space-y-3">
                  <Label>Tamanho do Logo no Dashboard (pixels)</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste o tamanho do logo para cada tipo de dispositivo no dashboard
                  </p>
                </div>

                {/* Tamanho do Logo na Tela de Login (pixels) - Agora com lg:col-span-2 para caber o título */}
                <div className="space-y-2">
                  <Label htmlFor="logo_size_login">Tamanho do Logo na Tela de Login (pixels)</Label>
                  <Input
                    id="logo_size_login"
                    type="number"
                    min="24"
                    max="120"
                    value={settings.logo_size_login}
                    onChange={(e) => setSettings({ ...settings, logo_size_login: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste o tamanho do logo exibido na tela de login
                  </p>
                </div>
              </div>

              {/* Cores - Em uma nova linha */}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="col-span-1 sm:col-span-2 flex items-center justify-between">
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
              <div className="col-span-1 sm:col-span-2 flex items-center justify-between">
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
            appName={settings.system_display_name || settings.app_name}
            appVersion={settings.app_name} // Passar a versão do sistema
            primaryColor={settings.primary_color}
            secondaryColor={settings.secondary_color}
            logoUrl={settings.logo_url}
            faviconUrl={settings.favicon_url}
            logoSizeDesktop={settings.logo_size_desktop} // Passar o tamanho do logo para desktop
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

          <div className="flex flex-wrap justify-center sm:justify-between gap-2 mt-6">
            <div className="flex gap-2">
              <Button onClick={goToPreviousTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isFirstTab()}>
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Aba Anterior</span>
              </Button>
              <Button onClick={goToNextTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isLastTab()}>
                <span className="hidden sm:inline">Próxima Aba</span>
                <ChevronRight className="h-4 w-4 sm:ml-2" />
              </Button>
            </div>
            <Button onClick={handleSave} disabled={saving || uploading} size="sm" className="text-xs sm:text-sm">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
              <span className="sm:hidden">{saving ? '...' : '✓'}</span>
            </Button>
          </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <CompanyManagement />
            <div className="flex flex-wrap justify-center sm:justify-between gap-2 mt-6">
              <div className="flex gap-2">
                <Button onClick={goToPreviousTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isFirstTab()}>
                  <ChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aba Anterior</span>
                </Button>
                <Button onClick={goToNextTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isLastTab()}>
                  <span className="hidden sm:inline">Próxima Aba</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving || uploading} size="sm" className="text-xs sm:text-sm">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                <span className="sm:hidden">{saving ? '...' : '✓'}</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
            <div className="flex flex-wrap justify-center sm:justify-between gap-2 mt-6">
              <div className="flex gap-2">
                <Button onClick={goToPreviousTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isFirstTab()}>
                  <ChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aba Anterior</span>
                </Button>
                <Button onClick={goToNextTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isLastTab()}>
                  <span className="hidden sm:inline">Próxima Aba</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving || uploading} size="sm" className="text-xs sm:text-sm">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                <span className="sm:hidden">{saving ? '...' : '✓'}</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <ApiKeysManagement />
            <div className="flex flex-wrap justify-center sm:justify-between gap-2 mt-6">
              <div className="flex gap-2">
                <Button onClick={goToPreviousTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isFirstTab()}>
                  <ChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aba Anterior</span>
                </Button>
                <Button onClick={goToNextTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isLastTab()}>
                  <span className="hidden sm:inline">Próxima Aba</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving || uploading} size="sm" className="text-xs sm:text-sm">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                <span className="sm:hidden">{saving ? '...' : '✓'}</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/settings/company-public-page')}
                >
                  Página Pública da Empresa
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/settings/property-public-page')}
                >
                  Página Pública do Imóvel
                </Button>
              </CardContent>
            </Card>
            <div className="flex flex-wrap justify-center sm:justify-between gap-2 mt-6">
              <div className="flex gap-2">
                <Button onClick={goToPreviousTab} variant="outline" size="sm" className="text-xs sm:text-sm" disabled={isFirstTab()}>
                  <ChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Aba Anterior</span>
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving || uploading} size="sm" className="text-xs sm:text-sm">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                <span className="sm:hidden">{saving ? '...' : '✓'}</span>
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
