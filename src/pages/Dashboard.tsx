import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Plus, LogOut, Filter, Share2, FileSpreadsheet, Settings, User, LayoutGrid, List, Globe, MessageSquareMore, Sparkles, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyCard from '@/components/PropertyCard';
import DashboardMetrics from '@/components/DashboardMetrics';
import { usePrint } from '@/hooks/usePrint';
import { exportToCSV, exportToXLSX, exportToJSON } from '@/lib/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareDialog from '@/components/ShareDialog';
import ContactRequestsManager from '@/components/ContactRequestsManager'; // Importar o novo componente
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Importar Dialog
import { formatDistanceToNow, parseISO, setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toggle } from '@/components/ui/toggle'; // Importar Toggle

setDefaultOptions({ locale: ptBR });

export default function Dashboard() {
  const { user, signOut, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { printProperties } = usePrint();
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [propertyToShare, setPropertyToShare] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [companies, setCompanies] = useState<any[]>([]); // Novo estado para lista de empresas
  const [selectedPublicCompanyId, setSelectedPublicCompanyId] = useState<string | null>(null); // Novo estado para empresa pública selecionada
  const [showContactRequestsDialog, setShowContactRequestsDialog] = useState(false); // Novo estado para o diálogo de solicitações de contato
  const [averageResponseTime, setAverageResponseTime] = useState<string | null>(null); // Novo estado para tempo médio de atendimento
  const location = useLocation(); // Inicializar useLocation
  const queryParams = new URLSearchParams(location.search);
  const userIdFromUrl = queryParams.get('userId'); // Obter userId da URL
  const [userCompany, setUserCompany] = useState<any>(null); // Novo estado para a empresa do usuário logado
  const [aiAgentEnabled, setAiAgentEnabled] = useState(false); // Novo estado para o status do agente de IA
  const [systemSettings, setSystemSettings] = useState<any>({
    app_name: 'ImoGuru',
    logo_url: null,
    logo_size_mobile: 40,
    logo_size_tablet: 48,
    logo_size_desktop: 56,
    show_dashboard_metrics: true,
    show_dashboard_charts: true,
    font_family: 'Arial', // Novo campo
    font_size: 24, // Novo campo
    show_version_in_header: true,
    primary_color: '#8b5cf6',
    secondary_color: '#ec4899',
  });

  const primaryColor = systemSettings.primary_color || '#8b5cf6';
  const secondaryColor = systemSettings.secondary_color || '#ec4899';
  const accentGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  const outlineButtonStyle = { borderColor: primaryColor, borderWidth: '2px', color: primaryColor, background: '#ffffff' };
  const solidButtonStyle = { backgroundColor: primaryColor, border: 'none', color: '#ffffff' };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchSystemSettings();
      fetchCompanies(); // Buscar empresas para todos os usuários
      if (isAdmin) {
        fetchAverageResponseTime(); // Buscar tempo médio de atendimento
      }

      // Setup realtime subscription for properties table
      const channel = supabase
        .channel('properties-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'properties',
            filter: isAdmin ? undefined : `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Property change detected:', payload);
            fetchProperties(); // Refresh properties when any change occurs
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin, userIdFromUrl]); // Adicionar userIdFromUrl como dependência

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'logo_url', 'logo_size_mobile', 'logo_size_tablet', 'logo_size_desktop', 'show_dashboard_metrics', 'show_dashboard_charts', 'font_family', 'font_size', 'show_version_in_header', 'primary_color', 'secondary_color']); // Incluir novos campos

      if (error) throw error;

      const settingsObj: any = {
        app_name: 'ImoGuru',
        logo_url: null,
        logo_size_mobile: 40,
        logo_size_tablet: 48,
        logo_size_desktop: 56,
        show_dashboard_metrics: true,
        show_dashboard_charts: true,
        font_family: 'Arial', // Default para novos campos
        font_size: 24, // Default para novos campos
        show_version_in_header: true, // Default para exibir versão
        primary_color: '#8b5cf6',
        secondary_color: '#ec4899',
      };
      data?.forEach((item) => {
        settingsObj[item.setting_key] = item.setting_value;
      });

      setSystemSettings(settingsObj);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, ai_agent_enabled')
        .order('name');
      if (error) throw error;
      setCompanies(data || []);

      // Buscar a empresa do usuário através da tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      
      if (!profileError && profileData?.company_id) {
        const currentUserCompany = data?.find((company: any) => company.id === profileData.company_id);
        if (currentUserCompany) {
          setUserCompany(currentUserCompany);
          setAiAgentEnabled(currentUserCompany.ai_agent_enabled);
        }
      }
      
      // Se for admin e tiver apenas uma empresa, ou se não houver seleção prévia, seleciona a primeira
      if (isAdmin && data && data.length > 0 && !selectedPublicCompanyId) {
        setSelectedPublicCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading companies for public view:', error);
    }
  };

  const fetchAverageResponseTime = async () => {
    try {
      const { data, error } = await supabase
        .from('public_contact_requests')
        .select('created_at, responded_at')
        .not('responded_at', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        let totalResponseTimeMillis = 0;
        data.forEach(request => {
          const created = parseISO(request.created_at);
          const responded = parseISO(request.responded_at);
          totalResponseTimeMillis += Math.abs(responded.getTime() - created.getTime());
        });

        const averageMillis = totalResponseTimeMillis / data.length;
        const averageMinutes = Math.floor(averageMillis / (1000 * 60));
        
        if (averageMinutes < 60) {
          setAverageResponseTime(`${averageMinutes} min`);
        } else if (averageMinutes < (24 * 60)) {
          const hours = Math.floor(averageMinutes / 60);
          const minutes = averageMinutes % 60;
          setAverageResponseTime(`${hours} h ${minutes} min`);
        } else {
          const days = Math.floor(averageMinutes / (24 * 60));
          const hours = Math.floor((averageMinutes % (24 * 60)) / 60);
          setAverageResponseTime(`${days} d ${hours} h`);
        }
      } else {
        setAverageResponseTime('N/A');
      }
    } catch (error) {
      console.error('Error fetching average response time:', error);
      setAverageResponseTime('Erro');
    }
  };

  const handleToggleFeature = async (propertyId: string, isFeatured: boolean) => {
    try {
      const propertyToFeature = properties.find(p => p.id === propertyId);
      if (!propertyToFeature) {
        throw new Error("Imóvel não encontrado.");
      }

      if (isFeatured) {
        // Desmarcar qualquer outro imóvel em destaque da mesma empresa
        const { error: unf_error } = await supabase
          .from('properties')
          .update({ is_featured: false })
          .eq('company_id', propertyToFeature.company_id)
          .eq('is_featured', true);
        
        if (unf_error) throw unf_error;
      }

      // Atualizar o status do imóvel alvo
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: isFeatured })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: isFeatured ? 'Imóvel marcado como destaque!' : 'Imóvel removido dos destaques.',
      });
      fetchProperties(); // Recarregar propriedades para refletir a mudança
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar destaque',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAiAgent = async () => {
    if (!userCompany) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ ai_agent_enabled: !aiAgentEnabled })
        .eq('id', userCompany.id);

      if (error) throw error;

      setAiAgentEnabled(prev => !prev); // Atualiza o estado local
      toast({
        title: 'Sucesso',
        description: !aiAgentEnabled ? 'Agente de IA ativado para sua empresa!' : 'Agente de IA desativado para sua empresa.',
      });
    } catch (error: any) {
      console.error('Error toggling AI agent status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alternar o status do agente de IA.',
        variant: 'destructive',
      });
    }
  };

  const fetchProperties = async () => {
    try {
      setIsLoadingProperties(true);
      
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            url,
            is_cover,
            display_order
          )
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      // Se userIdFromUrl existe, filtrar por ele
      if (userIdFromUrl) {
        query = query.eq('user_id', userIdFromUrl);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imóveis',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const getPropertiesToExport = () => {
    return selectedProperties.length > 0
      ? properties.filter(p => selectedProperties.includes(p.id))
      : filteredProperties;
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    const propertiesToExport = getPropertiesToExport();

    if (propertiesToExport.length === 0) {
      toast({
        title: 'Nenhum imóvel para exportar',
        description: 'Selecione imóveis ou ajuste os filtros',
        variant: 'destructive',
      });
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV(propertiesToExport);
        break;
      case 'xlsx':
        exportToXLSX(propertiesToExport);
        break;
      case 'json':
        exportToJSON(propertiesToExport);
        break;
    }

    toast({
      title: 'Exportação concluída!',
      description: `${propertiesToExport.length} imóveis exportados em ${format.toUpperCase()}`,
    });
  };

  const handleShareSingle = (property: any) => {
    setPropertyToShare(property);
    setShareDialogOpen(true);
  };

  const handleShareMultiple = () => {
    const propertiesToShare = getPropertiesToExport();

    if (propertiesToShare.length === 0) {
      toast({
        title: 'Nenhum imóvel para compartilhar',
        description: 'Selecione imóveis ou ajuste os filtros',
        variant: 'destructive',
      });
      return;
    }
    
    // Antiga lógica de compartilhamento único removida para permitir múltiplos
    // if (propertiesToShare.length === 1) {
    //   setPropertyToShare(propertiesToShare[0]);
    //   setShareDialogOpen(true);
    // } else {
    //   toast({
    //     title: 'Compartilhamento múltiplo',
    //     description: 'Selecione apenas um imóvel por vez para compartilhar',
    //     variant: 'destructive',
    //   });
    // }

    // Nova lógica para compartilhar múltiplos imóveis
    setPropertyToShare(propertiesToShare); // Define propertyToShare como o array de imóveis
    setShareDialogOpen(true);
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja deletar este imóvel permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Imóvel deletado!',
        description: 'O imóvel foi removido permanentemente.',
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (property: any) => {
    try {
      const { id, created_at, updated_at, code, property_images, ...propertyData } = property;
      
      // Gerar novo código sequencial para a cópia
      const { data: newCode, error: codeError } = await supabase.rpc('generate_property_code');
      if (codeError) throw codeError;
      
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          title: `${propertyData.title} (Cópia)`,
          code: newCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy images
      if (property.property_images && property.property_images.length > 0) {
        const imagesToCopy = property.property_images.map((img: any) => ({
          property_id: data.id,
          url: img.url,
          is_cover: img.is_cover,
          display_order: img.display_order,
          caption: img.caption,
        }));

        await supabase.from('property_images').insert(imagesToCopy);
      }

      toast({
        title: 'Imóvel duplicado!',
        description: 'Uma cópia do imóvel foi criada com sucesso.',
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: 'Erro ao duplicar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      const newArchivedState = !property?.archived;

      const { error } = await supabase
        .from('properties')
        .update({ archived: newArchivedState })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: newArchivedState ? 'Imóvel arquivado!' : 'Imóvel desarquivado!',
        description: newArchivedState 
          ? 'O imóvel foi movido para arquivados.' 
          : 'O imóvel está ativo novamente.',
      });

      fetchProperties();
    } catch (error: any) {
      toast({
        title: 'Erro ao arquivar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {systemSettings.logo_url ? (
                <img 
                  src={systemSettings.logo_url} 
                  alt={systemSettings.app_name} 
                  className="object-contain flex-shrink-0 md:hidden"
                  style={{
                    maxHeight: `${systemSettings.logo_size_mobile || 40}px`,
                    height: 'auto',
                    width: 'auto',
                    maxWidth: `${systemSettings.logo_size_mobile || 40}px`,
                  }}
                />
              ) : (
                <Building2 className="h-8 w-8 text-primary flex-shrink-0 md:hidden" />
              )}
              {systemSettings.logo_url ? (
                <img 
                  src={systemSettings.logo_url} 
                  alt={systemSettings.app_name} 
                  className="object-contain flex-shrink-0 hidden md:block lg:hidden"
                  style={{
                    maxHeight: `${systemSettings.logo_size_tablet || 48}px`,
                    height: 'auto',
                    width: 'auto',
                    maxWidth: `${systemSettings.logo_size_tablet || 48}px`,
                  }}
                />
              ) : (
                <Building2 className="h-10 w-10 text-primary flex-shrink-0 hidden md:block lg:hidden" />
              )}
              {systemSettings.logo_url ? (
                <img 
                  src={systemSettings.logo_url} 
                  alt={systemSettings.app_name} 
                  className="object-contain flex-shrink-0 hidden lg:block"
                  style={{
                    maxHeight: `${systemSettings.logo_size_desktop || 56}px`,
                    height: 'auto',
                    width: 'auto',
                    maxWidth: `${systemSettings.logo_size_desktop || 56}px`,
                  }}
                />
              ) : (
                <Building2 className="h-12 w-12 text-primary flex-shrink-0 hidden lg:block" />
              )}
              {systemSettings.show_version_in_header !== false && (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground"
                    style={{ fontFamily: systemSettings.font_family, fontSize: `${systemSettings.font_size}px` }}>
                  {systemSettings.app_name}
                </h1>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 md:gap-2">
              {/* Linha 1: Botões de ação quando há seleção - apenas em mobile */}
              {selectedProperties.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto sm:hidden">
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleShareMultiple}
                    className="w-20 h-9 flex items-center justify-center"
                    title="Compartilhar imóveis selecionados"
                    style={solidButtonStyle}
                  >
                    <Share2 className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => {
                      const propertiesToPrint = properties.filter(p => selectedProperties.includes(p.id));
                      printProperties({
                        properties: propertiesToPrint,
                        company: userCompany || undefined,
                        showFullAddress: true,
                        layout: 'compact',
                      });
                    }}
                    className="w-20 h-9 flex items-center justify-center"
                    title="Imprimir imóveis selecionados"
                    style={solidButtonStyle}
                  >
                    <Printer className="h-4 w-4 text-white" />
                  </Button>
                </div>
              )}
              
              {/* Linha 2: IA, Página Pública, Filtro, Exportar */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
                {isAdmin && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mr-2">
                    Administrador
                  </div>
                )}
                {/* Toggle para Agente de IA */}
                {userCompany && (
                  <Toggle
                    pressed={aiAgentEnabled}
                    onPressedChange={handleToggleAiAgent}
                    aria-label="Toggle Agente de IA"
                    className="ml-2 sm:ml-0 border-2"
                    style={{
                      borderColor: aiAgentEnabled ? secondaryColor : primaryColor,
                      backgroundColor: aiAgentEnabled ? secondaryColor : '#ffffff',
                      color: aiAgentEnabled ? '#ffffff' : primaryColor,
                    }}
                    title={aiAgentEnabled ? "Agente de IA Ativo" : "Agente de IA Inativo"}
                  >
                    <Sparkles className={`h-4 w-4 ${aiAgentEnabled ? 'text-white' : ''}`} style={!aiAgentEnabled ? { color: secondaryColor } : undefined} />
                  </Toggle>
                )}
                {/* Botão/Dropdown para Página Pública */}
                {isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" title="Página Pública" style={outlineButtonStyle}>
                        <Globe className="h-4 w-4" style={{ color: secondaryColor }} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {companies.map((company) => (
                        <DropdownMenuItem 
                          key={company.id} 
                          onClick={() => navigate(`/public-property/${company.slug}`)}
                        >
                          {company.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (userCompany && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigate(`/public-property/${userCompany.slug}`)}
                    title="Página Pública"
                    style={outlineButtonStyle}
                  >
                    <Globe className="h-4 w-4" style={{ color: secondaryColor }} />
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filtros"
                  style={outlineButtonStyle}
                >
                  <Filter className="h-4 w-4" style={{ color: secondaryColor }} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" title="Exportar" style={outlineButtonStyle}>
                      <FileSpreadsheet className="h-4 w-4" style={{ color: secondaryColor }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                      Exportar Excel (XLSX)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Exportar JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Linha 3: Novo Imóvel (sozinho em mobile) */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                {/* Botões de ação quando há seleção - apenas em desktop */}
                {selectedProperties.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleShareMultiple}
                      className="hidden sm:flex sm:min-w-[140px]"
                      title="Compartilhar imóveis selecionados"
                      style={solidButtonStyle}
                    >
                      <Share2 className="h-4 w-4 mr-2 text-white" />
                      Compartilhar ({selectedProperties.length})
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const propertiesToPrint = properties.filter(p => selectedProperties.includes(p.id));
                        printProperties({ properties: propertiesToPrint, showFullAddress: true });
                      }}
                      className="hidden sm:flex sm:min-w-[140px]"
                      title="Imprimir imóveis selecionados"
                      style={solidButtonStyle}
                    >
                      <Printer className="h-4 w-4 mr-2 text-white" />
                      Imprimir ({selectedProperties.length})
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={() => navigate('/property/new')}
                  size="sm"
                  className="w-full sm:w-auto"
                  style={solidButtonStyle}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Imóvel
                </Button>
              </div>
              
              {/* Linha 4: Solicitações, Configurações (se admin), Perfil, Sair */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowContactRequestsDialog(true)}
                  title="Solicitações de Contato"
                  style={outlineButtonStyle}
                >
                  <MessageSquareMore className="h-4 w-4" style={{ color: secondaryColor }} />
                </Button>
                
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/settings')}
                    title="Configurações"
                    style={outlineButtonStyle}
                  >
                    <Settings className="h-4 w-4" style={{ color: secondaryColor }} />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  title="Meu Perfil"
                  style={outlineButtonStyle}
                >
                  <User className="h-4 w-4" style={{ color: secondaryColor }} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className={!isAdmin ? "w-16 sm:w-auto" : ""}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" style={{ color: secondaryColor }} />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {systemSettings.show_dashboard_metrics && (
          <DashboardMetrics 
            showCharts={systemSettings.show_dashboard_charts} 
            averageResponseTime={isAdmin ? averageResponseTime : null}
          />
        )}
        
        {showFilters && (
          <Card className="mb-6 p-6">
            <PropertyFilters
              properties={properties}
              onFilterChange={setFilteredProperties}
            />
          </Card>
        )}

        {isLoadingProperties ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando imóveis...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0
                ? 'Comece adicionando seu primeiro imóvel'
                : 'Ajuste os filtros para ver mais resultados'}
            </p>
            {properties.length === 0 && (
              <Button onClick={() => navigate('/property/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Imóvel
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between mb-6 gap-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {filteredProperties.length} imóve{filteredProperties.length === 1 ? 'l' : 'is'} encontrado{filteredProperties.length === 1 ? '' : 's'}
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProperties(filteredProperties.map(p => p.id));
                      } else {
                        setSelectedProperties([]);
                      }
                    }}
                    className="h-4 w-4 cursor-pointer"
                    title="Selecionar todos"
                  />
                  <span className="text-sm text-muted-foreground">Selecionar todos</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                    style={viewMode === 'grid' ? solidButtonStyle : outlineButtonStyle}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" style={{ color: viewMode === 'grid' ? '#ffffff' : secondaryColor }} />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                    style={viewMode === 'list' ? solidButtonStyle : outlineButtonStyle}
                  >
                    <List className="h-4 w-4 mr-2" style={{ color: viewMode === 'list' ? '#ffffff' : secondaryColor }} />
                    Lista
                  </Button>
                </div>
                {selectedProperties.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProperties([])}
                  >
                    Limpar seleção
                  </Button>
                )}
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    selected={selectedProperties.includes(property.id)}
                    onSelect={handleSelectProperty}
                    onEdit={() => navigate(`/property/${property.id}`)}
                    onShare={() => handleShareSingle(property)}
                    onDelete={() => handleDelete(property.id)}
                    onArchive={() => handleArchive(property.id)}
                    onDuplicate={() => handleDuplicate(property)}
                    onToggleFeature={handleToggleFeature} // Passa a nova função
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((property) => {
                  const coverImage = property.property_images?.find((img: any) => img.is_cover)?.url || 
                                     property.property_images?.[0]?.url;
                  const price = property.purpose === 'locacao' ? property.rental_price : property.sale_price;
                  const purposeText = property.purpose === 'venda' ? 'Venda' : 
                                     property.purpose === 'locacao' ? 'Locação' : 'Venda/Locação';

                  return (
                    <Card
                      key={property.id}
                      className="hover:shadow-lg transition-shadow"
                      style={{ border: `3px solid ${selectedProperties.includes(property.id) ? secondaryColor : primaryColor}` }}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 w-full">
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property.id)}
                          onChange={() => handleSelectProperty(property.id)}
                          className="h-5 w-5 cursor-pointer flex-shrink-0 mt-1 sm:mt-0"
                          style={{ accentColor: primaryColor }}
                        />
                        
                        {coverImage && (
                          <img
                            src={coverImage}
                            alt={property.title}
                            className="h-20 w-28 object-cover rounded flex-shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <h3 className="font-semibold text-lg truncate" style={{ color: secondaryColor }}>
                            {property.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {property.code} • {property.city}, {property.state}
                          </p>
                          <p className="text-sm mt-1 text-muted-foreground flex flex-wrap gap-2">
                            {property.bedrooms} dorm • {property.bathrooms} banh • {property.parking_spaces} vagas
                            {property.total_area && ` • ${property.total_area}m²`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0 sm:ml-auto w-full sm:w-auto">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: primaryColor, color: '#fff' }}>
                            {purposeText}
                          </span>
                          {price && (
                            <span className="font-bold text-lg whitespace-nowrap" style={{ color: primaryColor }}>
                              R$ {price.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1 mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/property/${property.id}`)}
                            title="Editar"
                            style={{ borderColor: primaryColor, borderWidth: '2px', color: primaryColor, background: '#fff' }}
                          >
                            <Settings className="h-4 w-4" style={{ color: secondaryColor }} />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleShareSingle(property)}
                            title="Compartilhar"
                            style={{ borderColor: primaryColor, borderWidth: '2px', color: primaryColor, background: '#fff' }}
                          >
                            <Share2 className="h-4 w-4" style={{ color: secondaryColor }} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        properties={Array.isArray(propertyToShare) ? propertyToShare : (propertyToShare ? [propertyToShare] : [])}
      />
      <Dialog open={showContactRequestsDialog} onOpenChange={setShowContactRequestsDialog}>
        <DialogContent className="max-w-7xl w-[95vw]">
          <ContactRequestsManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}
