import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { MoreVertical, Copy, Trash2, Eye, PlusCircle, Archive, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  company_id: string;
  api_type: 'properties' | 'contact_requests' | 'ai_status';
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
  archived: boolean;
  companies: {
    name: string;
  }
}

type ApiKeyType = 'properties' | 'contact_requests' | 'ai_status';

const apiKeyTypes: Record<ApiKeyType, { name: string; description: string; endpoint: string; sampleResponse: string }> = {
    'properties': {
      name: 'Acesso aos Imóveis',
      description: 'Permite acesso de leitura a todos os dados públicos dos imóveis da empresa selecionada.',
      endpoint: 'api-properties',
      sampleResponse: JSON.stringify({
        success: true,
        count: 10,
        data: [{ id: '...', title: 'Apartamento Centro' }]
      }, null, 2)
    },
    'contact_requests': {
      name: 'Acesso a Solicitações de Contato',
      description: 'Permite acesso de leitura a todas as solicitações de contato recebidas pela empresa selecionada.',
      endpoint: 'api-contact-requests',
      sampleResponse: JSON.stringify({
        success: true,
        count: 4,
        data: [{ id: '...', contact: { name: 'João', phone: '...' }, status: 'pending' }]
      }, null, 2)
    },
    'ai_status': {
      name: 'Status da IA',
      description: 'Retorna se a IA está ativa ou inativa para a empresa vinculada à chave.',
      endpoint: 'api-ai-status',
      sampleResponse: JSON.stringify({
        status: 'active',
        ai_enabled: true
      }, null, 2)
    }
};

