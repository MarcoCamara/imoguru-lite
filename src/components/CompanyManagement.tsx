import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Building2, Upload, Trash2, Plus, Edit, Copy, Archive, ArchiveRestore, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import CompanyUsersDialog from './CompanyUsersDialog';
import { Checkbox } from '@/components/ui/checkbox';

interface Company {
  id: string;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  website_domain?: string | null; // Alterado de website para website_domain
  primary_color?: string | null;
  secondary_color?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  logo_url: string | null;
  archived?: boolean;
  ai_agent_enabled?: boolean; // Novo campo
  created_at: string;
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    cnpj: '',
    phone: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    website_domain: '', // Alterado de website para website_domain
    primary_color: '#8b5cf6',
    secondary_color: '#3b82f6',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    ai_agent_enabled: false, // Novo campo
  });
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(
          'id, name, cnpj, phone, whatsapp, facebook, instagram, website_domain, primary_color, secondary_color, cep, street, number, complement, neighborhood, city, state, logo_url, archived, ai_agent_enabled, created_at'
        )
        .order('name');

      if (error) {
        console.error('Erro detalhado ao carregar empresas:', error);
        throw error;
      }
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
        .insert({
          ...newCompany,
          ai_agent_enabled: newCompany.ai_agent_enabled, // Incluir no insert
        })
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
        website_domain: '', // Alterado de website para website_domain
        primary_color: '#8b5cf6',
        secondary_color: '#3b82f6',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        ai_agent_enabled: false, // Resetar para o padrão
      });
      setLogoFile(null);
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

  const handleEditCompany = (company: Company) => {
    setEditingCompany({
      ...company,
      primary_color: company.primary_color || '#8b5cf6',
      secondary_color: company.secondary_color || '#3b82f6',
      ai_agent_enabled: company.ai_agent_enabled || false, // Definir valor padrão
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;

    if (!editingCompany.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da empresa.',
        variant: 'destructive',
      });
      return;
    }

    if (editingCompany.cnpj && !validateCNPJ(editingCompany.cnpj)) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: editingCompany.name,
          cnpj: editingCompany.cnpj,
          phone: editingCompany.phone,
          whatsapp: editingCompany.whatsapp,
          facebook: editingCompany.facebook,
          instagram: editingCompany.instagram,
          website_domain: editingCompany.website_domain, // Alterado de website para website_domain
          primary_color: editingCompany.primary_color,
          secondary_color: editingCompany.secondary_color,
          cep: editingCompany.cep,
          street: editingCompany.street,
          number: editingCompany.number,
          complement: editingCompany.complement,
          neighborhood: editingCompany.neighborhood,
          city: editingCompany.city,
          state: editingCompany.state,
          ai_agent_enabled: editingCompany.ai_agent_enabled, // Incluir no update
        })
        .eq('id', editingCompany.id);

      if (error) throw error;

      // Upload logo se foi selecionado
      if (editLogoFile) {
        await handleLogoUpload(editingCompany.id, editLogoFile);
      }

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso!',
      });

      setIsEditDialogOpen(false);
      setEditingCompany(null);
      setEditLogoFile(null);
      loadCompanies();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a empresa.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCepChange = async (cep: string) => {
    if (!editingCompany) return;
    
    setEditingCompany({ ...editingCompany, cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await fetchCEP(cep);
      if (data) {
        setEditingCompany({
          ...editingCompany,
          cep,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        });
      }
    }
  };

  const handleDuplicateCompany = async (company: Company) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: `${company.name} (Cópia)`,
          cnpj: null, // CNPJ não pode ser duplicado
          phone: company.phone,
          whatsapp: company.whatsapp,
          facebook: company.facebook,
          instagram: company.instagram,
          website_domain: company.website_domain, // Alterado de website para website_domain
          primary_color: company.primary_color,
          secondary_color: company.secondary_color,
          cep: company.cep,
          street: company.street,
          number: company.number,
          complement: company.complement,
          neighborhood: company.neighborhood,
          city: company.city,
          state: company.state,
          ai_agent_enabled: company.ai_agent_enabled, // Incluir no duplicate
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa duplicada com sucesso!',
      });

      loadCompanies();
    } catch (error: any) {
      console.error('Error duplicating company:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível duplicar a empresa.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // Verificar se a empresa tem usuários ou imóveis associados
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        toast({
          title: 'Não é possível deletar',
          description: `Esta empresa possui ${users.length} usuário(s) associado(s). Remova os usuários antes de deletar a empresa.`,
          variant: 'destructive',
        });
        return;
      }

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('company_id', companyId);

      if (propertiesError) throw propertiesError;

      if (properties && properties.length > 0) {
        toast({
          title: 'Não é possível deletar',
          description: `Esta empresa possui ${properties.length} imóvel(is) associado(s). Delete os imóveis antes de deletar a empresa.`,
          variant: 'destructive',
        });
        return;
      }

      if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
        return;
      }

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
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a empresa.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveCompany = async (companyId: string) => {
    try {
      const company = companies.find(c => c.id === companyId);
      const archived = company?.archived || false;

      // Verificar se a empresa tem usuários ou imóveis ativos
      if (!archived) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('company_id', companyId)
          .eq('archived', false);

        if (usersError) throw usersError;

        if (users && users.length > 0) {
          toast({
            title: 'Atenção',
            description: `Esta empresa possui ${users.length} usuário(s) ativo(s). Considere arquivar os usuários antes de arquivar a empresa.`,
            variant: 'destructive',
          });
          
          if (!confirm(`Esta empresa possui ${users.length} usuário(s) ativo(s). Deseja continuar e arquivar a empresa mesmo assim?`)) {
            return;
          }
        }

        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('company_id', companyId)
          .eq('archived', false);

        if (propertiesError) throw propertiesError;

        if (properties && properties.length > 0) {
          toast({
            title: 'Atenção',
            description: `Esta empresa possui ${properties.length} imóvel(is) ativo(s). Considere arquivar os imóveis antes de arquivar a empresa.`,
            variant: 'destructive',
          });
          
          if (!confirm(`Esta empresa possui ${properties.length} imóvel(is) ativo(s). Deseja continuar e arquivar a empresa mesmo assim?`)) {
            return;
          }
        }
      }

      const { error } = await supabase
        .from('companies')
        .update({ archived: !archived })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: archived ? 'Empresa desarquivada!' : 'Empresa arquivada!',
      });

      loadCompanies();
    } catch (error: any) {
      console.error('Error archiving company:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível arquivar a empresa.',
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
                
                <div>
                  <Label htmlFor="company_logo">Logotipo</Label>
                  <Input
                    id="company_logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast({
                            title: 'Erro',
                            description: 'O arquivo deve ter no máximo 2MB.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setLogoFile(file);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tamanho máximo: 2MB</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_cnpj">CNPJ</Label>
                    <Input
                      id="company_cnpj"
                      value={newCompany.cnpj}
                      onChange={(e) => setNewCompany({ ...newCompany, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_website_domain">Website/Domínio</Label>
                    <Input
                      id="company_website_domain"
                      value={newCompany.website_domain}
                      onChange={(e) => setNewCompany({ ...newCompany, website_domain: e.target.value })}
                      placeholder="https://exemplo.com.br"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_primary_color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="company_primary_color"
                        type="color"
                        value={newCompany.primary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, primary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={newCompany.primary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, primary_color: e.target.value })}
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company_secondary_color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="company_secondary_color"
                        type="color"
                        value={newCompany.secondary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, secondary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={newCompany.secondary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, secondary_color: e.target.value })}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai_agent_enabled"
                    checked={newCompany.ai_agent_enabled}
                    onCheckedChange={(checked) => setNewCompany({ ...newCompany, ai_agent_enabled: checked === true })}
                  />
                  <Label htmlFor="ai_agent_enabled">Permitir Agente de IA</Label>
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
                    {company.cnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {company.cnpj}</p>
                    )}
                  </div>
                  {company.archived && (
                    <Badge variant="outline" className="bg-muted">
                      Arquivada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditCompany(company)}
                    title="Editar empresa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDuplicateCompany(company)}
                    title="Duplicar empresa"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleArchiveCompany(company.id)}
                    title={company.archived ? 'Desarquivar empresa' : 'Arquivar empresa'}
                  >
                    {company.archived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedCompanyForUsers({ id: company.id, name: company.name });
                      setIsUsersDialogOpen(true);
                    }}
                    title="Visualizar usuários"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteCompany(company.id)}
                    title="Deletar empresa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa
            </DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="edit_company_name">Nome da Empresa *</Label>
                <Input
                  id="edit_company_name"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_company_logo">Logotipo</Label>
                <Input
                  id="edit_company_logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast({
                          title: 'Erro',
                          description: 'O arquivo deve ter no máximo 2MB.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setEditLogoFile(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Tamanho máximo: 2MB</p>
                {editingCompany.logo_url && (
                  <div className="mt-2">
                    <img src={editingCompany.logo_url} alt="Logo atual" className="h-20 object-contain" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_company_cnpj">CNPJ</Label>
                  <Input
                    id="edit_company_cnpj"
                    value={editingCompany.cnpj || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_website_domain">Website/Domínio</Label>
                  <Input
                    id="edit_company_website_domain"
                    value={editingCompany.website_domain || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, website_domain: e.target.value })}
                    placeholder="https://exemplo.com.br"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_company_primary_color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_company_primary_color"
                      type="color"
                      value={editingCompany.primary_color || '#8b5cf6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={editingCompany.primary_color || '#8b5cf6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, primary_color: e.target.value })}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_company_secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_company_secondary_color"
                      type="color"
                      value={editingCompany.secondary_color || '#3b82f6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={editingCompany.secondary_color || '#3b82f6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_company_phone">Telefone</Label>
                  <Input
                    id="edit_company_phone"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_whatsapp">WhatsApp</Label>
                  <Input
                    id="edit_company_whatsapp"
                    value={editingCompany.whatsapp || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_company_facebook">Facebook</Label>
                  <Input
                    id="edit_company_facebook"
                    value={editingCompany.facebook || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, facebook: e.target.value })}
                    placeholder="URL do Facebook"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_instagram">Instagram</Label>
                  <Input
                    id="edit_company_instagram"
                    value={editingCompany.instagram || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, instagram: e.target.value })}
                    placeholder="@usuario"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_cep">CEP</Label>
                <Input
                  id="edit_company_cep"
                  value={editingCompany.cep || ''}
                  onChange={(e) => handleEditCepChange(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit_company_street">Rua</Label>
                  <Input
                    id="edit_company_street"
                    value={editingCompany.street || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, street: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_number">Número</Label>
                  <Input
                    id="edit_company_number"
                    value={editingCompany.number || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, number: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_complement">Complemento</Label>
                <Input
                  id="edit_company_complement"
                  value={editingCompany.complement || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, complement: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_company_neighborhood">Bairro</Label>
                  <Input
                    id="edit_company_neighborhood"
                    value={editingCompany.neighborhood || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, neighborhood: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_city">Cidade</Label>
                  <Input
                    id="edit_company_city"
                    value={editingCompany.city || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_state">Estado</Label>
                <Input
                  id="edit_company_state"
                  value={editingCompany.state || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_ai_agent_enabled"
                  checked={editingCompany.ai_agent_enabled}
                  onCheckedChange={(checked) => setEditingCompany({ ...editingCompany, ai_agent_enabled: checked === true })}
                />
                <Label htmlFor="edit_ai_agent_enabled">Permitir Agente de IA</Label>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCompany}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompanyUsersDialog
        companyId={selectedCompanyForUsers?.id || null}
        companyName={selectedCompanyForUsers?.name || null}
        isOpen={isUsersDialogOpen}
        onClose={() => setIsUsersDialogOpen(false)}
      />
    </Card>
  );
}