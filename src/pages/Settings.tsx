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
import { ArrowLeft, Save } from 'lucide-react';

interface SystemSettings {
  app_name: string;
  primary_color: string;
  secondary_color: string;
  max_images_per_property: number;
  max_image_size_mb: number;
  video_upload_enabled: boolean;
  video_links_enabled: boolean;
}

export default function Settings() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'ImoGuru',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    max_images_per_property: 20,
    max_image_size_mb: 5,
    video_upload_enabled: false,
    video_links_enabled: true,
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
        const value = item.setting_value;
        settingsObj[item.setting_key] = typeof value === 'string' ? JSON.parse(value) : value;
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: JSON.stringify(value),
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
                />
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