export function ApiKeysManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyCompanyId, setNewApiKeyCompanyId] = useState('');
  const [newApiKeyType, setNewApiKeyType] = useState<ApiKeyType>('properties');
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await loadCompanies();
          await loadApiKeys();
        } else {
          unsub = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN') {
              await loadCompanies();
              await loadApiKeys();
            }
          });
        }
      } catch (e) {
        console.error('Erro ao inicializar ApiKeysManagement:', e);
      }
    };

    init();

    return () => {
      unsub?.data.subscription.unsubscribe();
    };
  }, [showArchived]);

  const loadCompanies = async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')
        .throwOnError();
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Falha ao carregar empresas:', error?.message || error);
      toast.error(`Erro ao carregar empresas: ${error?.message || 'desconhecido'}`);
    }
  };

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*, companies(name)')
        .eq('archived', showArchived)
        .order('created_at', { ascending: false })
        .throwOnError();
      setApiKeys((data || []) as ApiKey[]);
    } catch (error: any) {
      console.error('Falha ao carregar chaves de API:', error?.message || error);
      toast.error(`Erro ao carregar chaves de API: ${error?.message || 'desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Chave de API copiada para a área de transferência!');
  };

  const generateApiKey = () => {
    // Gerar chave aleatória com prefixo (32 caracteres hex)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return 'sk_' + hexString;
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName || !newApiKeyCompanyId || !newApiKeyType) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    // Validar que api_type está nos valores permitidos
    const validApiTypes: ApiKeyType[] = ['properties', 'contact_requests', 'ai_status'];
    if (!validApiTypes.includes(newApiKeyType)) {
      toast.error(`Tipo de API inválido: ${newApiKeyType}. Valores permitidos: ${validApiTypes.join(', ')}`);
      return;
    }

    try {
      // Gerar chave única
      let apiKey = generateApiKey();
      let keyExists = true;
      let attempts = 0;
      
      // Verificar se a chave já existe e gerar nova se necessário
      while (keyExists && attempts < 10) {
        const { data: existingKey } = await supabase
          .from('api_keys')
          .select('id')
          .eq('api_key', apiKey)
          .maybeSingle();
        
        if (!existingKey) {
          keyExists = false;
        } else {
          apiKey = generateApiKey();
          attempts++;
        }
      }

      if (keyExists) {
        toast.error('Erro ao gerar chave única. Tente novamente.');
        return;
      }

      // Garantir que api_type está no formato correto (trim e lowercase)
      const sanitizedApiType = newApiKeyType.trim().toLowerCase() as ApiKeyType;
      
      // Validar novamente após sanitização
      if (!validApiTypes.includes(sanitizedApiType)) {
        toast.error(`Tipo de API inválido após sanitização: ${sanitizedApiType}`);
        return;
      }

      // Inserir a nova API key diretamente (sem select para evitar 400 do PostgREST)
      const insertData: any = {
        name: newApiKeyName.trim(),
        api_key: apiKey,
        company_id: newApiKeyCompanyId,
        api_type: sanitizedApiType, // Usar valor sanitizado
      };
      
      // Só adicionar created_by se o usuário estiver autenticado
      if (user?.id) {
        insertData.created_by = user.id;
      }
      
      console.log('Inserindo API key com dados:', { 
        name: insertData.name,
        company_id: insertData.company_id,
        api_type: insertData.api_type,
        api_type_type: typeof insertData.api_type,
        api_type_length: insertData.api_type?.length,
        created_by: insertData.created_by || 'null',
        api_key: '***' 
      }); // Log detalhado sem expor a chave
      
      // Verificar se api_type está exatamente correto antes de inserir
      if (insertData.api_type !== 'properties' && 
          insertData.api_type !== 'contact_requests' &&
          insertData.api_type !== 'ai_status') {
        console.error('ERRO: api_type inválido antes do insert:', {
          valor: insertData.api_type,
          tipo: typeof insertData.api_type,
          codigo: insertData.api_type?.charCodeAt?.(0),
          valores_permitidos: ['properties', 'contact_requests', 'ai_status']
        });
        toast.error(`Erro: Tipo de API inválido: "${insertData.api_type}". Valores permitidos: properties, contact_requests, ai_status`);
        return;
      }
      
      const { error } = await supabase
        .from('api_keys')
        .insert(insertData);

      if (error) {
        console.error('Insert api_keys falhou:', error);
        toast.error('Erro ao criar chave de API:', error.message);
      } else {
        toast.success('Chave de API criada com sucesso!');
        loadApiKeys();
        setIsDialogOpen(false);
        setNewApiKeyName('');
        setNewApiKeyCompanyId('');
        setNewApiKeyType('properties');
      }
    } catch (error: any) {
      toast.error('Erro ao criar chave de API:', error.message);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao deletar chave de API:', error.message);
    } else {
      toast.success('Chave de API deletada permanentemente.');
      loadApiKeys();
    }
  };

  const handleArchiveApiKey = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('api_keys').update({ archived: !currentStatus }).eq('id', id);
    if (error) {
      toast.error('Erro ao arquivar/desarquivar chave:', error.message);
    } else {
      toast.success(`Chave ${!currentStatus ? 'arquivada' : 'desarquivada'} com sucesso.`);
      loadApiKeys();
    }
  };

  const filteredKeys = useMemo(() => {
    return apiKeys.filter(key => key.archived === showArchived);
  }, [apiKeys, showArchived]);

  return (
    <div className="p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Gerenciamento de Chaves de API</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowArchived(!showArchived)} variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                {showArchived ? 'Ver Ativas' : 'Ver Arquivadas'}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                    <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Criar Chave de API</span><span className="sm:hidden">Criar</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md overflow-x-hidden">
                    <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Criar Nova Chave de API</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="apiKeyName">Nome da Chave</label>
                        <Input id="apiKeyName" value={newApiKeyName} onChange={(e) => setNewApiKeyName(e.target.value)} placeholder="Ex: Integração N8N" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="companySelect">Empresa</label>
                        <Select value={newApiKeyCompanyId} onValueChange={setNewApiKeyCompanyId}>
                        <SelectTrigger id="companySelect">
                            <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
                            {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label>Tipo de Acesso</label>
                        <Select 
                            value={newApiKeyType} 
                            onValueChange={(value) => {
                                // Garantir que o valor está correto
                                const validValue = value as ApiKeyType;
                                if (['properties', 'contact_requests', 'ai_status'].includes(validValue)) {
                                    setNewApiKeyType(validValue);
                                } else {
                                    console.error('Valor inválido do Select:', value);
                                    toast.error(`Tipo de API inválido selecionado: ${value}`);
                                }
                            }}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de API" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="properties">Acesso aos Imóveis</SelectItem>
                            <SelectItem value="contact_requests">Acesso a Solicitações de Contato</SelectItem>
                            <SelectItem value="ai_status">Status da IA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreateApiKey} className="w-full">Gerar Chave</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Nome</TableHead>
              <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Empresa</TableHead>
              <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
              <TableHead className="text-xs sm:text-sm hidden md:table-cell">Último Uso</TableHead>
              <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Usos</TableHead>
              <TableHead className="text-xs sm:text-sm hidden md:table-cell">Criação</TableHead>
              <TableHead className="text-xs sm:text-sm w-[60px] sm:w-auto">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} className="text-center">Carregando...</TableCell></TableRow>}
            {!loading && filteredKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="text-xs sm:text-sm break-words">{key.name}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden sm:table-cell break-words">{key.companies?.name || 'N/A'}</TableCell>
                <TableCell className="text-xs sm:text-sm break-words">{apiKeyTypes[key.api_type]?.name || key.api_type}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden md:table-cell">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Nunca'}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{key.usage_count}</TableCell>
                <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(key.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="w-[60px] sm:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 sm:w-56">
                      <DropdownMenuItem onClick={() => { setSelectedApiKey(key); setIsViewDialogOpen(true); }} className="text-xs sm:text-sm">
                        <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Ver Detalhes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyToClipboard(key.api_key)} className="text-xs sm:text-sm">
                        <Copy className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Copiar Chave</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveApiKey(key.id, key.archived)} className="text-xs sm:text-sm">
                        {key.archived ? <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> : <Archive className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />}
                        <span className="truncate">{key.archived ? 'Desarquivar' : 'Arquivar'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteApiKey(key.id)} className="text-red-600 text-xs sm:text-sm">
                        <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Deletar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes da Chave de API</DialogTitle>
            </DialogHeader>
            {selectedApiKey && (
            <div>
                <h3 className="font-semibold">{selectedApiKey.name}</h3>
                <p className="text-sm text-muted-foreground">
                    {apiKeyTypes[selectedApiKey.api_type]?.description || 'Tipo de API desconhecido.'}
                </p>
                
                <div className="mt-4 flex items-center space-x-2">
                    <Input readOnly value={selectedApiKey.api_key} className="font-mono"/>
                    <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(selectedApiKey.api_key)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                
                <h4 className="font-semibold mt-4">Informações da API</h4>
                <p className="text-sm text-muted-foreground mt-2">
                <strong>Header:</strong> <code className="bg-muted px-2 py-1 rounded">x-api-key</code>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                <strong>Endpoint:</strong> <code className="bg-muted px-2 py-1 rounded">{`${supabaseUrl}/functions/v1/${apiKeyTypes[selectedApiKey.api_type]?.endpoint || '...'}`}</code>
                </p>
                
                {apiKeyTypes[selectedApiKey.api_type as ApiKeyType]?.sampleResponse && (
                <>
                    <h4 className="font-semibold mt-4">Exemplo de Resposta (JSON)</h4>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                    {apiKeyTypes[selectedApiKey.api_type as ApiKeyType]?.sampleResponse}
                    </pre>
                </>
                )}

            </div>
            )}
        </DialogContent>
        </Dialog>
    </div>
  );
}

