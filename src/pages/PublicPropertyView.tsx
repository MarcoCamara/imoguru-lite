import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MapPin, Bed, Bath, Car, Ruler, Home, Check, Mail, Phone, Facebook, Instagram, MessageCircle, ArrowLeft, Maximize2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrint } from '@/hooks/usePrint';
import PublicFooter from '@/components/PublicFooter';

export default function PublicPropertyView() {
  const { companySlug, propertyId } = useParams<{ companySlug: string; propertyId: string }>();
  const navigate = useNavigate();
  const { printProperties } = usePrint();
  const [property, setProperty] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

  const primaryColor = company?.primary_color || '#8b5cf6';
  const secondaryColor = company?.secondary_color || '#ec4899';

  useEffect(() => {
    if (!companySlug || !propertyId) return;
    fetchPropertyAndCompany();
  }, [companySlug, propertyId]);

  // Rotação automática da foto principal a cada 5 segundos
  useEffect(() => {
    if (!property?.property_images || property.property_images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentMainImage((prev) => 
        (prev + 1) % property.property_images.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [property]);

  const fetchPropertyAndCompany = async () => {
    try {
      setLoading(true);

      // Buscar empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', companySlug)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Buscar imóvel
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (url, is_cover, display_order)
        `)
        .eq('id', propertyId)
        .eq('company_id', companyData.id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do imóvel.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_contact_requests')
        .insert({
          company_id: company.id,
          property_id: propertyId,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
        });

      if (error) throw error;

      toast({
        title: '✅ Solicitação enviada!',
        description: 'Entraremos em contato em breve.',
      });

      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a solicitação.',
        variant: 'destructive',
      });
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentMainImage(index);
  };

  const handleImageFullscreen = (index: number) => {
    setFullscreenImageIndex(index);
    setShowFullscreenGallery(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!property || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Imóvel não encontrado.</p>
      </div>
    );
  }

  const coverImage = property.property_images?.find((img: any) => img.is_cover)?.url || property.property_images?.[0]?.url;
  const sortedImages = property.property_images?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          {company.logo_url && (
            <img 
              src={company.logo_url} 
              alt={company.name} 
              className="h-12 object-contain"
            />
          )}
          {!company.logo_url && (
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {company.name}
            </h1>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/public-property/${companySlug}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => printProperties({ properties: [property], company, showFullAddress: false })}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              size="sm"
              onClick={() => setShowContactForm(true)}
              style={{ backgroundColor: primaryColor }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Entrar em Contato
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Galeria de Fotos em Mosaico */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            {sortedImages.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 h-[400px] lg:h-[600px]">
                {/* Foto Principal (Esquerda - 3/4) */}
                <div className="lg:col-span-3 relative group overflow-hidden bg-gray-200 rounded-l-lg">
                  <img
                    src={sortedImages[currentMainImage]?.url}
                    alt="Foto Principal"
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  <button
                    onClick={() => handleImageFullscreen(currentMainImage)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ver em tela cheia"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                  {/* Indicador de foto atual */}
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentMainImage + 1} / {sortedImages.length}
                  </div>
              </div>

                {/* Miniaturas (Direita - 1/4) */}
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
                  {sortedImages.slice(0, 4).map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`relative flex-shrink-0 w-24 h-24 lg:w-full lg:h-[calc((100%-0.75rem)/4)] overflow-hidden rounded-lg cursor-pointer transition-all ${
                        currentMainImage === index 
                          ? 'ring-4 ring-offset-2 scale-95' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ 
                        ringColor: currentMainImage === index ? primaryColor : 'transparent' 
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {currentMainImage === index && (
                        <div 
                          className="absolute inset-0 bg-black/20 border-4"
                          style={{ borderColor: primaryColor }}
                        />
                      )}
                    </button>
                  ))}
                  {sortedImages.length > 4 && (
                    <button
                      onClick={() => handleImageFullscreen(0)}
                      className="relative flex-shrink-0 w-24 h-24 lg:w-full lg:h-[calc((100%-0.75rem)/4)] overflow-hidden rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-all"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <Maximize2 className="h-6 w-6 mb-1" />
                        <span className="text-sm font-semibold">+{sortedImages.length - 4}</span>
                  </div>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-400 bg-gray-100">
                <div className="text-center">
                  <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Sem fotos disponíveis</p>
                  </div>
                  </div>
                )}
          </CardContent>
        </Card>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Título e Preço */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-2" style={{ backgroundColor: secondaryColor }}>
                      {property.property_type}
                    </Badge>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                      {property.title}
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {property.neighborhood && `${property.neighborhood}, `}
                      {property.city} - {property.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">
                      {property.purpose === 'venda' ? 'Venda' : 
                       property.purpose === 'locacao' ? 'Locação' : 'Venda/Locação'}
                    </p>
                    {(property.sale_price || property.rental_price) && (
                      <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                        R$ {(
                          property.purpose === 'locacao' 
                            ? property.rental_price 
                            : property.sale_price
                        )?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                )}
              </div>
            </div>

            {property.description && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
                  </div>
                )}
                </CardContent>
              </Card>

            {/* Características Principais */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  Características
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.bedrooms !== null && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Bed className="h-6 w-6" style={{ color: secondaryColor }} />
              <div>
                        <p className="text-sm text-gray-500">Quartos</p>
                        <p className="text-lg font-semibold">{property.bedrooms}</p>
                </div>
              </div>
            )}
                  {property.bathrooms !== null && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Bath className="h-6 w-6" style={{ color: secondaryColor }} />
                      <div>
                        <p className="text-sm text-gray-500">Banheiros</p>
                        <p className="text-lg font-semibold">{property.bathrooms}</p>
                  </div>
          </div>
                  )}
                  {property.parking_spaces !== null && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Car className="h-6 w-6" style={{ color: secondaryColor }} />
                      <div>
                        <p className="text-sm text-gray-500">Vagas</p>
                        <p className="text-lg font-semibold">{property.parking_spaces}</p>
                </div>
                  </div>
                )}
                  {property.total_area && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Ruler className="h-6 w-6" style={{ color: secondaryColor }} />
                      <div>
                        <p className="text-sm text-gray-500">Área Total</p>
                        <p className="text-lg font-semibold">{property.total_area}m²</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Características Adicionais */}
                {property.property_features && Array.isArray(property.property_features) && property.property_features.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Características Adicionais</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {property.property_features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4" style={{ color: secondaryColor }} />
                          <span>{feature}</span>
                      </div>
                      ))}
                      </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Call to Action */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  Interessado?
                </h3>
                <p className="text-gray-600 mb-6">
                  Entre em contato conosco para mais informações sobre este imóvel.
                </p>
                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={() => setShowContactForm(true)}
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Solicitar Contato
                </Button>

                {company.whatsapp && (
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    size="lg"
                    onClick={() => window.open(`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
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

      {/* Galeria em Tela Cheia */}
      <Dialog open={showFullscreenGallery} onOpenChange={setShowFullscreenGallery}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0">
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <button
              onClick={() => setShowFullscreenGallery(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full z-50"
            >
              ✕
            </button>
            <button
              onClick={() => setFullscreenImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-50"
            >
              ←
            </button>
            <img
              src={sortedImages[fullscreenImageIndex]?.url}
              alt={`Foto ${fullscreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setFullscreenImageIndex((prev) => (prev + 1) % sortedImages.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-50"
            >
              →
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {fullscreenImageIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
