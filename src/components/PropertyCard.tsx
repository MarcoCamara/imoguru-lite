import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Bed, Bath, Car, Ruler, MapPin, Edit, Share2 } from 'lucide-react';

interface PropertyCardProps {
  property: any;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function PropertyCard({
  property,
  selected,
  onSelect,
  onEdit,
  onShare,
}: PropertyCardProps) {
  const coverImage = property.property_images?.find((img: any) => img.is_cover)?.url ||
    property.property_images?.[0]?.url;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const purposeLabels = {
    venda: 'Venda',
    locacao: 'Locação',
    venda_locacao: 'Venda/Locação',
  };

  const statusLabels = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    vendido: 'Vendido',
    alugado: 'Alugado',
  };

  const price = property.purpose === 'locacao' ? property.rental_price : property.sale_price;

  return (
    <Card className={`overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative">
        {coverImage ? (
          <img
            src={coverImage}
            alt={property.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(property.id)}
            className="bg-background"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge variant="secondary">{purposeLabels[property.purpose]}</Badge>
          <Badge variant={property.status === 'disponivel' ? 'default' : 'outline'}>
            {statusLabels[property.status]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
        
        {property.code && (
          <p className="text-sm text-muted-foreground mb-2">Código: {property.code}</p>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">
            {property.city || 'Cidade não informada'}, {property.neighborhood || 'Bairro'}
          </span>
        </div>

        {price && (
          <p className="text-2xl font-bold text-primary mb-3">
            {formatPrice(price)}
            {property.purpose === 'locacao' && <span className="text-sm font-normal">/mês</span>}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.parking_spaces > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{property.parking_spaces}</span>
            </div>
          )}
          {property.total_area && (
            <div className="flex items-center gap-1 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span>{property.total_area}m²</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
