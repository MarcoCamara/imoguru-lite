import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FeaturesFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function FeaturesForm({ formData, setFormData }: FeaturesFormProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="bedrooms">Quartos</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="suites">Suítes</Label>
          <Input
            id="suites"
            type="number"
            min="0"
            value={formData.suites}
            onChange={(e) => setFormData({ ...formData, suites: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="bathrooms">Banheiros</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="parking_spaces">Vagas</Label>
          <Input
            id="parking_spaces"
            type="number"
            min="0"
            value={formData.parking_spaces}
            onChange={(e) => setFormData({ ...formData, parking_spaces: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="total_area">Área Total (m²)</Label>
          <Input
            id="total_area"
            type="number"
            step="0.01"
            value={formData.total_area || ''}
            onChange={(e) => setFormData({ ...formData, total_area: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Ex: 120.50"
          />
        </div>

        <div>
          <Label htmlFor="useful_area">Área Útil (m²)</Label>
          <Input
            id="useful_area"
            type="number"
            step="0.01"
            value={formData.useful_area || ''}
            onChange={(e) => setFormData({ ...formData, useful_area: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Ex: 95.00"
          />
        </div>
      </div>
    </div>
  );
}
