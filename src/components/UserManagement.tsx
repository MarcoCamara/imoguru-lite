import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield, User, KeyRound, Edit, Copy, Archive, ArchiveRestore, Home } from 'lucide-react';
import { fetchCEP } from '@/lib/cepUtils';
import { formatCPF, validateCPF } from '@/lib/validationUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_id: string | null;
  phone?: string;
  creci?: string;
  cpf_cnpj?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  archived?: boolean;
  companies: {
    name: string;
  } | null;
}

interface Company {
  id: string;
  name: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserPropertiesDialogOpen, setIsUserPropertiesDialogOpen] = useState(false);
  const [selectedUserForProperties, setSelectedUserForProperties] = useState<{ id: string, name: string } | null>(null);
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loadingUserProperties, setLoadingUserProperties] = useState(false);
  const [filterArchived, setFilterArchived] = useState<'all' | 'active' | 'archived'>('active');
  const navigate = useNavigate(); // Inicializar useNavigate
  const [newUser, setNewUser] = useState({
    email: '',
    password: 'senha123',
    fullName: '',
    companyId: undefined as string | undefined,
    role: 'user',
    phone: '',
    creci: '',
    cpf_cnpj: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    loadData();
  }, [filterArchived]); // Adicionar filterArchived como dependência

  const loadData = async () => {
    try {
      let query = supabase.from('profiles').select('id, email, full_name, company_id, cpf_cnpj, archived, phone, creci, cep, street, number, complement, neighborhood, city, state, companies(name)');

      if (filterArchived === 'active') {
        query = query.eq('archived', false);
      } else if (filterArchived === 'archived') {
        query = query.eq('archived', true);
      }

      const [usersData, companiesData, rolesData] = await Promise.all([
        query, // Usar a query com filtro
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (usersData.error) throw usersData.error;
      if (companiesData.error) throw companiesData.error;
      if (rolesData.error) throw rolesData.error;

      setUsers(usersData.data || []);
      setCompanies(companiesData.data || []);
      
      const rolesMap: Record<string, string> = {};
      rolesData.data?.forEach((role) => {
        rolesMap[role.user_id] = role.role;
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.cpf_cnpj && !validateCPF(newUser.cpf_cnpj)) {
      toast({
        title: 'Erro',
        description: 'CPF inválido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ 
            company_id: newUser.companyId,
            phone: newUser.phone,
            creci: newUser.creci,
            cpf_cnpj: newUser.cpf_cnpj,
            cep: newUser.cep,
            street: newUser.street,
            number: newUser.number,
            complement: newUser.complement,
            neighborhood: newUser.neighborhood,
            city: newUser.city,
            state: newUser.state,
          })
          .eq('id', authData.user.id);

        await supabase
          .from('user_roles')
          .insert([{
            user_id: authData.user.id,
            role: newUser.role as 'admin' | 'user',
          }]);
      }

      toast({
        title: 'Sucesso',
        description: `Usuário criado com sucesso! Email: ${newUser.email} | Senha padrão: senha123`,
        duration: 10000,
      });

      setNewUser({
        email: '',
        password: 'senha123',
        fullName: '',
        companyId: undefined,
        role: 'user',
        phone: '',
        creci: '',
        cpf_cnpj: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert([{
          user_id: userId,
          role: newRole as 'admin' | 'user',
        }]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Nível de acesso atualizado!',
      });

      loadData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o nível de acesso.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        // Garantir que a URL de redirecionamento aponta para a página de reset de senha do frontend
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: `Um email de recuperação de senha foi enviado para ${userEmail}. Por favor, verifique sua caixa de entrada (e spam) e siga o link para redefinir sua senha.`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro ao resetar senha',
        description: error.message || 'Não foi possível enviar o email de recuperação. Por favor, verifique as configurações do Supabase para redefinição de senha.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (editingUser.cpf_cnpj && !validateCPF(editingUser.cpf_cnpj)) {
      toast({
        title: 'Erro',
        description: 'CPF inválido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verificar se o email foi alterado
      const originalUser = users.find(u => u.id === editingUser.id);
      const emailChanged = originalUser && originalUser.email !== editingUser.email;

      if (emailChanged) {
        // Chamar Edge Function para atualizar o email no Auth
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        const response = await fetch(`${supabaseUrl}/functions/v1/update-user-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            userId: editingUser.id,
            newEmail: editingUser.email
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar email.');
        }

        toast({
          title: 'Sucesso',
          description: 'Email atualizado com sucesso! O usuário precisará fazer login novamente.',
        });
      } else {
        // Se o email não mudou, apenas atualizar o perfil normalmente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: editingUser.full_name,
            company_id: editingUser.company_id,
            phone: editingUser.phone,
            creci: editingUser.creci,
            cpf_cnpj: editingUser.cpf_cnpj,
            cep: editingUser.cep,
            street: editingUser.street,
            number: editingUser.number,
            complement: editingUser.complement,
            neighborhood: editingUser.neighborhood,
            city: editingUser.city,
            state: editingUser.state,
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Dados do usuário atualizados!',
        });
      }

      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCepChange = async (cep: string) => {
    if (!editingUser) return;
    
    setEditingUser({ ...editingUser, cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await fetchCEP(cep);
      if (data) {
        setEditingUser({
          ...editingUser,
          cep,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Verificar se o usuário tem imóveis associados
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', userId);

      if (propertiesError) throw propertiesError;

      if (properties && properties.length > 0) {
        toast({
          title: 'Não é possível deletar',
          description: `Este usuário possui ${properties.length} imóvel(is) associado(s). Delete os imóveis antes de deletar o usuário.`,
          variant: 'destructive',
        });
        return;
      }

      if (!confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
        return;
      }

      // Chamar a Edge Function para deletar o usuário do Auth e acionar exclusões em cascata
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      console.log('Delete user Edge Function response status:', response.status);
      console.log('Delete user Edge Function content-type:', response.headers.get('content-type'));

      if (!response.ok) {
        let errorMessage = 'Erro ao chamar a Edge Function de exclusão de usuário.';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else if (response.status !== 204) { // Se não é 204 e não é JSON, tenta texto ou assume erro genérico
          errorMessage = await response.text();
          if (!errorMessage) errorMessage = 'Resposta inesperada da Edge Function.';
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário deletado com sucesso do sistema de autenticação e perfis relacionados.',
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o usuário. Verifique se há dependências ou permissões.',
        variant: 'destructive',
      });
    }
  };

  const handleViewUserProperties = async (user: UserProfile) => {
    setSelectedUserForProperties({ id: user.id, name: user.full_name });
    setIsUserPropertiesDialogOpen(true);
    setLoadingUserProperties(true);

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, title, purpose, property_type, status, city, state, sale_price, rental_price, archived, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching user properties:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os imóveis do usuário.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUserProperties(false);
    }
  };

  const handleDuplicateUser = async (user: UserProfile) => {
    try {
      // Buscar todos os dados do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Dados do usuário não encontrados');

      // Gerar novo email com timestamp
      const timestamp = Date.now();
      const emailParts = profileData.email.split('@');
      const newEmail = `${emailParts[0]}_copia_${timestamp}@${emailParts[1]}`;

      // Usar senha padrão
      const defaultPassword = 'senha123';

      // Criar novo usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: defaultPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Aguardar um pouco para o trigger criar o perfil básico
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o perfil criado automaticamente com os dados do usuário original
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: `${profileData.full_name} (Cópia)`,
          company_id: profileData.company_id,
          phone: profileData.phone,
          creci: profileData.creci,
          cpf_cnpj: null, // CPF/CNPJ não pode ser duplicado
          cep: profileData.cep,
          street: profileData.street,
          number: profileData.number,
          complement: profileData.complement,
          neighborhood: profileData.neighborhood,
          city: profileData.city,
          state: profileData.state,
          archived: false,
        })
        .eq('id', authData.user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Buscar roles do usuário original
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // Copiar roles para o novo usuário
      if (rolesData && rolesData.length > 0) {
        await supabase
          .from('user_roles')
          .insert(
            rolesData.map(r => ({
              user_id: authData.user.id,
              role: r.role,
            }))
          );
      }

      toast({
        title: 'Sucesso',
        description: `Usuário duplicado! Email: ${newEmail} | Senha padrão: senha123`,
        duration: 10000,
      });

      loadData();
    } catch (error: any) {
      console.error('Error duplicating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível duplicar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const archived = user?.archived || false;

      console.log('Arquivando usuário:', { userId, currentArchived: archived, willBecomeArchived: !archived });

      // Verificar se o usuário tem imóveis ativos
      if (!archived) {
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', userId)
          .eq('archived', false);

        if (propertiesError) throw propertiesError;

        if (properties && properties.length > 0) {
          toast({
            title: 'Atenção',
            description: `Este usuário possui ${properties.length} imóvel(is) ativo(s). Considere arquivar ou deletar os imóveis antes de arquivar o usuário.`,
            variant: 'destructive',
          });
          
          if (!confirm(`Este usuário possui ${properties.length} imóvel(is) ativo(s). Deseja continuar e arquivar o usuário mesmo assim?`)) {
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ archived: !archived })
        .eq('id', userId)
        .select();

      console.log('Resultado da atualização:', { data, error });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: archived ? 'Usuário desarquivado!' : 'Usuário arquivado!',
      });

      loadData();
    } catch (error: any) {
      console.error('Error archiving user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível arquivar o usuário.',
        variant: 'destructive',
      });
    }
  };

  const handleCepChange = async (cep: string) => {
    setNewUser({ ...newUser, cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await fetchCEP(cep);
      if (data) {
        setNewUser({
          ...newUser,
          cep,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        });
      }
    }
  };

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Usuários</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gerencie os usuários do sistema</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select
              value={filterArchived}
              onValueChange={(value: 'all' | 'active' | 'archived') => setFilterArchived(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                <SelectValue placeholder="Filtrar Usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Usuários Ativos</SelectItem>
                <SelectItem value="archived">Usuários Arquivados</SelectItem>
                <SelectItem value="all">Todos os Usuários</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Usuário</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              <DialogHeader className="pb-2 sm:pb-4">
                <DialogTitle className="text-base sm:text-lg md:text-xl">Criar Novo Usuário</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="user_email" className="text-xs sm:text-sm">E-mail *</Label>
                    <Input
                      id="user_email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="usuario@exemplo.com"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_password" className="text-xs sm:text-sm">Senha *</Label>
                    <Input
                      id="user_password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="senha123"
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Senha padrão: senha123 (pode ser alterada aqui se necessário)</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_name" className="text-xs sm:text-sm">Nome Completo *</Label>
                  <Input
                    id="user_name"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Nome do usuário"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="user_company" className="text-xs sm:text-sm">Empresa (Opcional)</Label>
                  <Select
                    value={newUser.companyId}
                    onValueChange={(value) => setNewUser({ ...newUser, companyId: value })}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Selecione uma empresa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-xs sm:text-sm">
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user_role" className="text-xs sm:text-sm">Nível de Acesso</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" className="text-xs sm:text-sm">Usuário</SelectItem>
                      <SelectItem value="admin" className="text-xs sm:text-sm">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="user_phone" className="text-xs sm:text-sm">Telefone</Label>
                    <Input
                      id="user_phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_creci" className="text-xs sm:text-sm">CRECI</Label>
                    <Input
                      id="user_creci"
                      value={newUser.creci}
                      onChange={(e) => setNewUser({ ...newUser, creci: e.target.value })}
                      placeholder="Número do CRECI"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_cpf" className="text-xs sm:text-sm">CPF</Label>
                    <Input
                      id="user_cpf"
                      value={newUser.cpf_cnpj}
                      onChange={(e) => setNewUser({ ...newUser, cpf_cnpj: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_cep" className="text-xs sm:text-sm">CEP</Label>
                  <Input
                    id="user_cep"
                    value={newUser.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <Label htmlFor="user_street" className="text-xs sm:text-sm">Rua</Label>
                    <Input
                      id="user_street"
                      value={newUser.street}
                      onChange={(e) => setNewUser({ ...newUser, street: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_number" className="text-xs sm:text-sm">Número</Label>
                    <Input
                      id="user_number"
                      value={newUser.number}
                      onChange={(e) => setNewUser({ ...newUser, number: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_complement" className="text-xs sm:text-sm">Complemento</Label>
                  <Input
                    id="user_complement"
                    value={newUser.complement}
                    onChange={(e) => setNewUser({ ...newUser, complement: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="user_neighborhood" className="text-xs sm:text-sm">Bairro</Label>
                    <Input
                      id="user_neighborhood"
                      value={newUser.neighborhood}
                      onChange={(e) => setNewUser({ ...newUser, neighborhood: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_city" className="text-xs sm:text-sm">Cidade</Label>
                    <Input
                      id="user_city"
                      value={newUser.city}
                      onChange={(e) => setNewUser({ ...newUser, city: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_state" className="text-xs sm:text-sm">Estado</Label>
                  <Input
                    id="user_state"
                    value={newUser.state}
                    onChange={(e) => setNewUser({ ...newUser, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sm:pt-6 border-t sm:border-t-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div> {/* Fecha a div que agrupa o Select e o Botão de Novo Usuário */}
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário cadastrado
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {userRoles[user.id] === 'admin' ? (
                      <Shield className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.full_name || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {user.companies && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {user.companies.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={userRoles[user.id] === 'admin' ? 'default' : 'secondary'}>
                      {userRoles[user.id] === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                    {user.archived && (
                      <Badge variant="outline" className="bg-muted">
                        Arquivado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <div className="w-full sm:w-auto">
                    <Select
                      value={userRoles[user.id] || 'user'}
                      onValueChange={(value) => handleUpdateRole(user.id, value)}
                    >
                      <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user" className="text-xs sm:text-sm">Usuário</SelectItem>
                        <SelectItem value="admin" className="text-xs sm:text-sm">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      title="Editar usuário"
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleResetPassword(user.email)}
                      title="Resetar senha"
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <KeyRound className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicateUser(user)}
                      title="Duplicar usuário"
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleArchiveUser(user.id)}
                      title={user.archived ? 'Desarquivar usuário' : 'Arquivar usuário'}
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      {user.archived ? (
                        <ArchiveRestore className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Archive className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewUserProperties(user)}
                      title="Visualizar imóveis"
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Deletar usuário"
                      className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
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
            <DialogTitle className="text-base sm:text-lg md:text-xl">Editar Usuário</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div>
                <Label htmlFor="edit_email" className="text-xs sm:text-sm">E-mail *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">Apenas administradores podem alterar o e-mail</p>
              </div>
              <div>
                <Label htmlFor="edit_name" className="text-xs sm:text-sm">Nome Completo *</Label>
                <Input
                  id="edit_name"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="edit_company" className="text-xs sm:text-sm">Empresa (Opcional)</Label>
                <Select
                  value={editingUser.company_id || undefined}
                  onValueChange={(value) => setEditingUser({ ...editingUser, company_id: value })}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Selecione uma empresa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id} className="text-xs sm:text-sm">
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_role" className="text-xs sm:text-sm">Nível de Acesso</Label>
                <Select
                  value={userRoles[editingUser.id] || 'user'}
                  onValueChange={(value) => handleUpdateRole(editingUser.id, value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user" className="text-xs sm:text-sm">Usuário</SelectItem>
                    <SelectItem value="admin" className="text-xs sm:text-sm">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_phone" className="text-xs sm:text-sm">Telefone</Label>
                  <Input
                    id="edit_phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_creci" className="text-xs sm:text-sm">CRECI</Label>
                  <Input
                    id="edit_creci"
                    value={editingUser.creci || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, creci: e.target.value })}
                    placeholder="Número do CRECI"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_cpf" className="text-xs sm:text-sm">CPF</Label>
                  <Input
                    id="edit_cpf"
                    value={editingUser.cpf_cnpj || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cpf_cnpj: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_cep" className="text-xs sm:text-sm">CEP</Label>
                <Input
                  id="edit_cep"
                  value={editingUser.cep || ''}
                  onChange={(e) => handleEditCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="edit_street" className="text-xs sm:text-sm">Rua</Label>
                  <Input
                    id="edit_street"
                    value={editingUser.street || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, street: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_number" className="text-xs sm:text-sm">Número</Label>
                  <Input
                    id="edit_number"
                    value={editingUser.number || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, number: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_complement" className="text-xs sm:text-sm">Complemento</Label>
                <Input
                  id="edit_complement"
                  value={editingUser.complement || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, complement: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_neighborhood" className="text-xs sm:text-sm">Bairro</Label>
                  <Input
                    id="edit_neighborhood"
                    value={editingUser.neighborhood || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, neighborhood: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_city" className="text-xs sm:text-sm">Cidade</Label>
                  <Input
                    id="edit_city"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_state" className="text-xs sm:text-sm">Estado</Label>
                <Input
                  id="edit_state"
                  value={editingUser.state || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sm:pt-6 border-t sm:border-t-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Visualizar Imóveis do Usuário */}
      <Dialog open={isUserPropertiesDialogOpen} onOpenChange={setIsUserPropertiesDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-5xl max-w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Imóveis de {selectedUserForProperties?.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Lista de imóveis associados a este usuário.
            </DialogDescription>
          </DialogHeader>
          {loadingUserProperties ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando imóveis...</p>
              </div>
            </div>
          ) : userProperties.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Este usuário não possui imóveis cadastrados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Total de {userProperties.length} {userProperties.length === 1 ? 'imóvel' : 'imóveis'}
                </p>
              </div>
              <div className="border rounded-lg overflow-x-auto overflow-y-hidden">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium">Código</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium">Título</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium hidden sm:table-cell">Tipo</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium">Finalidade</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium hidden md:table-cell">Cidade</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium hidden lg:table-cell">Preço</th>
                      <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium">Status</th>
                      <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProperties.map((property) => (
                      <tr key={property.id} className="border-t hover:bg-muted/50">
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">{property.code}</td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium break-words max-w-[150px] sm:max-w-none">{property.title}</td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden sm:table-cell">{property.property_type || 'N/A'}</td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                          <Badge variant={property.purpose === 'venda' ? 'default' : property.purpose === 'venda_locacao' ? 'outline' : 'secondary'} className="text-xs">
                            {property.purpose === 'venda' ? 'Venda' : property.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden md:table-cell break-words">{property.city || 'N/A'}, {property.state || ''}</td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden lg:table-cell">
                          {property.purpose === 'venda' || property.purpose === 'venda_locacao'
                            ? (property.sale_price 
                                ? new Intl.NumberFormat('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'BRL' 
                                  }).format(property.sale_price)
                                : 'N/A')
                            : (property.rental_price 
                                ? new Intl.NumberFormat('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'BRL' 
                                  }).format(property.rental_price)
                                : 'N/A')}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                          {property.archived ? (
                            <Badge variant="outline" className="bg-muted text-xs">Arquivado</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              {property.status === 'disponivel' ? 'Disponível' : 
                               property.status === 'reservado' ? 'Reservado' : 
                               property.status === 'vendido' ? 'Vendido' : 
                               property.status === 'alugado' ? 'Alugado' : 'Ativo'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsUserPropertiesDialogOpen(false);
                              navigate(`/property/${property.id}`);
                            }}
                            className="text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline">Ver Detalhes</span>
                            <span className="sm:hidden">Ver</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 sm:pt-6 border-t sm:border-t-0">
            <Button variant="outline" onClick={() => setIsUserPropertiesDialogOpen(false)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}