import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  MapPin,
  Home,
  Mail,
  MessageCircle,
  ArrowLeft,
  Maximize2,
  PlayCircle,
  Printer,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrint } from '@/hooks/usePrint';
import PublicFooter from '@/components/PublicFooter';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
}

export default function PublicPropertyView() {
  const { companySlug, propertyId } = useParams<{ companySlug: string; propertyId: string }>();
  const navigate = useNavigate();
  const { printProperties } = usePrint();

  const [property, setProperty] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [nearbyPoints, setNearbyPoints] = useState<any[]>([]);
  const [propertyVideos, setPropertyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormState>({ name: '', email: '', phone: '' });
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

  const primaryColor = company?.primary_color || '#8b5cf6';
  const secondaryColor = company?.secondary_color || '#ec4899';

  useEffect(() => {
    if (!companySlug || !propertyId) return;
    fetchPropertyAndCompany();
  }, [companySlug, propertyId]);

  useEffect(() => {
    if (!property?.property_images || property.property_images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMainImage((prev) => (prev + 1) % property.property_images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [property]);

  const fetchPropertyAndCompany = async () => {
    try {
      setLoading(true);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', companySlug)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (url, is_cover, display_order),
          property_videos (url, title)
        `)
        .eq('id', propertyId)
        .eq('company_id', companyData.id)
        .single();

      if (propertyError) throw propertyError;

      const { property_videos = [], ...restProperty } = (propertyData as any) || {};
      setProperty(restProperty);
      setPropertyVideos(property_videos);

      const { data: pointsData } = await supabase
        .from('nearby_points')
        .select('*')
        .eq('property_id', propertyId)
        .order('category');

      setNearbyPoints(pointsData || []);
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
      const { error } = await supabase.from('public_contact_requests').insert({
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

  const sortedImages = useMemo(() => {
    if (!property?.property_images) return [];
    return [...property.property_images].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [property]);

  const formatLabel = (value?: string | null) => {
    if (!value) return '';
    return value
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatBoolean = (value?: boolean | null) => {
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    return '—';
  };

  const statsItems = useMemo(
    () =>
      [
        {
          label: 'Dormitórios',
          raw: property?.bedrooms,
          value:
            property?.bedrooms !== null && property?.bedrooms !== undefined ? String(property.bedrooms) : '—',
        },
        {
          label: 'Suítes',
          raw: property?.suites,
          value: property?.suites !== null && property?.suites !== undefined ? String(property.suites) : '—',
        },
        {
          label: 'Banheiros',
          raw: property?.bathrooms,
          value: property?.bathrooms !== null && property?.bathrooms !== undefined ? String(property.bathrooms) : '—',
        },
        {
          label: 'Vagas Cobertas',
          raw: property?.covered_parking,
          value:
            property?.covered_parking !== null && property?.covered_parking !== undefined
              ? String(property.covered_parking)
              : '—',
        },
        {
          label: 'Vagas Descobertas',
          raw: property?.uncovered_parking,
          value:
            property?.uncovered_parking !== null && property?.uncovered_parking !== undefined
              ? String(property.uncovered_parking)
              : '—',
        },
        {
          label: 'Área Útil',
          raw: property?.useful_area,
          value:
            property?.useful_area !== null && property?.useful_area !== undefined
              ? `${property.useful_area} m²`
              : '—',
        },
        {
          label: 'Área Total',
          raw: property?.total_area,
          value:
            property?.total_area !== null && property?.total_area !== undefined
              ? `${property.total_area} m²`
              : '—',
        },
      ].filter((item) => item.raw !== null && item.raw !== undefined),
    [property]
  );

  const valueItems = useMemo(
    () =>
      [
        { label: 'Valor de Venda', value: formatCurrency(property?.sale_price) },
        { label: 'Valor de Locação', value: formatCurrency(property?.rental_price) },
        { label: 'Valor do IPTU', value: formatCurrency(property?.iptu_price ?? property?.iptu) },
        {
          label: 'Taxa de Condomínio',
          value: formatCurrency(property?.condo_price ?? property?.condominium_fee),
        },
        {
          label: 'Taxa de Administração',
          value: formatCurrency(property?.administration_fee),
        },
      ].filter((item) => item.value),
    [property]
  );

  const locationSummary = useMemo(() => {
    const parts = [
      property?.neighborhood,
      property?.city ? `${property.city}${property?.state ? ` - ${property.state}` : ''}` : '',
    ].filter(Boolean);
    return parts.join(' • ');
  }, [property]);

  const summaryItems = useMemo(
    () =>
      [
        {
          label: 'Finalidade',
          value:
            property?.purpose === 'venda'
              ? 'Venda'
              : property?.purpose === 'locacao'
              ? 'Locação'
              : property?.purpose === 'venda/locacao'
              ? 'Venda/Locação'
              : undefined,
        },
        { label: 'Status', value: formatLabel(property?.status) },
        { label: 'Localização', value: locationSummary },
        { label: 'Aceita Permuta', value: formatBoolean(property?.accepts_exchange) },
      ].filter((item) => item.value),
    [locationSummary, property]
  );

  const propertyFeatureTags = useMemo(() => {
    const features = Array.isArray(property?.property_features)
      ? property.property_features.filter(Boolean)
      : [];
    const condoAmenities = Array.isArray(property?.condo_amenities)
      ? property.condo_amenities.filter(Boolean)
      : [];

    if (!property?.condo_name) {
      return Array.from(new Set([...features, ...condoAmenities]));
    }

    return features;
  }, [property]);

  const condoFeatureTags = useMemo(() => {
    if (!property?.condo_name) return [];
    return Array.isArray(property?.condo_amenities)
      ? property.condo_amenities.filter(Boolean)
      : [];
  }, [property]);

  const nearbyAmenityTags = useMemo(
    () => (Array.isArray(property?.nearby_amenities) ? property.nearby_amenities.filter(Boolean) : []),
    [property]
  );

  const hasVideo = useMemo(() => {
    const hasYoutube = typeof property?.youtube_url === 'string' && property.youtube_url.trim().length > 0;
    return hasYoutube || propertyVideos.length > 0;
  }, [property, propertyVideos]);

  const primaryDisplayedPrice = useMemo(() => {
    if (property?.purpose === 'locacao' && property?.rental_price) {
      return formatCurrency(property.rental_price);
    }

    return formatCurrency(property?.sale_price) || formatCurrency(property?.rental_price);
  }, [property]);

  const primaryPriceLabel = useMemo(() => {
    if (property?.purpose === 'locacao' && property?.rental_price) {
      return 'Valor de Locação';
    }
    if (property?.sale_price) {
      return 'Valor de Venda';
    }
    if (property?.rental_price) {
      return 'Valor de Locação';
    }
    return null;
  }, [property]);

  const renderTagList = (tags: string[]) => (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs sm:text-sm text-gray-700"
        >
          {tag}
        </span>
      ))}
    </div>
  );

  const renderInfoList = (items: { label: string; value: string }[]) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm sm:text-base">
          <span className="text-gray-600">{item.label}</span>
          <span className="font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-10 sm:h-12 object-contain max-w-[160px]"
            />
          ) : (
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {company.name}
            </h1>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="px-2 sm:px-3"
              onClick={() => navigate(`/public-property/${companySlug}`)}
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2 sm:px-3"
              onClick={() => printProperties({ properties: [property], company, showFullAddress: false, layout: 'compact' })}
              title="Imprimir"
            >
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button
              size="sm"
              className="px-2 sm:px-3"
              onClick={() => setShowContactForm(true)}
              style={{ backgroundColor: primaryColor }}
              title="Contato"
            >
              <Mail className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Entrar em Contato</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4">
              <div
                className="relative w-full min-h-[220px] lg:h-[560px] rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage: sortedImages[currentMainImage]
                    ? `url(${sortedImages[currentMainImage].url})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                {sortedImages.length > 0 ? (
                  <img
                    src={sortedImages[currentMainImage]?.url}
                    alt={`Foto ${currentMainImage + 1}`}
                    className="relative z-10 w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Home className="h-12 w-12 mb-2" />
                    <p>Sem fotos disponíveis</p>
                  </div>
                )}
                {sortedImages.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageFullscreen(currentMainImage)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      title="Ver em tela cheia"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentMainImage + 1} / {sortedImages.length}
                    </div>
                  </>
                )}
              </div>

              {sortedImages.length > 1 && (
                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex gap-2 w-max overflow-x-auto pr-2">
                    {sortedImages.map((image: any, index: number) => (
                      <button
                        type="button"
                        key={image.url ?? index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`relative overflow-hidden rounded-lg border bg-white transition-all ${
                          currentMainImage === index ? 'ring-2 ring-offset-2' : 'hover:opacity-90'
                        }`}
                        style={{
                          borderColor: currentMainImage === index ? primaryColor : '#e5e7eb',
                          ringColor: primaryColor,
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Miniatura ${index + 1}`}
                          className="w-24 h-20 sm:w-28 sm:h-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <Badge className="w-fit text-xs sm:text-sm" style={{ backgroundColor: secondaryColor }}>
                    {property.property_type}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{locationSummary || 'Localização indisponível'}</span>
                  </div>
                </div>
                {primaryDisplayedPrice && (
                  <div className="text-left md:text-right">
                    {primaryPriceLabel && (
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{primaryPriceLabel}</p>
                    )}
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {primaryDisplayedPrice}
                    </p>
                  </div>
                )}
              </div>

                {statsItems.length > 0 && (
                  <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
                    {statsItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-4 py-2 min-w-[130px]">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

              )}

              {valueItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                    Valores e Custos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {valueItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                {summaryItems.length > 0 && (
                  <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
                    {summaryItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-200 bg-white px-4 py-2 min-w-[180px]">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}

            </CardContent>
          </Card>

          {property.description && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                  Descrição
                </h3>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>
          )}

          {(propertyFeatureTags.length > 0 || condoFeatureTags.length > 0) && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                  Estrutura e Facilidades
                </h3>
                {propertyFeatureTags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Características do Imóvel</h4>
                    {renderTagList(propertyFeatureTags)}
                  </div>
                )}
                {property.condo_name && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Condomínio</h4>
                    <p className="text-sm text-gray-600">{property.condo_name}</p>
                  </div>
                )}
                {condoFeatureTags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Amenidades do Condomínio</h4>
                    {renderTagList(condoFeatureTags)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(nearbyAmenityTags.length > 0 || nearbyPoints.length > 0) && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                  Comodidades Próximas
                </h3>
                {nearbyAmenityTags.length > 0 && renderTagList(nearbyAmenityTags)}
                {nearbyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Pontos de Interesse</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {nearbyPoints.map((point) => (
                        <li key={point.id} className="flex items-center justify-between gap-2 border-b border-gray-200 pb-1 last:border-b-0">
                          <span className="font-medium">{point.name}</span>
                          <span className="text-xs text-gray-500">{point.distance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {hasVideo && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                  Tour em Vídeo
                </h3>
                <div className="flex flex-col gap-3">
                  {property.youtube_url && property.youtube_url.trim().length > 0 && (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(property.youtube_url, '_blank')}
                    >
                      <PlayCircle className="h-4 w-4" /> Vídeo Principal
                    </Button>
                  )}
                  {propertyVideos.map((video, index) => (
                    <Button
                      key={`${video.url}-${index}`}
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(video.url, '_blank')}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {video.title || `Vídeo ${index + 1}`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="block lg:hidden">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: primaryColor }}>
                Interessado?
              </h3>
              <p className="text-sm text-gray-600">
                Entre em contato conosco para mais informações sobre este imóvel.
              </p>
              <Button
                className="w-full"
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
                  Conversar no WhatsApp
                </Button>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                {company.phone && <p>Telefone: {company.phone}</p>}
                {company.email && <p>Email: {company.email}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

      </main>

      {company.whatsapp && (
        <a
          href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg transition-transform hover:-translate-y-1 hover:bg-green-600"
          aria-label="Contato via WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
        </a>
      )}

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
