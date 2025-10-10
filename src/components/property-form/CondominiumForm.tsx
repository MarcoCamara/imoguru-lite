import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CONDO_AMENITIES } from '@/lib/propertyConstants';

interface CondominiumFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function CondominiumForm({ formData, setFormData }: CondominiumFormProps) {
  const toggleAmenity = (amenityName: string) => {
    const current = formData.condo_amenities || [];
    const updated = current.includes(amenityName)
      ? current.filter((a: string) => a !== amenityName)
      : [...current, amenityName];
    setFormData({ ...formData, condo_amenities: updated });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="condo_name">Nome do Condomínio</Label>
          <Input
            id="condo_name"
            value={formData.condo_name}
            onChange={(e) => setFormData({ ...formData, condo_name: e.target.value })}
            placeholder="Ex: Residencial Vista Verde"
          />
        </div>

        <div>
          <Label htmlFor="condo_units">Unidades</Label>
          <Input
            id="condo_units"
            type="number"
            min="0"
            value={formData.condo_units || ''}
            onChange={(e) => setFormData({ ...formData, condo_units: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Total de unidades"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="condo_floors">Andares</Label>
        <Input
          id="condo_floors"
          type="number"
          min="0"
          value={formData.condo_floors || ''}
          onChange={(e) => setFormData({ ...formData, condo_floors: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="Total de andares"
          className="md:w-1/3"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base">Comodidades do Condomínio</Label>
        <p className="text-sm text-muted-foreground">
          Selecione as comodidades disponíveis no condomínio.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONDO_AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={(formData.condo_amenities || []).includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <label
                htmlFor={`amenity-${amenity}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
