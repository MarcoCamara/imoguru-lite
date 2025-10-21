import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Building2, Upload, Trash2, Plus, Edit, Copy, Archive } from 'lucide-react';
import { fetchCEP } from '@/lib/cepUtils';
import { validateCNPJ, formatCNPJ } from '@/lib/validationUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    cnpj: '',
    phone: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    website: '',
    primary_color: '#8b5cf6',
    secondary_color: '#3b82f6',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as empresas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da empresa.',
        variant: 'destructive',
      });
      return;
    }

    if (newCompany.cnpj && !validateCNPJ(newCompany.cnpj)) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(newCompany)
        .select()
        .single();

      if (error) throw error;

      // Fazer upload do logo se foi selecionado
      if (logoFile && data) {
        await handleLogoUpload(data.id, logoFile);
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa criada com sucesso!',
      });

      setNewCompany({
        name: '',
        cnpj: '',
        phone: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        website: '',
        primary_color: '#8b5cf6',
        secondary_color: '#3b82f6',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      });
      setIsDialogOpen(false);
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a empresa.',
        variant: 'destructive',
      });
    }
  };

  const handleCepChange = async (cep: string) => {
    setNewCompany({ ...newCompany, cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await fetchCEP(cep);
      if (data) {
        setNewCompany({
          ...newCompany,
          cep,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        });
      }
    }
  };

  const handleLogoUpload = async (companyId: string, file: File) => {
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
      const fileName = `${companyId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Logo enviado com sucesso!',
      });

      loadCompanies();
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

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa excluída com sucesso!',
      });

      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a empresa.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Carregando empresas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Empresas</CardTitle>
            <CardDescription>Gerencie as empresas do sistema</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Empresa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova empresa ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Digite o nome da empresa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_phone">Telefone</Label>
                    <Input
                      id="company_phone"
                      value={newCompany.phone}
                      onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_whatsapp">WhatsApp</Label>
                    <Input
                      id="company_whatsapp"
                      value={newCompany.whatsapp}
                      onChange={(e) => setNewCompany({ ...newCompany, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_facebook">Facebook</Label>
                    <Input
                      id="company_facebook"
                      value={newCompany.facebook}
                      onChange={(e) => setNewCompany({ ...newCompany, facebook: e.target.value })}
                      placeholder="URL do Facebook"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_instagram">Instagram</Label>
                    <Input
                      id="company_instagram"
                      value={newCompany.instagram}
                      onChange={(e) => setNewCompany({ ...newCompany, instagram: e.target.value })}
                      placeholder="@usuario"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_cep">CEP</Label>
                  <Input
                    id="company_cep"
                    value={newCompany.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="company_street">Rua</Label>
                    <Input
                      id="company_street"
                      value={newCompany.street}
                      onChange={(e) => setNewCompany({ ...newCompany, street: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_number">Número</Label>
                    <Input
                      id="company_number"
                      value={newCompany.number}
                      onChange={(e) => setNewCompany({ ...newCompany, number: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_complement">Complemento</Label>
                  <Input
                    id="company_complement"
                    value={newCompany.complement}
                    onChange={(e) => setNewCompany({ ...newCompany, complement: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_neighborhood">Bairro</Label>
                    <Input
                      id="company_neighborhood"
                      value={newCompany.neighborhood}
                      onChange={(e) => setNewCompany({ ...newCompany, neighborhood: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_city">Cidade</Label>
                    <Input
                      id="company_city"
                      value={newCompany.city}
                      onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_state">Estado</Label>
                  <Input
                    id="company_state"
                    value={newCompany.state}
                    onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCompany}>Criar Empresa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma empresa cadastrada
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 border-2 border-dashed rounded-md flex items-center justify-center bg-muted overflow-hidden">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Criada em {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`logo-${company.id}`} className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Logo
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id={`logo-${company.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(company.id, file);
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}