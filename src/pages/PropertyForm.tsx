import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicInfoForm from '@/components/property-form/BasicInfoForm';
import LocationForm from '@/components/property-form/LocationForm';
import FeaturesForm from '@/components/property-form/FeaturesForm';
import ValuesForm from '@/components/property-form/ValuesForm';
import CondominiumForm from '@/components/property-form/CondominiumForm';
import NearbyPointsForm from '@/components/property-form/NearbyPointsForm';
import MediaForm from '@/components/property-form/MediaForm';
import DocumentsForm from '@/components/property-form/DocumentsForm';
import OwnerFormExpanded from '@/components/property-form/OwnerFormExpanded';
import PropertyFeaturesCheckbox from '@/components/property-form/PropertyFeaturesCheckbox';
import NearbyAmenitiesCheckbox from '@/components/property-form/NearbyAmenitiesCheckbox';
import StatisticsTab from '@/components/property-form/StatisticsTab';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [formData, setFormData] = useState<any>({
    title: '',
    code: '',
    purpose: 'venda',
    property_type: 'apartamento',
    condition: 'novo',
    status: 'disponivel',
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parking_spaces: 0,
    total_area: null,
    useful_area: null,
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: null,
    longitude: null,
    sale_price: null,
    rental_price: null,
    iptu_price: null,
    condo_price: null,
    accepts_exchange: false,
    description: '',
    condo_name: '',
    condo_units: null,
    condo_floors: null,
    condo_amenities: [],
    construction_year: null,
    published: false,
    published_on_portal: false,
    owner_name: '',
    owner_cpf_cnpj: '',
    owner_email: '',
    owner_phone: '',
    exact_street: '',
    exact_number: '',
    exact_complement: '',
    exact_neighborhood: '',
    exact_cep: '',
  });

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imóvel',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.property_type || !formData.purpose) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos o título, tipo e finalidade do imóvel.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        user_id: user?.id,
      };

      if (id) {
        const { error } = await supabase
          .from('properties')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Imóvel atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        // Gerar código automaticamente para novos imóveis
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_property_code');

        if (codeError) throw codeError;

        dataToSave.code = codeData;

        const { error } = await supabase
          .from('properties')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Imóvel cadastrado!',
          description: `O imóvel foi adicionado com código ${codeData}.`,
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-2">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="values">Valores</TabsTrigger>
              <TabsTrigger value="condominium">Condomínio</TabsTrigger>
              <TabsTrigger value="nearby">Proximidades</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="owner">Proprietário</TabsTrigger>
              <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicInfoForm formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="location">
              <LocationForm formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="features">
              <FeaturesForm formData={formData} setFormData={setFormData} />
              <PropertyFeaturesCheckbox formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="values">
              <ValuesForm formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="condominium">
              <CondominiumForm formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="nearby">
              <NearbyPointsForm propertyId={id} />
              <NearbyAmenitiesCheckbox formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="media">
              <MediaForm propertyId={id} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsForm propertyId={id} />
            </TabsContent>

            <TabsContent value="owner">
              <OwnerFormExpanded formData={formData} setFormData={setFormData} propertyId={id} />
            </TabsContent>

            <TabsContent value="statistics">
              <StatisticsTab propertyId={id} />
              {id && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/property/${id}/authorizations`)}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerenciar Autorizações
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {id ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
