import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplatePreview from '@/components/TemplatePreview';
import RichTextEditor from '@/components/RichTextEditor';
import { FormatSelector } from '@/components/template-editor/FormatSelector';
import { TemplatePreviewLive } from '@/components/template-editor/TemplatePreviewLive';

interface ShareTemplate {
  id: string;
  name: string;
  platform: string;
  message_format: string;
  fields: string[];
  include_images: boolean;
  max_images: number;
  is_default: boolean;
}

export default function ShareTemplates() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ShareTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ShareTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ShareTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formatWidth, setFormatWidth] = useState(1080);
  const [formatHeight, setFormatHeight] = useState(1080);

  const availableFields = [
    'title', 'code', 'purpose', 'property_type', 'status',
    'sale_price', 'rental_price', 'iptu_price', 'condo_price',
    'bedrooms', 'suites', 'bathrooms', 'parking_spaces',
    'total_area', 'useful_area', 'city', 'neighborhood',
    'street', 'description'
  ];

  const platforms = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' },
    { value: 'messenger', label: 'Messenger' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para gerenciar templates.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      loadTemplates();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('share_templates')
        .select('*')
        .order('platform');

      if (error) throw error;

      setTemplates(data?.map(t => ({
        ...t,
        fields: Array.isArray(t.fields) ? t.fields : JSON.parse(t.fields as string),
      })) || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('share_templates')
        .upsert({
          id: editingTemplate.id === 'new' ? undefined : editingTemplate.id,
          name: editingTemplate.name,
          platform: editingTemplate.platform,
          message_format: editingTemplate.message_format,
          fields: editingTemplate.fields,
          include_images: editingTemplate.include_images,
          max_images: editingTemplate.max_images,
          is_default: editingTemplate.is_default,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template salvo com sucesso!',
      });

      setDialogOpen(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('share_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso!',
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o template.',
        variant: 'destructive',
      });
    }
  };

  const handleNew = () => {
    setEditingTemplate({
      id: 'new',
      name: '',
      platform: 'whatsapp',
      message_format: '🏠 *{{title}}*\n\n📍 {{city}} - {{neighborhood}}\n\n💰 {{sale_price}}\n\n🛏️ {{bedrooms}} quartos\n🚿 {{bathrooms}} banheiros\n🚗 {{parking_spaces}} vagas\n📏 {{total_area}}m²',
      fields: ['title', 'city', 'neighborhood', 'sale_price', 'bedrooms', 'bathrooms', 'parking_spaces', 'total_area'],
      include_images: true,
      max_images: 5,
      is_default: false,
    });
    setDialogOpen(true);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Templates de Compartilhamento</h1>
            <p className="text-muted-foreground">Gerencie os templates para compartilhar imóveis</p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {template.is_default && <Badge>Padrão</Badge>}
                    </CardTitle>
                    <CardDescription className="capitalize">{template.platform}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setPreviewOpen(true);
                      }}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTemplate(template);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Campos incluídos:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.fields.map((field) => (
                        <Badge key={field} variant="outline">{field}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>Imagens:</strong> {template.include_images ? `Sim (máx: ${template.max_images})` : 'Não'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate?.id === 'new' ? 'Novo Template' : 'Editar Template'}
              </DialogTitle>
            </DialogHeader>

            {editingTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select
                    value={editingTemplate.platform}
                    onValueChange={(value) =>
                      setEditingTemplate({ ...editingTemplate, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Formato da Mensagem</Label>
                  <Tabs defaultValue="rich" className="mt-2">
                    <TabsList>
                      <TabsTrigger value="rich">Editor Visual</TabsTrigger>
                      <TabsTrigger value="text">Texto Simples</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rich">
                      <RichTextEditor
                        content={editingTemplate.message_format}
                        onChange={(content) =>
                          setEditingTemplate({ ...editingTemplate, message_format: content })
                        }
                      />
                    </TabsContent>
                    <TabsContent value="text">
                      <textarea
                        className="w-full min-h-[300px] p-4 border rounded-md"
                        value={editingTemplate.message_format}
                        onChange={(e) =>
                          setEditingTemplate({ ...editingTemplate, message_format: e.target.value })
                        }
                        placeholder="Use {{campo}} para inserir valores dinâmicos"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {`{{campo}}`} para inserir valores dinâmicos. Ex: {`{{title}}, {{price}}`}
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <div>
                  <Label>Campos Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFields.map((field) => (
                      <Badge
                        key={field}
                        variant={editingTemplate.fields.includes(field) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const fields = editingTemplate.fields.includes(field)
                            ? editingTemplate.fields.filter((f) => f !== field)
                            : [...editingTemplate.fields, field];
                          setEditingTemplate({ ...editingTemplate, fields });
                        }}
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include_images">Incluir Imagens</Label>
                    <p className="text-sm text-muted-foreground">
                      Anexar imagens ao compartilhamento
                    </p>
                  </div>
                  <Switch
                    id="include_images"
                    checked={editingTemplate.include_images}
                    onCheckedChange={(checked) =>
                      setEditingTemplate({ ...editingTemplate, include_images: checked })
                    }
                  />
                </div>

                {editingTemplate.include_images && (
                  <div>
                    <Label htmlFor="max_images">Máximo de Imagens</Label>
                    <Input
                      id="max_images"
                      type="number"
                      min="1"
                      max="20"
                      value={editingTemplate.max_images}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          max_images: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_default">Template Padrão</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar como padrão para esta plataforma
                    </p>
                  </div>
                  <Switch
                    id="is_default"
                    checked={editingTemplate.is_default}
                    onCheckedChange={(checked) =>
                      setEditingTemplate({ ...editingTemplate, is_default: checked })
                    }
                  />
                </div>

                  <FormatSelector
                    width={formatWidth}
                    height={formatHeight}
                    onChange={(w, h) => {
                      setFormatWidth(w);
                      setFormatHeight(h);
                    }}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar</Button>
                  </div>
                </div>

                <div className="sticky top-0">
                  <TemplatePreviewLive
                    content={editingTemplate.message_format}
                    width={formatWidth}
                    height={formatHeight}
                    type="share"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {previewTemplate && (
          <TemplatePreview
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            template={previewTemplate}
            type="share"
          />
        )}
      </div>
    </div>
  );
}
