import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Bed, Bath, Car, Ruler, MapPin, Edit, Share2, Trash2, Archive, Copy, Star } from 'lucide-react';

interface PropertyCardProps {
  property: any;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onDuplicate?: () => void;
  onToggleFeature: (id: string, isFeatured: boolean) => void;
  primaryColor: string;
  secondaryColor: string;
}

export default function PropertyCard({
  property,
  selected,
  onSelect,
  onEdit,
  onShare,
  onDelete,
  onArchive,
  onDuplicate,
  onToggleFeature,
  primaryColor,
  secondaryColor,
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
  } as Record<string, string>;

  const statusLabels = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    vendido: 'Vendido',
    alugado: 'Alugado',
  } as Record<string, string>;

  const price = property.purpose === 'locacao' ? property.rental_price : property.sale_price;
  const accentGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  const buildSolidButtonStyle = () => ({
    backgroundColor: primaryColor,
    color: '#ffffff',
    border: `2px solid ${primaryColor}`,
  });
  const outlineButtonStyle = {
    borderColor: primaryColor,
    borderWidth: '2px',
    color: primaryColor,
    background: '#ffffff',
  };

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg"
      style={{
        border: `3px solid ${selected ? secondaryColor : primaryColor}`,
        boxShadow: selected ? `0 0 0 4px ${secondaryColor}20` : `0 2px 10px -6px ${primaryColor}40`,
      }}
    >
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
            style={{ borderColor: primaryColor }}
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2 items-center">
          <Badge style={{ backgroundColor: primaryColor, color: '#fff' }}>
            {purposeLabels[property.purpose] || 'Uso' }
          </Badge>
          <Badge
            style={{
              backgroundColor: property.status === 'disponivel' ? secondaryColor : '#fff',
              color: property.status === 'disponivel' ? '#fff' : secondaryColor,
              border: property.status === 'disponivel' ? 'none' : `1px solid ${primaryColor}`,
            }}
          >
            {statusLabels[property.status] || 'Status'}
          </Badge>
          {property.archived && (
            <Badge variant="destructive">Arquivado</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFeature(property.id, !property.is_featured)}
            title={property.is_featured ? "Remover de Destaques" : "Marcar como Destaque"}
            className={property.is_featured ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
          >
            <Star className={`h-4 w-4 fill-current ${property.is_featured ? 'text-yellow-500' : 'text-gray-400'}`} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1" style={{ color: secondaryColor, fontWeight: 700 }}>
          {property.title}
        </h3>
        
        {property.code && (
          <p className="text-sm text-muted-foreground mb-2">Código: {property.code}</p>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" style={{ color: secondaryColor }} />
          <span className="line-clamp-1">
            {property.city || 'Cidade não informada'}, {property.neighborhood || 'Bairro'}
          </span>
        </div>

        {price && (
          <p className="text-2xl font-bold mb-3" style={{ color: primaryColor }}>
            {formatPrice(price)}
            {property.purpose === 'locacao' && <span className="text-sm font-normal">/mês</span>}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4 text-muted-foreground">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Bed className="h-4 w-4" style={{ color: primaryColor }} />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Bath className="h-4 w-4" style={{ color: primaryColor }} />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.parking_spaces > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Car className="h-4 w-4" style={{ color: primaryColor }} />
              <span>{property.parking_spaces}</span>
            </div>
          )}
          {property.total_area && (
            <div className="flex items-center gap-1 text-sm">
              <Ruler className="h-4 w-4" style={{ color: primaryColor }} />
              <span>{property.total_area}m²</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={onEdit} className="flex-1" style={buildSolidButtonStyle()}>
            <Edit className="h-4 w-4 mr-2" style={{ color: '#ffffff' }} />
            Editar
          </Button>
          {onDuplicate && (
            <Button size="sm" onClick={onDuplicate} title="Duplicar" style={outlineButtonStyle}>
              <Copy className="h-4 w-4" style={{ color: secondaryColor }} />
            </Button>
          )}
          <Button size="sm" onClick={onArchive} title="Arquivar" style={outlineButtonStyle}>
            <Archive className="h-4 w-4" style={{ color: secondaryColor }} />
          </Button>
          <Button size="sm" onClick={onDelete} title="Deletar" style={outlineButtonStyle}>
            <Trash2 className="h-4 w-4" style={{ color: secondaryColor }} />
          </Button>
          <Button size="sm" onClick={onShare} title="Compartilhar" style={outlineButtonStyle}>
            <Share2 className="h-4 w-4" style={{ color: secondaryColor }} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
