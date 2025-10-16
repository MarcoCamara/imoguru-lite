import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Download, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TemplatePreview from '@/components/TemplatePreview';

interface AuthTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

export default function AuthorizationTemplates() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AuthTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<AuthTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AuthTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        .from('authorization_templates')
        .select('*')
        .order('name');

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

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('authorization_templates')
        .upsert({
          id: editingTemplate.id === 'new' ? undefined : editingTemplate.id,
          name: editingTemplate.name,
          content: editingTemplate.content,
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
        .from('authorization_templates')
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

  const handleDownload = (template: AuthTemplate) => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    setEditingTemplate({
      id: 'new',
      name: '',
      content: `AUTORIZAÇÃO DE VENDA/LOCAÇÃO

Eu, {{owner_name}}, portador(a) do CPF/CNPJ {{owner_cpf_cnpj}}, proprietário(a) do imóvel situado em {{full_address}}, autorizo a {{agency_name}} a realizar a intermediação da {{purpose}} do referido imóvel.

DADOS DO IMÓVEL:
Código: {{code}}
Tipo: {{property_type}}
Endereço: {{full_address}}
Valor: {{price}}

DADOS DO PROPRIETÁRIO:
Nome: {{owner_name}}
CPF/CNPJ: {{owner_cpf_cnpj}}
E-mail: {{owner_email}}
Telefone: {{owner_phone}}

Data: {{date}}

_____________________________
Assinatura do Proprietário`,
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
            <h1 className="text-3xl font-bold">Templates de Autorização</h1>
            <p className="text-muted-foreground">Gerencie templates de autorização para venda/locação</p>
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
                      <FileText className="h-5 w-5" />
                      {template.name}
                      {template.is_default && <Badge>Padrão</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {template.content.substring(0, 100)}...
                    </CardDescription>
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
                      onClick={() => handleDownload(template)}
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
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
            </Card>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate?.id === 'new' ? 'Novo Template' : 'Editar Template'}
              </DialogTitle>
            </DialogHeader>

            {editingTemplate && (
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
                  <Label htmlFor="content">Conteúdo do Template</Label>
                  <Textarea
                    id="content"
                    value={editingTemplate.content}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, content: e.target.value })
                    }
                    rows={20}
                    placeholder="Digite o conteúdo da autorização..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {`{{campo}}`} para inserir valores dinâmicos. Campos disponíveis:{' '}
                    <code className="text-xs">
                      {`{{owner_name}}, {{owner_cpf_cnpj}}, {{owner_email}}, {{owner_phone}}, `}
                      {`{{code}}, {{title}}, {{property_type}}, {{full_address}}, {{price}}, {{date}}`}
                    </code>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_default">Template Padrão</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar como template padrão
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

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
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
            type="authorization"
          />
        )}
      </div>
    </div>
  );
}
