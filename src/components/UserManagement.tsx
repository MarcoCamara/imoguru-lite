import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield, User, KeyRound, Edit } from 'lucide-react';
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_id: string | null;
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
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    companyId: undefined as string | undefined,
    role: 'user',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, companiesData, rolesData] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, company_id, companies(name)'),
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
        if (newUser.companyId) {
          await supabase
            .from('profiles')
            .update({ company_id: newUser.companyId })
            .eq('id', authData.user.id);
        }

        await supabase
          .from('user_roles')
          .insert([{
            user_id: authData.user.id,
            role: newUser.role as 'admin' | 'user',
          }]);
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso!',
      });

      setNewUser({
        email: '',
        password: '',
        fullName: '',
        companyId: undefined,
        role: 'user',
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
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: `Email de recuperação de senha enviado para ${userEmail}`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o email de recuperação.',
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

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          company_id: editingUser.company_id,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados do usuário atualizados!',
      });

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

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gerencie os usuários do sistema</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="user_email">E-mail *</Label>
                  <Input
                    id="user_email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="user_password">Senha *</Label>
                  <Input
                    id="user_password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="user_name">Nome Completo *</Label>
                  <Input
                    id="user_name"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="user_company">Empresa (Opcional)</Label>
                  <Select
                    value={newUser.companyId}
                    onValueChange={(value) => setNewUser({ ...newUser, companyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user_role">Nível de Acesso</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser}>Criar Usuário</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {userRoles[user.id] === 'admin' ? (
                      <Shield className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.companies && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.companies.name}
                      </p>
                    )}
                  </div>
                  <Badge variant={userRoles[user.id] === 'admin' ? 'default' : 'secondary'}>
                    {userRoles[user.id] === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={userRoles[user.id] || 'user'}
                    onValueChange={(value) => handleUpdateRole(user.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuário"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleResetPassword(user.email)}
                    title="Resetar senha"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_email">E-mail</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="edit_name">Nome Completo</Label>
                <Input
                  id="edit_name"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label htmlFor="edit_company">Empresa</Label>
                <Select
                  value={editingUser.company_id || undefined}
                  onValueChange={(value) => setEditingUser({ ...editingUser, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}