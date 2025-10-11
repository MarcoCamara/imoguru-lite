import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Plus, LogOut, Filter, Share2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyCard from '@/components/PropertyCard';
import { exportToCSV } from '@/lib/exportUtils';

export default function Dashboard() {
  const { user, signOut, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user, isAdmin]);

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
            is_cover
          )
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
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

  const handleExportCSV = () => {
    const propertiesToExport = selectedProperties.length > 0
      ? properties.filter(p => selectedProperties.includes(p.id))
      : filteredProperties;

    if (propertiesToExport.length === 0) {
      toast({
        title: 'Nenhum imóvel para exportar',
        description: 'Selecione imóveis ou ajuste os filtros',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV(propertiesToExport);
    toast({
      title: 'Exportação concluída!',
      description: `${propertiesToExport.length} imóveis exportados`,
    });
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleShare = (propertyIds: string[]) => {
    navigate('/share', { state: { propertyIds } });
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja deletar este imóvel? Esta ação não pode ser desfeita.')) {
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
        description: 'O imóvel foi removido com sucesso.',
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
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Imóvel Mate</h1>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Meus Imóveis'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              {selectedProperties.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(selectedProperties)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar ({selectedProperties.length})
                </Button>
              )}
              <Button
                onClick={() => navigate('/property/new')}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Imóvel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {filteredProperties.length} imóve{filteredProperties.length === 1 ? 'l' : 'is'} encontrado{filteredProperties.length === 1 ? '' : 's'}
              </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  selected={selectedProperties.includes(property.id)}
                  onSelect={handleSelectProperty}
                  onEdit={() => navigate(`/property/${property.id}`)}
                  onShare={() => handleShare([property.id])}
                  onDelete={() => handleDelete(property.id)}
                  onArchive={() => handleArchive(property.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
