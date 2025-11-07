import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Filter, Printer, LogIn, Facebook, Instagram, MessageCircle, MapPin, Phone, Mail, Star, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import PropertyFilters from '@/components/PropertyFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrint } from '@/hooks/usePrint';
import PublicFooter from '@/components/PublicFooter';
import { useAuth } from '@/contexts/AuthContext';

interface Company {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  email: string | null;
  address: string | null;
  about_text: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  show_restricted_area_button: boolean;
}

interface Property {
  id: string;
  title: string;
  code: string;
  purpose: 'venda' | 'locacao' | 'venda/locacao';
  property_type: string;
  sale_price: number | null;
  rental_price: number | null;
  city: string;
  state: string;
  neighborhood: string;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spaces: number | null;
  covered_parking: number | null;
  uncovered_parking: number | null;
  total_area: number | null;
  useful_area: number | null;
  description?: string | null;
  property_images: { url: string; is_cover: boolean; display_order: number }[];
  is_featured: boolean;
}

export default function PublicCompanyPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { printProperties } = usePrint();
  const { isAuthenticated } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [featuredProperty, setFeaturedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Estado do formulário de contato
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const primaryColor = company?.primary_color || '#8b5cf6';
  const secondaryColor = company?.secondary_color || '#ec4899';
  const accentGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  const outlineButtonStyle = { borderColor: primaryColor, color: primaryColor };
  const solidButtonStyle = { background: accentGradient, border: 'none', color: '#ffffff' };
  const cardAccentStyle = { borderTop: `4px solid ${primaryColor}` };
  const sortedFeaturedImages = featuredProperty?.property_images
    ? [...featuredProperty.property_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : [];

  const openImageViewer = (index: number) => {
    setActiveImageIndex(index);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setActiveImageIndex(0);
  };

  const goToPreviousImage = () => {
    if (!sortedFeaturedImages.length) return;
    setActiveImageIndex((prev) =>
      prev === 0 ? sortedFeaturedImages.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    if (!sortedFeaturedImages.length) return;
    setActiveImageIndex((prev) =>
      prev === sortedFeaturedImages.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    if (!companySlug) {
      setError('Nenhum slug de empresa fornecido.');
      setLoading(false);
      return;
    }

    fetchCompanyAndProperties();
  }, [companySlug]);

  const fetchCompanyAndProperties = async () => {
    try {
      // Buscar dados da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', companySlug)
        .single();

      if (companyError) throw companyError;
      if (!companyData) {
        setError('Empresa não encontrada.');
        setLoading(false);
        return;
      }

      setCompany(companyData as Company);

      // Buscar imóveis da empresa (apenas publicados)
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id, title, code, purpose, property_type, sale_price, rental_price, description,
          city, state, neighborhood, bedrooms, bathrooms, parking_spaces, total_area,
          suites, covered_parking, uncovered_parking, useful_area,
          property_images (url, is_cover, display_order),
          is_featured
        `)
        .eq('company_id', companyData.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      const fetchedProperties: Property[] = propertiesData || [];
      
      // Separar imóvel destaque
      let featured = fetchedProperties.find(p => p.is_featured) || null;
      
      // Se não houver destaque explícito, escolher um aleatoriamente
      if (!featured && fetchedProperties.length > 0) {
        const randomIndex = Math.floor(Math.random() * fetchedProperties.length);
        featured = fetchedProperties[randomIndex];
      }
      
      setFeaturedProperty(featured);
      
      // Remover destaque da lista geral
      setAllProperties(fetchedProperties);
      setFilteredProperties(fetchedProperties);

    } catch (err: any) {
      console.error('Erro ao buscar dados:', err.message);
      setError('Erro ao carregar a página da empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/public-property/${companySlug}/property/${propertyId}`);
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handlePrintSelected = () => {
    if (selectedProperties.length === 0) {
      toast({
        title: 'Nenhum imóvel selecionado',
        description: 'Selecione ao menos um imóvel para imprimir.',
        variant: 'destructive',
      });
      return;
    }
    
    const propertiesToPrint = allProperties.filter(p => selectedProperties.includes(p.id));
    printProperties({
      properties: propertiesToPrint,
      company,
      showFullAddress: false,
      layout: propertiesToPrint.length === 1 ? 'compact' : undefined,
    });
  };

  const handleContactClick = (propertyId: string) => {
    setSelectedPropertyForContact(propertyId);
    setShowContactForm(true);
  };

  const handleSubmitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos do formulário.',
        variant: 'destructive',
      });
      return;
    }

    if (!company) return;

    try {
      // Se houver múltiplos imóveis selecionados, criar uma solicitação para cada
      const propertiesToContact = selectedProperties.length > 0 
        ? selectedProperties 
        : (selectedPropertyForContact ? [selectedPropertyForContact] : []);

      if (propertiesToContact.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum imóvel selecionado.',
          variant: 'destructive',
        });
        return;
      }

      // Inserir solicitação para cada imóvel
      const requests = propertiesToContact.map(propertyId => ({
        company_id: company.id,
        property_id: propertyId,
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
      }));

      const { error, data } = await supabase
        .from('public_contact_requests')
        .insert(requests)
        .select();

      if (error) {
        console.error('Erro detalhado ao inserir:', error);
        throw error;
      }
      
      console.log('Solicitações inseridas com sucesso:', data);

      toast({
        title: '✅ Solicitação enviada!',
        description: `Solicitação enviada para ${propertiesToContact.length} imóvel(is). Entraremos em contato em breve.`,
      });

      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '' });
      setSelectedPropertyForContact(null);
      setSelectedProperties([]); // Limpar seleções
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro</h1>
          <p className="text-gray-600">{error || 'Página não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header 
        className="bg-white shadow-md sticky top-0 z-50 w-full"
        style={{ borderBottom: `3px solid ${primaryColor}` }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 max-w-full">
          {/* Logo */}
          <div className="flex-shrink-0 min-w-0">
            {company.logo_url && (
              <img 
                src={company.logo_url} 
                alt={`${company.name} Logo`} 
                className="h-10 sm:h-12 md:h-16 object-contain max-w-[100px] sm:max-w-none flex-shrink-0" 
              />
            )}
            {!company.logo_url && (
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: primaryColor }}>
                {company.name}
              </h1>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => navigate('/dashboard')}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Página Principal</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => navigate('/dashboard')}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  title="Página Principal"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setShowFilters(!showFilters)}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
              style={{ borderColor: primaryColor, color: primaryColor }}
              title="Buscar Imóveis"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={handlePrintSelected}
              disabled={selectedProperties.length === 0}
              style={{ borderColor: primaryColor, color: primaryColor }}
              title={`Imprimir (${selectedProperties.length})`}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={handlePrintSelected}
              disabled={selectedProperties.length === 0}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Imprimir ({selectedProperties.length})</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => {
                if (selectedProperties.length === 0) {
                  toast({
                    title: 'Nenhum imóvel selecionado',
                    description: 'Selecione ao menos um imóvel para solicitar contato.',
                    variant: 'destructive',
                  });
                  return;
                }
                setShowContactForm(true);
              }}
              disabled={selectedProperties.length === 0}
              style={{ borderColor: primaryColor, color: primaryColor }}
              title={`Contatar (${selectedProperties.length})`}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => {
                if (selectedProperties.length === 0) {
                  toast({
                    title: 'Nenhum imóvel selecionado',
                    description: 'Selecione ao menos um imóvel para solicitar contato.',
                    variant: 'destructive',
                  });
                  return;
                }
                setShowContactForm(true);
              }}
              disabled={selectedProperties.length === 0}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Mail className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Contatar ({selectedProperties.length})</span>
            </Button>

            {company.show_restricted_area_button && (
              <Button
                size="sm"
                className="hidden sm:flex text-white hover:opacity-90"
                onClick={() => navigate('/auth')}
                style={solidButtonStyle}
              >
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden md:inline">Área Restrita</span>
                <span className="md:hidden sm:inline">Área</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-full">
        {/* Seção de Destaque - MELHORADA */}
        {featuredProperty && (
          <>
            <Card className="mb-6 sm:mb-8 overflow-hidden border-2" style={{ borderColor: primaryColor }}>
              <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Carrossel de Fotos - 2/3 do espaço */}
                <div
                  className="relative w-full lg:col-span-2 overflow-hidden flex items-center justify-center bg-black/5"
                  style={{ maxHeight: '520px', minHeight: '220px' }}
                >
                  {sortedFeaturedImages.length > 0 ? (
                    <Carousel
                      plugins={[Autoplay({ delay: 4000 })]}
                      className="w-full h-full"
                    >
                      <CarouselContent className="h-full">
                        {sortedFeaturedImages.map((image, index) => (
                          <CarouselItem key={index} className="h-full basis-full pl-0">
                            <button
                              type="button"
                              className="group relative w-full h-full overflow-hidden focus:outline-none flex items-center justify-center bg-black/5"
                              onClick={() => openImageViewer(index)}
                              aria-label="Ampliar imagem do imóvel em destaque"
                            >
                              <img
                                src={image.url}
                                alt={`${featuredProperty.title} - Foto ${index + 1}`}
                                className="max-w-full max-h-[520px] object-contain transition-transform duration-300 group-hover:scale-105"
                                style={{ objectPosition: 'center' }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-white text-xs sm:text-sm font-medium shadow-lg transition-opacity duration-300 group-hover:bg-black/70">
                                <ZoomIn className="h-4 w-4" />
                                <span className="hidden sm:inline">Ampliar</span>
                              </div>
                            </button>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2 sm:left-4" />
                      <CarouselNext className="right-2 sm:right-4" />
                    </Carousel>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      Sem fotos
                    </div>
                  )}
                  
                  {/* Badge de Destaque */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
                    <Badge 
                      className="flex items-center gap-1 text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 fill-current" />
                      <span className="hidden sm:inline">Imóvel em Destaque</span>
                      <span className="sm:hidden">Destaque</span>
                    </Badge>
                  </div>
                </div>

                {/* Informações do Imóvel - 1/3 do espaço, com descrição */}
                <div className="p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <Badge className="w-fit mb-2 text-xs sm:text-sm" style={{ backgroundColor: secondaryColor }}>
                      {featuredProperty.property_type}
                    </Badge>
                    
                    <h2 
                      className="text-lg sm:text-xl font-bold mb-2 line-clamp-2 break-words"
                      style={{ color: primaryColor }}
                    >
                      {featuredProperty.title}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 flex items-center gap-1 flex-wrap">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="break-words">{featuredProperty.city} - {featuredProperty.state}</span>
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-4 text-[10px] sm:text-xs">
                      <div>
                        <span className="text-gray-500">Dormitórios</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.bedrooms !== null && featuredProperty.bedrooms !== undefined
                            ? featuredProperty.bedrooms
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Suítes</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.suites !== null && featuredProperty.suites !== undefined
                            ? featuredProperty.suites
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Banheiros</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.bathrooms !== null && featuredProperty.bathrooms !== undefined
                            ? featuredProperty.bathrooms
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vagas Cobertas</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.covered_parking !== null && featuredProperty.covered_parking !== undefined
                            ? featuredProperty.covered_parking
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vagas Descobertas</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.uncovered_parking !== null && featuredProperty.uncovered_parking !== undefined
                            ? featuredProperty.uncovered_parking
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Área Útil</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.useful_area !== null && featuredProperty.useful_area !== undefined
                            ? `${featuredProperty.useful_area}m²`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Área Total</span>
                        <p className="font-semibold text-sm sm:text-base">
                          {featuredProperty.total_area !== null && featuredProperty.total_area !== undefined
                            ? `${featuredProperty.total_area}m²`
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Descrição resumida */}
                    {featuredProperty.description && (
                      <div className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                        <p className="line-clamp-4 sm:line-clamp-6 whitespace-pre-wrap break-words">
                          {featuredProperty.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    {(featuredProperty.sale_price || featuredProperty.rental_price) && (
                      <div className="mb-3 sm:mb-4">
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {featuredProperty.purpose === 'venda' ? 'Venda' : 
                           featuredProperty.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold break-words" style={{ color: primaryColor }}>
                          R$ {(
                            featuredProperty.purpose === 'locacao' 
                              ? featuredProperty.rental_price 
                              : featuredProperty.sale_price
                          )?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        className="text-xs sm:text-sm px-3 sm:px-4"
                        size="sm"
                        onClick={() => handlePropertyClick(featuredProperty.id)}
                        style={solidButtonStyle}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        className="text-xs sm:text-sm px-3 sm:px-4"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          printProperties({
                            properties: [featuredProperty],
                            company,
                            showFullAddress: false,
                            layout: 'compact',
                          })
                        }
                        style={outlineButtonStyle}
                      >
                        <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Imprimir</span>
                        <span className="sm:hidden">Imprimir</span>
                      </Button>
                      <Button
                        className="text-xs sm:text-sm px-3 sm:px-4"
                        size="sm"
                        onClick={() => handleContactClick(featuredProperty.id)}
                        style={solidButtonStyle}
                      >
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Contato</span>
                        <span className="sm:hidden">Contato</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            <Dialog
              open={imageViewerOpen}
              onOpenChange={(open) => {
                if (open) {
                  setImageViewerOpen(true);
                } else {
                  closeImageViewer();
                }
              }}
            >
              <DialogContent className="max-w-[95vw] w-full sm:w-auto border-none bg-transparent p-0 shadow-none max-h-none overflow-visible">
                <div className="relative w-full h-[85vh] max-h-[85vh] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  {sortedFeaturedImages.length > 0 ? (
                    <>
                      <img
                        src={sortedFeaturedImages[activeImageIndex]?.url}
                        alt={`${featuredProperty.title} - Foto ampliada ${activeImageIndex + 1}`}
                        className="max-h-[80vh] max-w-full object-contain"
                      />
                      {sortedFeaturedImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPreviousImage}
                            className="absolute left-3 sm:left-6 bg-black/60 hover:bg-black/80 text-white"
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextImage}
                            className="absolute right-3 sm:right-6 bg-black/60 hover:bg-black/80 text-white"
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-white/80 px-3 py-1 rounded-full bg-black/60">
                            {activeImageIndex + 1} / {sortedFeaturedImages.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-white text-sm sm:text-base">Sem fotos</div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Filtros - Entre Destaque e Lista */}
        {showFilters && (
          <div className="mb-8">
            <PropertyFilters
              properties={allProperties}
              onFilterChange={setFilteredProperties}
              showCompanyFilter={false}
            />
          </div>
        )}

        {/* Lista de Imóveis */}
        <div className="mb-6 sm:mb-8">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
            style={{ color: primaryColor }}
          >
            {featuredProperty ? 'Todos os Imóveis' : 'Nossos Imóveis'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredProperties.map((property) => {
              const coverImage = property.property_images.find(img => img.is_cover)?.url || 
                                 property.property_images[0]?.url;
              const price = property.purpose === 'locacao' ? property.rental_price : property.sale_price;

              return (
                <Card 
                  key={property.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  style={cardAccentStyle}
                >
                  <div className="relative h-40 sm:h-48 bg-gray-200 flex-shrink-0 overflow-hidden">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={property.title} 
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        onClick={() => handlePropertyClick(property.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                        Sem foto
                      </div>
                    )}
                    
                    {/* Checkbox para seleção */}
                    <div 
                      className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-white rounded p-1 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handleSelectProperty(property.id)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </div>
                    
                    <Badge 
                      className="absolute top-1 sm:top-2 right-1 sm:right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1"
                      style={{ background: accentGradient, color: '#ffffff' }}
                    >
                      {property.purpose === 'venda' ? 'Venda' : 
                       property.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                    </Badge>
                  </div>

                  <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">{property.code}</p>
                    <h3 
                       className="font-bold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 cursor-pointer hover:opacity-90 break-words"
                       onClick={() => handlePropertyClick(property.id)}
                       style={{ color: primaryColor }}
                    >
                      {property.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 flex items-center gap-1 flex-wrap">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="break-words">{property.city} - {property.state}</span>
                    </p>

                    <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 flex-wrap gap-1">
                      {property.bedrooms !== null && <span className="whitespace-nowrap">{property.bedrooms} 🛏️</span>}
                      {property.bathrooms !== null && <span className="whitespace-nowrap">{property.bathrooms} 🚿</span>}
                      {(property.covered_parking || 0) + (property.uncovered_parking || 0) > 0 && (
                        <span className="whitespace-nowrap">
                          {(property.covered_parking || 0) + (property.uncovered_parking || 0)} 🚗
                        </span>
                      )}
                      {property.covered_parking ? (
                        <span className="whitespace-nowrap">C:{property.covered_parking}</span>
                      ) : null}
                      {property.uncovered_parking ? (
                        <span className="whitespace-nowrap">D:{property.uncovered_parking}</span>
                      ) : null}
                      {property.total_area && <span className="whitespace-nowrap">{property.total_area}m²</span>}
                    </div>

                    {price && (
                      <p className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 break-words" style={{ color: primaryColor }}>
                        R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-1.5 sm:gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs sm:text-sm px-2 sm:px-3"
                        onClick={() =>
                          printProperties({
                            properties: [property],
                            company,
                            showFullAddress: false,
                            layout: 'compact',
                          })
                        }
                        style={outlineButtonStyle}
                      >
                        <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Imprimir</span>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs sm:text-sm px-2 sm:px-3"
                        onClick={() => handleContactClick(property.id)}
                        style={solidButtonStyle}
                      >
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Contato</span>
                        <span className="sm:hidden">Contato</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProperties.length === 0 && (
            <Card className="p-12">
              <p className="text-center text-gray-500">
                Nenhum imóvel encontrado com os filtros aplicados.
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* Rodapé */}
      <PublicFooter
        companyName={company.name}
        companyPhone={company.phone || undefined}
        companyAddress={company.address || (company.street ? `${company.street}${company.number ? `, ${company.number}` : ''}${company.neighborhood ? ` - ${company.neighborhood}` : ''}` : undefined)}
        companyCity={company.city || undefined}
        companyState={company.state || undefined}
        companyEmail={company.email || undefined}
        companyFacebook={company.facebook || undefined}
        companyInstagram={company.instagram || undefined}
        companyWhatsapp={company.whatsapp || undefined}
        companyLogo={company.logo_url || undefined}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Botão Flutuante do WhatsApp */}
      {company.whatsapp && (
        <a
          href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 animate-bounce"
          title="Fale conosco no WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      {/* Diálogo de Contato */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md max-w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Solicitar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 overflow-y-auto">
            <div>
              <Label htmlFor="contact-name" className="text-xs sm:text-sm md:text-base mb-1 block">Nome Completo *</Label>
              <Input
                id="contact-name"
                placeholder="Seu nome"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className="text-sm sm:text-base w-full"
              />
            </div>
            <div>
              <Label htmlFor="contact-email" className="text-xs sm:text-sm md:text-base mb-1 block">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="seu@email.com"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className="text-sm sm:text-base w-full"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone" className="text-xs sm:text-sm md:text-base mb-1 block">Telefone com DDD *</Label>
              <Input
                id="contact-phone"
                placeholder="(11) 99999-9999"
                value={contactForm.phone}
                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                className="text-sm sm:text-base w-full"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 sm:pt-6 mt-4 sm:mt-0 border-t sm:border-t-0">
            <Button 
              variant="outline" 
              onClick={() => setShowContactForm(false)}
              className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2"
              size="sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitContact} 
              style={solidButtonStyle}
              className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2"
              size="sm"
            >
              Enviar Solicitação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

