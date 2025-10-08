import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentsFormProps {
  propertyId?: string;
}

export default function DocumentsForm({ propertyId }: DocumentsFormProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('escritura');

  useEffect(() => {
    if (propertyId) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!propertyId) {
      toast({
        title: 'Salve o imóvel primeiro',
        variant: 'destructive',
      });
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${documentType}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_documents').insert([
          {
            property_id: propertyId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
          },
        ]);

        if (dbError) throw dbError;
      }

      toast({
        title: 'Documentos enviados!',
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar documentos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, url: string) => {
    try {
      const path = url.split('/property-documents/')[1];
      await supabase.storage.from('property-documents').remove([path]);
      await supabase.from('property_documents').delete().eq('id', docId);

      toast({
        title: 'Documento removido!',
      });

      loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!propertyId) {
    return (
      <div className="pt-4 text-center text-muted-foreground">
        Salve o imóvel primeiro para fazer upload de documentos.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Adicionar Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="escritura">Escritura</SelectItem>
                  <SelectItem value="matricula">Matrícula</SelectItem>
                  <SelectItem value="iptu">IPTU</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="rg_proprietario">RG Proprietário</SelectItem>
                  <SelectItem value="cpf_proprietario">CPF Proprietário</SelectItem>
                  <SelectItem value="comprovante_residencia">Comprovante de Residência</SelectItem>
                  <SelectItem value="certidao">Certidão</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_file">Arquivo</Label>
              <Input
                id="document_file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum documento enviado ainda.
          </p>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id, doc.file_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Enviando documentos...</span>
        </div>
      )}
    </div>
  );
}
