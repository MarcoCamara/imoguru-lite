import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Download, Pencil, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Authorization {
  id: string;
  property_id: string;
  template_id: string;
  filled_content: string;
  signature_url: string | null;
  signature_method: string | null;
  signed_at: string | null;
  created_at: string;
}

interface AuthTemplate {
  id: string;
  name: string;
  content: string;
}

export default function PropertyAuthorizations() {
  const { id: propertyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [property, setProperty] = useState<any>(null);
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [templates, setTemplates] = useState<AuthTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (user && propertyId) {
      loadData();
    }
  }, [user, propertyId]);

  const loadData = async () => {
    try {
      const [propResult, authResult, templatesResult] = await Promise.all([
        supabase.from('properties').select('*').eq('id', propertyId).single(),
        supabase.from('property_authorizations').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
        supabase.from('authorization_templates').select('*').order('name'),
      ]);

      if (propResult.error) throw propResult.error;
      if (authResult.error) throw authResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setProperty(propResult.data);
      setAuthorizations(authResult.data || []);
      setTemplates(templatesResult.data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fillTemplate = (template: string) => {
    if (!property) return template;

    const fullAddress = [
      property.street,
      property.number,
      property.complement,
      property.neighborhood,
      property.city,
      property.state,
    ].filter(Boolean).join(', ');

    const price = property.sale_price 
      ? `R$ ${Number(property.sale_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : property.rental_price 
      ? `R$ ${Number(property.rental_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
      : 'A combinar';

    return template
      .replace(/\{\{owner_name\}\}/g, property.owner_name || '[Nome do Proprietário]')
      .replace(/\{\{owner_cpf_cnpj\}\}/g, property.owner_cpf_cnpj || '[CPF/CNPJ]')
      .replace(/\{\{owner_email\}\}/g, property.owner_email || '[E-mail]')
      .replace(/\{\{owner_phone\}\}/g, property.owner_phone || '[Telefone]')
      .replace(/\{\{code\}\}/g, property.code || '[Código]')
      .replace(/\{\{title\}\}/g, property.title || '[Título]')
      .replace(/\{\{property_type\}\}/g, property.property_type || '[Tipo]')
      .replace(/\{\{full_address\}\}/g, fullAddress)
      .replace(/\{\{price\}\}/g, price)
      .replace(/\{\{purpose\}\}/g, property.purpose === 'venda' ? 'venda' : 'locação')
      .replace(/\{\{agency_name\}\}/g, 'ImoGuru')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('pt-BR'));
  };

  const handleCreateAuthorization = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Selecione um template',
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const filledContent = fillTemplate(template.content);

    try {
      let signatureUrl = null;

      if (signatureMethod === 'draw' && canvasRef.current) {
        const canvas = canvasRef.current;
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const fileName = `${propertyId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(`signatures/${fileName}`, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(`signatures/${fileName}`);

        signatureUrl = urlData.publicUrl;
      } else if (signatureMethod === 'upload' && signatureFile) {
        const fileName = `${propertyId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(`signatures/${fileName}`, signatureFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(`signatures/${fileName}`);

        signatureUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('property_authorizations').insert({
        property_id: propertyId,
        template_id: selectedTemplateId,
        filled_content: filledContent,
        signature_url: signatureUrl,
        signature_method: signatureMethod,
        signed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Autorização criada!',
        description: 'A autorização foi gerada com sucesso.',
      });

      setDialogOpen(false);
      clearCanvas();
      setSignatureFile(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar autorização',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadAuthorization = (auth: Authorization) => {
    const blob = new Blob([auth.filled_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autorizacao_${property?.code || 'sem-codigo'}_${new Date(auth.created_at).toLocaleDateString('pt-BR')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
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
          <Button variant="outline" size="icon" onClick={() => navigate(`/property/${propertyId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Autorizações</h1>
            <p className="text-muted-foreground">
              {property?.title} - {property?.code}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Nova Autorização
          </Button>
        </div>

        <div className="grid gap-4">
          {authorizations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma autorização criada ainda
              </CardContent>
            </Card>
          ) : (
            authorizations.map((auth) => (
              <Card key={auth.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Autorização
                      </CardTitle>
                      <CardDescription>
                        Criada em {new Date(auth.created_at).toLocaleDateString('pt-BR')}
                        {auth.signed_at && ` • Assinada em ${new Date(auth.signed_at).toLocaleDateString('pt-BR')}`}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAuthorization(auth)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                    {auth.filled_content}
                  </pre>
                  {auth.signature_url && (
                    <div className="mt-4">
                      <Label>Assinatura:</Label>
                      <img 
                        src={auth.signature_url} 
                        alt="Assinatura" 
                        className="mt-2 border rounded-md max-w-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Autorização</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateId && (
                <>
                  <div>
                    <Label>Prévia do Documento</Label>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md mt-2 max-h-[300px] overflow-y-auto">
                      {fillTemplate(templates.find(t => t.id === selectedTemplateId)?.content || '')}
                    </pre>
                  </div>

                  <div>
                    <Label>Método de Assinatura</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={signatureMethod === 'draw' ? 'default' : 'outline'}
                        onClick={() => setSignatureMethod('draw')}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Desenhar
                      </Button>
                      <Button
                        variant={signatureMethod === 'upload' ? 'default' : 'outline'}
                        onClick={() => setSignatureMethod('upload')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {signatureMethod === 'draw' && (
                    <div>
                      <Label>Assinatura</Label>
                      <div className="border rounded-md mt-2 bg-white">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="cursor-crosshair w-full"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                        className="mt-2"
                      >
                        Limpar
                      </Button>
                    </div>
                  )}

                  {signatureMethod === 'upload' && (
                    <div>
                      <Label>Upload da Assinatura</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateAuthorization}>
                      Criar Autorização
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
