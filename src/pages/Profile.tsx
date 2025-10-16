import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { searchCep } from '@/lib/cepUtils';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    person_type: 'fisica',
    cpf_cnpj: '',
    rg: '',
    creci: '',
    user_type: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    company_id: '',
  });
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    try {
      const [profileData, companiesData, roleData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user?.id).single(),
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('user_roles').select('role').eq('user_id', user?.id).maybeSingle(),
      ]);

      if (profileData.error && profileData.error.code !== 'PGRST116') throw profileData.error;

      if (profileData.data) {
        setProfile({
          full_name: profileData.data.full_name || '',
          email: profileData.data.email || user?.email || '',
          phone: profileData.data.phone || '',
          person_type: profileData.data.person_type || 'fisica',
          cpf_cnpj: profileData.data.cpf_cnpj || '',
          rg: profileData.data.rg || '',
          creci: profileData.data.creci || '',
          user_type: profileData.data.user_type || '',
          cep: profileData.data.cep || '',
          street: profileData.data.street || '',
          number: profileData.data.number || '',
          complement: profileData.data.complement || '',
          neighborhood: profileData.data.neighborhood || '',
          city: profileData.data.city || '',
          state: profileData.data.state || '',
          company_id: profileData.data.company_id || '',
        });
      }

      if (companiesData.data) {
        setCompanies(companiesData.data);
      }

      if (roleData.data) {
        setUserRole(roleData.data.role);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCepSearch = async () => {
    if (profile.cep.length === 8) {
      toast({
        title: 'Buscando CEP...',
        description: 'Aguarde enquanto buscamos o endereço.',
      });
      
      const result = await searchCep(profile.cep);
      if (result) {
        setProfile({
          ...profile,
          street: result.logradouro || result.street,
          neighborhood: result.bairro || result.neighborhood,
          city: result.localidade || result.city,
          state: result.uf || result.state,
        });
        
        toast({
          title: 'CEP encontrado!',
          description: 'Endereço preenchido automaticamente.',
        });
      } else {
        toast({
          title: 'CEP não encontrado',
          description: 'Preencha o endereço manualmente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Dados básicos do seu cadastro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="person_type">Tipo de Pessoa</Label>
                  <Select
                    value={profile.person_type}
                    onValueChange={(value) => setProfile({ ...profile, person_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cpf_cnpj">
                    {profile.person_type === 'fisica' ? 'CPF' : 'CNPJ'}
                  </Label>
                  <Input
                    id="cpf_cnpj"
                    value={profile.cpf_cnpj}
                    onChange={(e) => setProfile({ ...profile, cpf_cnpj: e.target.value })}
                    placeholder={profile.person_type === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
                {profile.person_type === 'fisica' && (
                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={profile.rg}
                      onChange={(e) => setProfile({ ...profile, rg: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={profile.creci}
                    onChange={(e) => setProfile({ ...profile, creci: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="user_type">Tipo de Usuário</Label>
                  <Select
                    value={profile.user_type}
                    onValueChange={(value) => setProfile({ ...profile, user_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corretor_autonomo">Corretor Autônomo</SelectItem>
                      <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                      <SelectItem value="proprietario">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Select
                    value={profile.company_id}
                    onValueChange={(value) => setProfile({ ...profile, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Input
                    id="role"
                    value={userRole === 'admin' ? 'Administrador' : 'Usuário'}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas administradores podem alterar níveis de acesso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Informações de localização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={profile.cep}
                      onChange={(e) => setProfile({ ...profile, cep: e.target.value.replace(/\D/g, '') })}
                      placeholder="00000-000"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCepSearch}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={profile.street}
                    onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={profile.number}
                    onChange={(e) => setProfile({ ...profile, number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={profile.complement}
                    onChange={(e) => setProfile({ ...profile, complement: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={profile.neighborhood}
                    onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
