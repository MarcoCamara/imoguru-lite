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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Empresas</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gerencie as empresas do sistema</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Empresa</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              <DialogHeader className="pb-2 sm:pb-4">
                <DialogTitle className="text-base sm:text-lg md:text-xl">Criar Nova Empresa</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Adicione uma nova empresa ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label htmlFor="company_name" className="text-xs sm:text-sm">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Digite o nome da empresa"
                    className="text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_logo" className="text-xs sm:text-sm">Logotipo</Label>
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
                    className="text-xs sm:text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tamanho máximo: 2MB</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="company_cnpj" className="text-xs sm:text-sm">CNPJ</Label>
                    <Input
                      id="company_cnpj"
                      value={newCompany.cnpj}
                      onChange={(e) => setNewCompany({ ...newCompany, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_website_domain" className="text-xs sm:text-sm">Website/Domínio</Label>
                    <Input
                      id="company_website_domain"
                      value={newCompany.website_domain}
                      onChange={(e) => setNewCompany({ ...newCompany, website_domain: e.target.value })}
                      placeholder="https://exemplo.com.br"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="company_primary_color" className="text-xs sm:text-sm">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="company_primary_color"
                        type="color"
                        value={newCompany.primary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, primary_color: e.target.value })}
                        className="w-16 sm:w-20 h-8 sm:h-10 flex-shrink-0"
                      />
                      <Input
                        value={newCompany.primary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, primary_color: e.target.value })}
                        placeholder="#8b5cf6"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company_secondary_color" className="text-xs sm:text-sm">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="company_secondary_color"
                        type="color"
                        value={newCompany.secondary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, secondary_color: e.target.value })}
                        className="w-16 sm:w-20 h-8 sm:h-10 flex-shrink-0"
                      />
                      <Input
                        value={newCompany.secondary_color}
                        onChange={(e) => setNewCompany({ ...newCompany, secondary_color: e.target.value })}
                        placeholder="#3b82f6"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="company_phone" className="text-xs sm:text-sm">Telefone</Label>
                    <Input
                      id="company_phone"
                      value={newCompany.phone}
                      onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                      placeholder="(00) 0000-0000"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_whatsapp" className="text-xs sm:text-sm">WhatsApp</Label>
                    <Input
                      id="company_whatsapp"
                      value={newCompany.whatsapp}
                      onChange={(e) => setNewCompany({ ...newCompany, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="company_facebook" className="text-xs sm:text-sm">Facebook</Label>
                    <Input
                      id="company_facebook"
                      value={newCompany.facebook}
                      onChange={(e) => setNewCompany({ ...newCompany, facebook: e.target.value })}
                      placeholder="URL do Facebook"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_instagram" className="text-xs sm:text-sm">Instagram</Label>
                    <Input
                      id="company_instagram"
                      value={newCompany.instagram}
                      onChange={(e) => setNewCompany({ ...newCompany, instagram: e.target.value })}
                      placeholder="@usuario"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_cep" className="text-xs sm:text-sm">CEP</Label>
                  <Input
                    id="company_cep"
                    value={newCompany.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <Label htmlFor="company_street" className="text-xs sm:text-sm">Rua</Label>
                    <Input
                      id="company_street"
                      value={newCompany.street}
                      onChange={(e) => setNewCompany({ ...newCompany, street: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_number" className="text-xs sm:text-sm">Número</Label>
                    <Input
                      id="company_number"
                      value={newCompany.number}
                      onChange={(e) => setNewCompany({ ...newCompany, number: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_complement" className="text-xs sm:text-sm">Complemento</Label>
                  <Input
                    id="company_complement"
                    value={newCompany.complement}
                    onChange={(e) => setNewCompany({ ...newCompany, complement: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="company_neighborhood" className="text-xs sm:text-sm">Bairro</Label>
                    <Input
                      id="company_neighborhood"
                      value={newCompany.neighborhood}
                      onChange={(e) => setNewCompany({ ...newCompany, neighborhood: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_city" className="text-xs sm:text-sm">Cidade</Label>
                    <Input
                      id="company_city"
                      value={newCompany.city}
                      onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_state" className="text-xs sm:text-sm">Estado</Label>
                  <Input
                    id="company_state"
                    value={newCompany.state}
                    onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    className="text-sm sm:text-base"
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
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sm:pt-6 border-t sm:border-t-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  Cancelar
                </Button>
                <Button onClick={handleCreateCompany} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  Criar Empresa
                </Button>
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
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-dashed rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{company.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Criada em {new Date(company.created_at).toLocaleDateString()}
                    </p>
                    {company.cnpj && (
                      <p className="text-xs text-muted-foreground truncate">CNPJ: {company.cnpj}</p>
                    )}
                  </div>
                  {company.archived && (
                    <Badge variant="outline" className="bg-muted flex-shrink-0 text-xs">
                      Arquivada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditCompany(company)}
                    title="Editar empresa"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDuplicateCompany(company)}
                    title="Duplicar empresa"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleArchiveCompany(company.id)}
                    title={company.archived ? 'Desarquivar empresa' : 'Arquivar empresa'}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    {company.archived ? (
                      <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteCompany(company.id)}
                    title="Deletar empresa"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Editar Empresa</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize os dados da empresa
            </DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="edit_company_name" className="text-xs sm:text-sm">Nome da Empresa *</Label>
                <Input
                  id="edit_company_name"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  placeholder="Digite o nome da empresa"
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_company_logo" className="text-xs sm:text-sm">Logotipo</Label>
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
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Tamanho máximo: 2MB</p>
                {editingCompany.logo_url && (
                  <div className="mt-2">
                    <img src={editingCompany.logo_url} alt="Logo atual" className="h-16 sm:h-20 object-contain" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_company_cnpj" className="text-xs sm:text-sm">CNPJ</Label>
                  <Input
                    id="edit_company_cnpj"
                    value={editingCompany.cnpj || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_website_domain" className="text-xs sm:text-sm">Website/Domínio</Label>
                  <Input
                    id="edit_company_website_domain"
                    value={editingCompany.website_domain || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, website_domain: e.target.value })}
                    placeholder="https://exemplo.com.br"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_company_primary_color" className="text-xs sm:text-sm">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_company_primary_color"
                      type="color"
                      value={editingCompany.primary_color || '#8b5cf6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, primary_color: e.target.value })}
                      className="w-16 sm:w-20 h-8 sm:h-10 flex-shrink-0"
                    />
                    <Input
                      value={editingCompany.primary_color || '#8b5cf6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, primary_color: e.target.value })}
                      placeholder="#8b5cf6"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_company_secondary_color" className="text-xs sm:text-sm">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_company_secondary_color"
                      type="color"
                      value={editingCompany.secondary_color || '#3b82f6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, secondary_color: e.target.value })}
                      className="w-16 sm:w-20 h-8 sm:h-10 flex-shrink-0"
                    />
                    <Input
                      value={editingCompany.secondary_color || '#3b82f6'}
                      onChange={(e) => setEditingCompany({ ...editingCompany, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_company_phone" className="text-xs sm:text-sm">Telefone</Label>
                  <Input
                    id="edit_company_phone"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_whatsapp" className="text-xs sm:text-sm">WhatsApp</Label>
                  <Input
                    id="edit_company_whatsapp"
                    value={editingCompany.whatsapp || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_company_facebook" className="text-xs sm:text-sm">Facebook</Label>
                  <Input
                    id="edit_company_facebook"
                    value={editingCompany.facebook || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, facebook: e.target.value })}
                    placeholder="URL do Facebook"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_instagram" className="text-xs sm:text-sm">Instagram</Label>
                  <Input
                    id="edit_company_instagram"
                    value={editingCompany.instagram || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, instagram: e.target.value })}
                    placeholder="@usuario"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_cep" className="text-xs sm:text-sm">CEP</Label>
                <Input
                  id="edit_company_cep"
                  value={editingCompany.cep || ''}
                  onChange={(e) => handleEditCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="edit_company_street" className="text-xs sm:text-sm">Rua</Label>
                  <Input
                    id="edit_company_street"
                    value={editingCompany.street || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, street: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_number" className="text-xs sm:text-sm">Número</Label>
                  <Input
                    id="edit_company_number"
                    value={editingCompany.number || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, number: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_complement" className="text-xs sm:text-sm">Complemento</Label>
                <Input
                  id="edit_company_complement"
                  value={editingCompany.complement || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, complement: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_company_neighborhood" className="text-xs sm:text-sm">Bairro</Label>
                  <Input
                    id="edit_company_neighborhood"
                    value={editingCompany.neighborhood || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, neighborhood: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_city" className="text-xs sm:text-sm">Cidade</Label>
                  <Input
                    id="edit_company_city"
                    value={editingCompany.city || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_company_state" className="text-xs sm:text-sm">Estado</Label>
                <Input
                  id="edit_company_state"
                  value={editingCompany.state || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                  className="text-sm sm:text-base"
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
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sm:pt-6 border-t sm:border-t-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Cancelar
            </Button>
            <Button onClick={handleUpdateCompany} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Salvar Alterações
            </Button>
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