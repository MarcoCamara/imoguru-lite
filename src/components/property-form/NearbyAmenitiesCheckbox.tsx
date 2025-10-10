import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NEARBY_AMENITIES } from '@/lib/propertyConstants';

interface NearbyAmenitiesCheckboxProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function NearbyAmenitiesCheckbox({ formData, setFormData }: NearbyAmenitiesCheckboxProps) {
  const toggleAmenity = (amenity: string) => {
    const currentAmenities = formData.nearby_amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a: string) => a !== amenity)
      : [...currentAmenities, amenity];
    
    setFormData({ ...formData, nearby_amenities: newAmenities });
  };

  return (
    <div className="space-y-4 pt-4">
      <Label className="text-base">Pontos de Referência Próximos</Label>
      <p className="text-sm text-muted-foreground">
        Selecione os pontos de interesse próximos ao imóvel.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NEARBY_AMENITIES.map((amenity) => (
          <div key={amenity} className="flex items-center space-x-2">
            <Checkbox
              id={`nearby-${amenity}`}
              checked={(formData.nearby_amenities || []).includes(amenity)}
              onCheckedChange={() => toggleAmenity(amenity)}
            />
            <label
              htmlFor={`nearby-${amenity}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {amenity}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
