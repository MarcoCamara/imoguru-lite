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
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import TemplatePreview from '@/components/TemplatePreview';

interface PrintTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

export default function PrintTemplates() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

              <div>
                <Label>Conteúdo do Template</Label>
                <Tabs defaultValue="visual" className="w-full mt-2">
                  <TabsList>
                    <TabsTrigger value="visual">Editor Visual</TabsTrigger>
                    <TabsTrigger value="text">Texto Simples</TabsTrigger>
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
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
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
        <TemplatePreview
          template={previewTemplate}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          type="print"
        />
      )}
    </div>
  );
}
