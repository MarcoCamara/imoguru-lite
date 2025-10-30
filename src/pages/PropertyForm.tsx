import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import PartnershipForm from '@/components/property-form/PartnershipForm';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [pendingVideos, setPendingVideos] = useState<File[]>([]);
  const [pendingCondoImages, setPendingCondoImages] = useState<File[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<Array<{ file: File; type: string }>>([]);
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
    capture_type: 'propria',
    captured_by: '',
    available_for_partnership: false,
    partnerships_notes: '',
    youtube_url: '',
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

  const uploadPendingMedia = async (propertyId: string) => {
    try {
      // Upload property images
      for (const file of pendingImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_images').insert({
          property_id: propertyId,
          url: publicUrl,
          display_order: 0,
        });

        if (dbError) throw dbError;
      }

      // Upload property videos
      for (const file of pendingVideos) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-videos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-videos')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_videos').insert({
          property_id: propertyId,
          url: publicUrl,
          title: file.name,
        });

        if (dbError) throw dbError;
      }

      // Upload condominium images
      for (const file of pendingCondoImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/condominium/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_images').insert({
          property_id: propertyId,
          url: publicUrl,
          caption: 'condominium',
          display_order: 0,
        });

        if (dbError) throw dbError;
      }

      // Upload property documents
      for (const doc of pendingDocuments) {
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${propertyId}/${doc.type}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(fileName, doc.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('property_documents').insert({
          property_id: propertyId,
          document_type: doc.type,
          file_url: publicUrl,
          file_name: doc.file.name,
        });

        if (dbError) throw dbError;
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload de mídia',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
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

      let savedPropertyId = id;

      if (id) {
        const { error } = await supabase
          .from('properties')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        // Upload pending media if any
        if (pendingImages.length > 0 || pendingVideos.length > 0 || pendingCondoImages.length > 0 || pendingDocuments.length > 0) {
          await uploadPendingMedia(id);
        }

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

        const { data: newProperty, error } = await supabase
          .from('properties')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        savedPropertyId = newProperty.id;

        // Upload pending media if any
        if (pendingImages.length > 0 || pendingVideos.length > 0 || pendingCondoImages.length > 0 || pendingDocuments.length > 0) {
          await uploadPendingMedia(savedPropertyId);
        }

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
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1 sm:gap-2 flex-wrap overflow-x-auto">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Básico</TabsTrigger>
              <TabsTrigger value="location" className="text-xs sm:text-sm">Localização</TabsTrigger>
              <TabsTrigger value="features" className="text-xs sm:text-sm">Características</TabsTrigger>
              <TabsTrigger value="values" className="text-xs sm:text-sm">Valores</TabsTrigger>
              <TabsTrigger value="condominium" className="text-xs sm:text-sm">Condomínio</TabsTrigger>
              <TabsTrigger value="nearby" className="text-xs sm:text-sm">Proximidades</TabsTrigger>
              <TabsTrigger value="media" className="text-xs sm:text-sm">Mídia</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">Documentos</TabsTrigger>
              <TabsTrigger value="owner" className="text-xs sm:text-sm">Proprietário</TabsTrigger>
              <TabsTrigger value="partnership" className="text-xs sm:text-sm">Parceria</TabsTrigger>
              <TabsTrigger value="statistics" className="text-xs sm:text-sm">Estatísticas</TabsTrigger>
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
              <CondominiumForm 
                formData={formData} 
                setFormData={setFormData} 
                propertyId={id}
                pendingCondoImages={pendingCondoImages}
                setPendingCondoImages={setPendingCondoImages}
              />
            </TabsContent>

            <TabsContent value="nearby">
              <NearbyPointsForm propertyId={id} />
              <NearbyAmenitiesCheckbox formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="media">
              <MediaForm 
                propertyId={id}
                pendingImages={pendingImages}
                setPendingImages={setPendingImages}
                pendingVideos={pendingVideos}
                setPendingVideos={setPendingVideos}
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsForm 
                propertyId={id}
                pendingDocuments={pendingDocuments}
                setPendingDocuments={setPendingDocuments}
              />
            </TabsContent>

            <TabsContent value="owner">
              <OwnerFormExpanded formData={formData} setFormData={setFormData} propertyId={id} />
            </TabsContent>

            <TabsContent value="partnership">
              <PartnershipForm formData={formData} setFormData={setFormData} />
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

          <div className="mt-6 flex flex-wrap justify-center sm:justify-end gap-2">
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
