import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface CompanyUsersDialogProps {
  companyId: string | null;
  companyName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  archived: boolean;
  user_roles?: Array<{ role: string }> | null;
}

export default function CompanyUsersDialog({ companyId, companyName, isOpen, onClose }: CompanyUsersDialogProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchCompanyUsers(companyId);
    } else {
      setUsers([]);
    }
  }, [isOpen, companyId]);

  const fetchCompanyUsers = async (id: string) => {
    setLoadingUsers(true);
    try {
      // Primeiro buscar os profiles da empresa
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, archived')
        .eq('company_id', id)
        .order('full_name', { ascending: true });

      if (profilesError) {
        console.error("Erro ao buscar usuários da empresa:", profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // Buscar os roles de cada usuário
      const userIds = profilesData.map(p => p.id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error("Erro ao buscar roles dos usuários:", rolesError);
        // Continuar sem os roles se houver erro
      }

      // Combinar os dados
      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      }));

      console.log("Usuários carregados para empresa", id, ":", usersWithRoles);
      setUsers(usersWithRoles as UserProfile[]);
    } catch (error) {
      console.error("Error fetching company users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuários da Empresa: {companyName}</DialogTitle>
          <DialogDescription>
            Gerencie os usuários associados a esta empresa.
          </DialogDescription>
        </DialogHeader>
        {
          loadingUsers ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado para esta empresa.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userRole = user.user_roles && user.user_roles.length > 0 
                    ? user.user_roles[0].role 
                    : 'user';
                  const roleLabel = userRole === 'admin' ? 'Administrador' : 'Usuário';
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{roleLabel}</TableCell>
                      <TableCell>{user.archived ? 'Arquivado' : 'Ativo'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )
        }
      </DialogContent>
    </Dialog>
  );
}

