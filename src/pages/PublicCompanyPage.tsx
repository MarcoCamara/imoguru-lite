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
import { Filter, Printer, LogIn, Facebook, Instagram, MessageCircle, MapPin, Phone, Mail, Star } from 'lucide-react';
import PropertyFilters from '@/components/PropertyFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrint } from '@/hooks/usePrint';
import PublicFooter from '@/components/PublicFooter';

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
  parking_spaces: number | null;
  total_area: number | null;
  description?: string | null;
  property_images: { url: string; is_cover: boolean; display_order: number }[];
  is_featured: boolean;
}

export default function PublicCompanyPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { printProperties } = usePrint();
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
  
  // Estado do formulário de contato
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const primaryColor = company?.primary_color || '#8b5cf6';
  const secondaryColor = company?.secondary_color || '#ec4899';

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
      const regularProperties = fetchedProperties.filter(p => p.id !== featured?.id);
      setAllProperties(regularProperties);
      setFilteredProperties(regularProperties);

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
    printProperties({ properties: propertiesToPrint, company, showFullAddress: false });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white shadow-md sticky top-0 z-50"
        style={{ borderBottom: `3px solid ${primaryColor}` }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          {company.logo_url && (
            <img 
              src={company.logo_url} 
              alt={`${company.name} Logo`} 
              className="h-12 md:h-16 object-contain flex-shrink-0" 
            />
          )}
          {!company.logo_url && (
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: primaryColor }}>
              {company.name}
            </h1>
          )}

          {/* Botões */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Buscar Imóveis</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSelected}
              disabled={selectedProperties.length === 0}
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Imprimir ({selectedProperties.length})</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
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
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contatar ({selectedProperties.length})</span>
            </Button>

            {company.show_restricted_area_button && (
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Área Restrita</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Seção de Destaque - MELHORADA */}
        {featuredProperty && (
          <Card className="mb-8 overflow-hidden border-2" style={{ borderColor: primaryColor }}>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Carrossel de Fotos - 2/3 do espaço */}
                <div className="relative h-[300px] sm:h-[400px] lg:h-[600px] lg:col-span-2 bg-gray-200">
                  {featuredProperty.property_images.length > 0 ? (
                    <Carousel
                      plugins={[Autoplay({ delay: 4000 })]}
                      className="w-full h-full"
                    >
                      <CarouselContent className="h-full">
                        {featuredProperty.property_images
                          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                          .map((image, index) => (
                            <CarouselItem key={index} className="h-full">
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <img
                                  src={image.url}
                                  alt={`${featuredProperty.title} - Foto ${index + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                  style={{ width: 'auto', height: 'auto' }}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2 sm:left-4" />
                      <CarouselNext className="right-2 sm:right-4" />
                    </Carousel>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem fotos
                    </div>
                  )}
                  
                  {/* Badge de Destaque */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                    <Badge 
                      className="flex items-center gap-1 text-base px-4 py-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Star className="h-5 w-5 fill-current" />
                      Imóvel em Destaque
                    </Badge>
                  </div>
                </div>

                {/* Informações do Imóvel - 1/3 do espaço, com descrição */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <Badge className="w-fit mb-2" style={{ backgroundColor: secondaryColor }}>
                      {featuredProperty.property_type}
                    </Badge>
                    
                    <h2 
                      className="text-xl font-bold mb-2 line-clamp-2"
                      style={{ color: primaryColor }}
                    >
                      {featuredProperty.title}
                    </h2>
                    
                    <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {featuredProperty.city} - {featuredProperty.state}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      {featuredProperty.bedrooms !== null && (
                        <div>
                          <span className="text-gray-500">Quartos</span>
                          <p className="font-semibold text-base">{featuredProperty.bedrooms}</p>
                        </div>
                      )}
                      {featuredProperty.bathrooms !== null && (
                        <div>
                          <span className="text-gray-500">Banheiros</span>
                          <p className="font-semibold text-base">{featuredProperty.bathrooms}</p>
                        </div>
                      )}
                      {featuredProperty.parking_spaces !== null && (
                        <div>
                          <span className="text-gray-500">Vagas</span>
                          <p className="font-semibold text-base">{featuredProperty.parking_spaces}</p>
                        </div>
                      )}
                      {featuredProperty.total_area && (
                        <div>
                          <span className="text-gray-500">Área</span>
                          <p className="font-semibold text-base">{featuredProperty.total_area}m²</p>
                        </div>
                      )}
                    </div>

                    {/* Descrição resumida */}
                    {featuredProperty.description && (
                      <div className="text-sm text-gray-700 mb-4">
                        <p className="line-clamp-6 whitespace-pre-wrap">
                          {featuredProperty.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    {(featuredProperty.sale_price || featuredProperty.rental_price) && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">
                          {featuredProperty.purpose === 'venda' ? 'Venda' : 
                           featuredProperty.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                        </p>
                        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                          R$ {(
                            featuredProperty.purpose === 'locacao' 
                              ? featuredProperty.rental_price 
                              : featuredProperty.sale_price
                          )?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handlePropertyClick(featuredProperty.id)}
                      style={{ backgroundColor: primaryColor }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
        <div className="mb-8">
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ color: primaryColor }}
          >
            {featuredProperty ? 'Outros Imóveis' : 'Nossos Imóveis'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProperties.map((property) => {
              const coverImage = property.property_images.find(img => img.is_cover)?.url || 
                                 property.property_images[0]?.url;
              const price = property.purpose === 'locacao' ? property.rental_price : property.sale_price;

              return (
                <Card 
                  key={property.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 sm:h-48 bg-gray-200">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={property.title} 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handlePropertyClick(property.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Sem foto
                      </div>
                    )}
                    
                    {/* Checkbox para seleção */}
                    <div 
                      className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-white rounded p-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handleSelectProperty(property.id)}
                        className="h-4 w-4"
                      />
                    </div>
                    
                    <Badge 
                      className="absolute top-1 sm:top-2 right-1 sm:right-2 text-xs"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {property.purpose === 'venda' ? 'Venda' : 
                       property.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{property.code}</p>
                    <h3 
                      className="font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      {property.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.city} - {property.state}
                    </p>

                    <div className="flex justify-between text-xs text-gray-500 mb-3">
                      {property.bedrooms !== null && <span>{property.bedrooms} 🛏️</span>}
                      {property.bathrooms !== null && <span>{property.bathrooms} 🚿</span>}
                      {property.parking_spaces !== null && <span>{property.parking_spaces} 🚗</span>}
                      {property.total_area && <span>{property.total_area}m²</span>}
                    </div>

                    {price && (
                      <p className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                        R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleContactClick(property.id)}
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contato
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Nome Completo *</Label>
              <Input
                id="contact-name"
                placeholder="Seu nome"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="seu@email.com"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Telefone com DDD *</Label>
              <Input
                id="contact-phone"
                placeholder="(11) 99999-9999"
                value={contactForm.phone}
                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowContactForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitContact} style={{ backgroundColor: primaryColor }}>
                Enviar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
