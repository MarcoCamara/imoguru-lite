import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateNumericField } from '@/lib/validationUtils';
import { toast } from 'sonner';
import { useState } from 'react';

interface AreaFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function AreaForm({ formData, setFormData }: AreaFormProps) {
  const [usefulAreaError, setUsefulAreaError] = useState<string | null>(null);
  const [totalAreaError, setTotalAreaError] = useState<string | null>(null);
  const [builtAreaError, setBuiltAreaError] = useState<string | null>(null);
  const [constructionYearError, setConstructionYearError] = useState<string | null>(null);
  const [bedroomsError, setBedroomsError] = useState<string | null>(null);
  const [suitesError, setSuitesError] = useState<string | null>(null);
  const [bathroomsError, setBathroomsError] = useState<string | null>(null);
  const [parkingSpacesError, setParkingSpacesError] = useState<string | null>(null);
  const [coveredParkingError, setCoveredParkingError] = useState<string | null>(null);
  const [uncoveredParkingError, setUncoveredParkingError] = useState<string | null>(null);

  const handleAreaChange = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : null;
    const maxValue = 999999.99;

    // Limpar erros existentes
    if (field === 'useful_area') setUsefulAreaError(null);
    if (field === 'total_area') setTotalAreaError(null);
    if (field === 'built_area') setBuiltAreaError(null);

    if (numValue !== null && !validateNumericField(numValue, maxValue)) {
      const errorMessage = `Área muito grande! Máximo: ${maxValue.toLocaleString('pt-BR')} m²`;
      if (field === 'useful_area') setUsefulAreaError(errorMessage);
      if (field === 'total_area') setTotalAreaError(errorMessage);
      if (field === 'built_area') setBuiltAreaError(errorMessage);
      return;
    }
    setFormData({ ...formData, [field]: numValue });
  };

  const handleIntInputChange = (
    field: string,
    value: string,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    min: number = 0,
    max: number = Infinity,
  ) => {
    setError(null);

    if (value === '') {
      setFormData((prevData: any) => ({ ...prevData, [field]: null }));
      return;
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      setError('Somente números são permitidos.');
      setFormData((prevData: any) => ({ ...prevData, [field]: null }));
      return;
    }

    if (numValue < min) {
      setError(`Mínimo de ${min}.`);
      setFormData((prevData: any) => ({ ...prevData, [field]: numValue }));
      return;
    }

    if (numValue > max) {
      setError(`Máximo de ${max}.`);
      setFormData((prevData: any) => ({ ...prevData, [field]: numValue }));
      return;
    }

    setFormData((prevData: any) => ({ ...prevData, [field]: numValue }));
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
            className={usefulAreaError ? 'border-red-500' : ''}
          />
          {usefulAreaError && <p className="text-red-500 text-sm mt-1">{usefulAreaError}</p>}
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
            className={totalAreaError ? 'border-red-500' : ''}
          />
          {totalAreaError && <p className="text-red-500 text-sm mt-1">{totalAreaError}</p>}
        </div>
        <div>
          <Label htmlFor="built_area">Área Construída (m²)</Label>
          <Input
            id="built_area"
            type="number"
            step="0.01"
            max="999999.99"
            value={formData.built_area || ''}
            onChange={(e) => handleAreaChange('built_area', e.target.value)}
            placeholder="0,00"
            className={builtAreaError ? 'border-red-500' : ''}
          />
          {builtAreaError && <p className="text-red-500 text-sm mt-1">{builtAreaError}</p>}
        </div>

        <div>
          <Label htmlFor="construction_year">Ano de Construção</Label>
          <Input
            id="construction_year"
            type="number"
            min="1900"
            max={new Date().getFullYear() + 5}
            value={formData.construction_year || ''}
            onChange={(e) => handleIntInputChange('construction_year', e.target.value, setConstructionYearError, 1900, new Date().getFullYear() + 5)}
            placeholder="Ex: 2020"
            className={constructionYearError ? 'border-red-500' : ''}
          />
          {constructionYearError && <p className="text-red-500 text-sm mt-1">{constructionYearError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="bedrooms">Quartos</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms || ''}
            onChange={(e) => handleIntInputChange('bedrooms', e.target.value, setBedroomsError)}
            className={bedroomsError ? 'border-red-500' : ''}
          />
          {bedroomsError && <p className="text-red-500 text-sm mt-1">{bedroomsError}</p>}
        </div>

        <div>
          <Label htmlFor="suites">Suítes</Label>
          <Input
            id="suites"
            type="number"
            min="0"
            value={formData.suites || ''}
            onChange={(e) => handleIntInputChange('suites', e.target.value, setSuitesError)}
            className={suitesError ? 'border-red-500' : ''}
          />
          {suitesError && <p className="text-red-500 text-sm mt-1">{suitesError}</p>}
        </div>

        <div>
          <Label htmlFor="bathrooms">Banheiros</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={formData.bathrooms || ''}
            onChange={(e) => handleIntInputChange('bathrooms', e.target.value, setBathroomsError)}
            className={bathroomsError ? 'border-red-500' : ''}
          />
          {bathroomsError && <p className="text-red-500 text-sm mt-1">{bathroomsError}</p>}
        </div>

        <div>
          <Label htmlFor="parking_spaces">Vagas de Garagem</Label>
          <Input
            id="parking_spaces"
            type="number"
            min="0"
            value={formData.parking_spaces || ''}
            onChange={(e) => handleIntInputChange('parking_spaces', e.target.value, setParkingSpacesError)}
            className={parkingSpacesError ? 'border-red-500' : ''}
          />
          {parkingSpacesError && <p className="text-red-500 text-sm mt-1">{parkingSpacesError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="covered_parking">Vagas Cobertas</Label>
          <Input
            id="covered_parking"
            type="number"
            min="0"
            value={formData.covered_parking || ''}
            onChange={(e) => handleIntInputChange('covered_parking', e.target.value, setCoveredParkingError)}
            className={coveredParkingError ? 'border-red-500' : ''}
          />
          {coveredParkingError && <p className="text-red-500 text-sm mt-1">{coveredParkingError}</p>}
        </div>

        <div>
          <Label htmlFor="uncovered_parking">Vagas Descobertas</Label>
          <Input
            id="uncovered_parking"
            type="number"
            min="0"
            value={formData.uncovered_parking || ''}
            onChange={(e) => handleIntInputChange('uncovered_parking', e.target.value, setUncoveredParkingError)}
            className={uncoveredParkingError ? 'border-red-500' : ''}
          />
          {uncoveredParkingError && <p className="text-red-500 text-sm mt-1">{uncoveredParkingError}</p>}
        </div>
      </div>
    </div>
  );
}
