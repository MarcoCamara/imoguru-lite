import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Bed, Bath, Car, Maximize } from 'lucide-react';

export default function PublicPropertyView() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any>({
    app_name: 'ImoGuru',
    logo_url: null,
  });

  useEffect(() => {
    loadProperty();
    loadSystemSettings();
  }, [id]);

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'logo_url']);

      if (error) throw error;

      const settingsObj: any = { app_name: 'ImoGuru', logo_url: null };
      data?.forEach((item) => {
        settingsObj[item.setting_key] = item.setting_value;
      });

      setSystemSettings(settingsObj);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            url,
            is_cover,
            display_order,
            caption
          )
        `)
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Imóvel não encontrado</h2>
            <p className="text-muted-foreground">
              Este imóvel não está disponível ou foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coverImage = property.property_images?.find((img: any) => img.is_cover)
    || property.property_images?.[0];
  const otherImages = property.property_images?.filter((img: any) => !img.is_cover) || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {systemSettings.logo_url ? (
              <img 
                src={systemSettings.logo_url} 
                alt={systemSettings.app_name}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
            <h1 className="text-2xl font-bold text-foreground">
              {systemSettings.app_name}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cover Image */}
        {coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={coverImage.url}
              alt={property.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Property Info */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.city}, {property.state}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {property.purpose === 'venda' ? 'Venda' : 'Locação'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                {property.bedrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span>{property.bedrooms} {property.bedrooms === 1 ? 'Quarto' : 'Quartos'}</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span>{property.bathrooms} {property.bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</span>
                  </div>
                )}
                {property.parking_spaces > 0 && (
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <span>{property.parking_spaces} {property.parking_spaces === 1 ? 'Vaga' : 'Vagas'}</span>
                  </div>
                )}
                {property.total_area && (
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-muted-foreground" />
                    <span>{property.total_area} m²</span>
                  </div>
                )}
              </div>
            </div>

            {property.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Descrição</h2>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: property.description }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Other Images */}
            {otherImages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Fotos do Imóvel</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {otherImages.map((img: any) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.caption || 'Imagem do imóvel'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))
                }
                </div>
              </div>
            )}

            {property.property_features && property.property_features.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Características</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.property_features.map((feature: string) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))
                }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Valor</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(property.purpose === 'venda' ? property.sale_price : property.rental_price)}
                  </p>
                  {property.purpose === 'locacao' && (
                    <p className="text-sm text-muted-foreground mt-1">/mês</p>
                  )}
                </div>

                {property.code && (
                  <div className="text-center py-4 border-t">
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-mono font-semibold">{property.code}</p>
                  </div>
                )}

                <div className="text-center py-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Endereço</p>
                  <p className="text-sm">
                    {property.street}, {property.number}
                    {property.complement && `, ${property.complement}`}
                  </p>
                  <p className="text-sm">
                    {property.neighborhood}
                  </p>
                  <p className="text-sm">
                    {property.city} - {property.state}
                  </p>
                  {property.cep && (
                    <p className="text-sm mt-1">
                      CEP: {property.cep}
                    </p>
                  )}
                </div>

                {(property.iptu_price || property.condo_price) && (
                  <div className="py-4 border-t space-y-2">
                    {property.iptu_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IPTU</span>
                        <span>{formatPrice(property.iptu_price)}</span>
                      </div>
                    )}
                    {property.condo_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Condomínio</span>
                        <span>{formatPrice(property.condo_price)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {systemSettings.app_name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
