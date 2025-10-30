import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Eye, ZoomIn, ZoomOut, Copy, Archive, ArchiveRestore } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import TemplatePreview from '@/components/TemplatePreview';
import { FormatSelector } from '@/components/template-editor/FormatSelector';
import { TemplatePreviewLive } from '@/components/template-editor/TemplatePreviewLive';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PrintTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  photo_columns?: number;
  photo_placement?: 'before_text' | 'after_text' | 'intercalated';
  max_photos?: number;
  archived?: boolean;
}

export default function PrintTemplates() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formatWidth, setFormatWidth] = useState(2480);
  const [formatHeight, setFormatHeight] = useState(3508);
  const [zoomLevel, setZoomLevel] = useState(1.0); // Zoom inicial 100%
  const [showPhotosInPreview, setShowPhotosInPreview] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
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
        .from('print_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
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

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      if (editingTemplate.id) {
        const { error } = await supabase
          .from('print_templates')
          .update({
            name: editingTemplate.name,
            content: editingTemplate.content,
            is_default: editingTemplate.is_default,
            photo_columns: editingTemplate.photo_columns,
            photo_placement: editingTemplate.photo_placement,
            max_photos: editingTemplate.max_photos,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('print_templates')
          .insert({
            name: editingTemplate.name,
            content: editingTemplate.content,
            is_default: editingTemplate.is_default,
            photo_columns: editingTemplate.photo_columns || 1,
            photo_placement: editingTemplate.photo_placement || 'after_text',
            max_photos: editingTemplate.max_photos || 10,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Template salvo com sucesso!',
      });

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

  const getPreviewContent = (template: PrintTemplate) => {
    let content = template.content;
    
    // Mock data para preview
    const mockData = {
      title: 'Casa Moderna com 3 Quartos',
      code: 'IMO-2024-001',
      price: 'R$ 850.000,00',
      type: 'Venda',
      bedrooms: '3',
      bathrooms: '2',
      area: '180m²',
      description: 'Linda casa moderna em condomínio fechado com total segurança e lazer completo.',
      address: 'Rua das Flores, 123',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      qrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://exemplo.com/imovel/001',
      system_logo: '/placeholder.svg',
      company_logo: '/placeholder.svg',
      agent_name: 'João Silva',
      agent_phone: '(11) 98765-4321',
      agent_email: 'joao@imobiliaria.com',
    };

    // Substituir placeholders
    Object.entries(mockData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      if (key === 'qrcode' || key === 'system_logo' || key === 'company_logo') {
        content = content.replace(placeholder, `<img src="${value}" alt="${key}" style="max-width: 200px; height: auto;" />`);
      } else {
        content = content.replace(placeholder, value);
      }
    });

    // Gerar grid de fotos placeholder
    const photoColumns = template.photo_columns || 1;
    const maxPhotos = template.max_photos || 10;
    const photoWidth = Math.floor((formatWidth - 80) / photoColumns);
    
    let photosHtml = '<div style="display: grid; grid-template-columns: repeat(' + photoColumns + ', 1fr); gap: 10px; margin: 20px 0;">';
    for (let i = 0; i < Math.min(maxPhotos, 6); i++) {
      photosHtml += `<div style="aspect-ratio: 4/3; overflow: hidden;">
        <img src="https://placehold.co/${photoWidth}x${Math.floor(photoWidth * 0.75)}/e2e8f0/64748b?text=Foto+${i + 1}" 
             alt="Foto ${i + 1}" 
             style="width: 100%; height: 100%; object-fit: cover;" />
      </div>`;
    }
    photosHtml += '</div>';

    // Inserir fotos baseado no photo_placement
    const photoPlacement = template.photo_placement || 'after_text';
    if (photoPlacement === 'before_text') {
      content = photosHtml + content;
    } else if (photoPlacement === 'after_text') {
      content = content + photosHtml;
    } else if (photoPlacement === 'intercalated') {
      const paragraphs = content.split('</p>');
      if (paragraphs.length > 2) {
        paragraphs.splice(2, 0, photosHtml);
        content = paragraphs.join('</p>');
      } else {
        content = content + photosHtml;
      }
    }

    return content;
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
      const { error } = await supabase
        .from('print_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template deletado com sucesso!',
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o template.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (template: PrintTemplate) => {
    try {
      const { error } = await supabase
        .from('print_templates')
        .insert({
          name: `${template.name} (Cópia)`,
          content: template.content,
          is_default: false,
          photo_columns: template.photo_columns,
          photo_placement: template.photo_placement,
          max_photos: template.max_photos,
          archived: false,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template duplicado com sucesso!',
      });

      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o template.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('print_templates')
        .update({ archived: !currentArchived })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: currentArchived ? 'Template desarquivado com sucesso!' : 'Template arquivado com sucesso!',
      });

      loadTemplates();
    } catch (error) {
      console.error('Error toggling archive:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar/desarquivar o template.',
        variant: 'destructive',
      });
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Templates de Impressão</h1>
            <p className="text-muted-foreground">
              Configure templates personalizados para impressão de imóveis com suporte a QR codes
            </p>
          </div>
          <Button onClick={() => setEditingTemplate({ id: '', name: '', content: '', is_default: false })}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {editingTemplate ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTemplate.id ? 'Editar Template' : 'Novo Template'}</CardTitle>
                <CardDescription>
                  Use placeholders como {'{{title}}'}, {'{{code}}'}, {'{{qrcode}}'}, {'{{images}}'}, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Ex: Template Premium"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_default">Template Padrão</Label>
                  <p className="text-sm text-muted-foreground">
                    Este template será usado por padrão na impressão
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

              {/* Toggle para Mostrar Fotos no Preview */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_photos_preview">Mostrar Fotos no Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir fotos de exemplo no preview em tempo real
                  </p>
                </div>
                <Switch
                  id="show_photos_preview"
                  checked={showPhotosInPreview}
                  onCheckedChange={setShowPhotosInPreview}
                />
              </div>

              {/* Controles para Fotos no Template */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="photo_columns">Colunas de Fotos</Label>
                  <Input
                    id="photo_columns"
                    type="number"
                    min="1"
                    max="4"
                    value={editingTemplate.photo_columns || 1}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, photo_columns: parseInt(e.target.value) })
                    }
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número de colunas (1-4)
                  </p>
                </div>
                <div>
                  <Label htmlFor="max_photos">Máximo de Fotos</Label>
                  <Input
                    id="max_photos"
                    type="number"
                    min="1"
                    max="50"
                    value={editingTemplate.max_photos || 10}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, max_photos: parseInt(e.target.value) })
                    }
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo de fotos a exibir
                  </p>
                </div>
                <div>
                  <Label htmlFor="photo_placement">Posicionamento</Label>
                  <Select
                    value={editingTemplate.photo_placement || 'after_text'}
                    onValueChange={(value: 'before_text' | 'after_text' | 'intercalated') =>
                      setEditingTemplate({ ...editingTemplate, photo_placement: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before_text">Antes do Texto</SelectItem>
                      <SelectItem value="after_text">Depois do Texto</SelectItem>
                      <SelectItem value="intercalated">Intercalado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posição das fotos
                  </p>
                </div>
              </div>

              <FormatSelector
                width={formatWidth}
                height={formatHeight}
                onChange={(w, h) => {
                  setFormatWidth(w);
                  setFormatHeight(h);
                }}
              />

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Editor de Conteúdo - Largura Total */}
          <Card>
            <CardHeader>
              <CardTitle>Editor de Conteúdo</CardTitle>
              <CardDescription>
                Edite o conteúdo do template usando o editor visual ou código HTML
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visual" className="w-full">
                <TabsList>
                  <TabsTrigger value="visual">Editor Visual</TabsTrigger>
                  <TabsTrigger value="text">Código HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="visual">
                  <RichTextEditor
                    content={editingTemplate.content}
                    onChange={(html) => setEditingTemplate({ ...editingTemplate, content: html })}
                  />
                </TabsContent>
                <TabsContent value="text">
                  <textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                    className="w-full h-96 p-4 border rounded-md font-mono text-sm"
                    placeholder="Cole ou edite o HTML do template aqui..."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Preview em Tempo Real - Largura Total */}
          <TemplatePreviewLive
            content={editingTemplate.content}
            width={formatWidth}
            height={formatHeight}
            type="print"
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            photoColumns={editingTemplate.photo_columns || 1}
            photoPlacement={editingTemplate.photo_placement || 'after_text'}
            maxPhotos={editingTemplate.max_photos || 10}
            showPhotos={showPhotosInPreview}
          />
        </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{template.name}</span>
                    {template.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Padrão
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setPreviewOpen(true);
                      }}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                      title="Editar"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleArchive(template.id, template.archived || false)}
                      title={template.archived ? 'Desarquivar' : 'Arquivar'}
                    >
                      {template.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {previewTemplate && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 m-0">
            <div 
              className="h-full w-full flex items-center justify-center bg-gray-900 overflow-hidden"
              style={{
                padding: '20px',
              }}
            >
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: `${formatWidth}px`,
                  maxHeight: `${formatHeight}px`,
                  aspectRatio: `${formatWidth} / ${formatHeight}`,
                }}
                className="flex items-center justify-center"
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: getPreviewContent(previewTemplate) }}
                  className="prose prose-sm max-w-none bg-white shadow-2xl w-full h-full overflow-auto"
                  style={{
                    padding: '40px',
                    aspectRatio: `${formatWidth} / ${formatHeight}`,
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
