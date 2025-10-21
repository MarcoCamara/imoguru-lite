import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateNumericField } from '@/lib/validationUtils';
import { toast } from 'sonner';

interface AreaFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function AreaForm({ formData, setFormData }: AreaFormProps) {
  const handleAreaChange = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : null;
    if (numValue && !validateNumericField(numValue, 999999.99)) {
      toast.error('Área muito grande! Máximo: 999.999,99 m²');
      return;
    }
    setFormData({ ...formData, [field]: numValue });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="useful_area">Área Útil (m²)</Label>
          <Input
            id="useful_area"
            type="number"
            step="0.01"
            max="999999.99"
            value={formData.useful_area || ''}
            onChange={(e) => handleAreaChange('useful_area', e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="total_area">Área Total (m²)</Label>
          <Input
            id="total_area"
            type="number"
            step="0.01"
            max="999999.99"
            value={formData.total_area || ''}
            onChange={(e) => handleAreaChange('total_area', e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="construction_year">Ano de Construção</Label>
          <Input
            id="construction_year"
            type="number"
            min="1900"
            max={new Date().getFullYear() + 5}
            value={formData.construction_year || ''}
            onChange={(e) => setFormData({ ...formData, construction_year: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Ex: 2020"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="bedrooms">Quartos</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms || 0}
            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="suites">Suítes</Label>
          <Input
            id="suites"
            type="number"
            min="0"
            value={formData.suites || 0}
            onChange={(e) => setFormData({ ...formData, suites: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="bathrooms">Banheiros</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={formData.bathrooms || 0}
            onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="parking_spaces">Vagas de Garagem</Label>
          <Input
            id="parking_spaces"
            type="number"
            min="0"
            value={formData.parking_spaces || 0}
            onChange={(e) => setFormData({ ...formData, parking_spaces: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
