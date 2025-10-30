import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FeaturesFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function FeaturesForm({ formData, setFormData }: FeaturesFormProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
          <Label htmlFor="covered_parking">Vagas Cobertas</Label>
          <Input
            id="covered_parking"
            type="number"
            min="0"
            value={formData.covered_parking || 0}
            onChange={(e) => setFormData({ ...formData, covered_parking: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="uncovered_parking">Vagas Descobertas</Label>
          <Input
            id="uncovered_parking"
            type="number"
            min="0"
            value={formData.uncovered_parking || 0}
            onChange={(e) => setFormData({ ...formData, uncovered_parking: parseInt(e.target.value) || 0 })}
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
