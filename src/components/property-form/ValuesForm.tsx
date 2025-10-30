import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { validateNumericField } from '@/lib/validationUtils';
import { toast } from 'sonner';
import { useState } from 'react';

interface ValuesFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function ValuesForm({ formData, setFormData }: ValuesFormProps) {
  const otherCosts = formData.other_costs || [];
  const [salePriceError, setSalePriceError] = useState<string | null>(null);
  const [rentalPriceError, setRentalPriceError] = useState<string | null>(null);
  const [iptuPriceError, setIptuPriceError] = useState<string | null>(null);
  const [condoPriceError, setCondoPriceError] = useState<string | null>(null);

  const addOtherCost = () => {
    setFormData({
      ...formData,
      other_costs: [...otherCosts, { description: '', value: 0 }]
    });
  };

  const removeOtherCost = (index: number) => {
    setFormData({
      ...formData,
      other_costs: otherCosts.filter((_: any, i: number) => i !== index)
    });
  };

  const updateOtherCost = (index: number, field: string, value: any) => {
    const updated = [...otherCosts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, other_costs: updated });
  };

  const handlePriceChange = (
    field: string,
    value: string,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    maxValue: number = 999999999.99,
  ) => {
    setError(null);
    const numValue = value ? parseFloat(value) : null;

    if (numValue !== null && !validateNumericField(numValue, maxValue)) {
      setError(`Valor muito alto! Máximo: R$ ${maxValue.toLocaleString('pt-BR')}`);
      setFormData((prevData: any) => ({ ...prevData, [field]: numValue }));
      return;
    }
    setFormData((prevData: any) => ({ ...prevData, [field]: numValue }));
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            max="999999999.99"
            value={formData.sale_price || ''}
            onChange={(e) => handlePriceChange('sale_price', e.target.value, setSalePriceError)}
            placeholder="0,00"
            className={salePriceError ? 'border-red-500' : ''}
          />
          {salePriceError && <p className="text-red-500 text-sm mt-1">{salePriceError}</p>}
        </div>

        <div>
          <Label htmlFor="rental_price">Preço de Locação (R$/mês)</Label>
          <Input
            id="rental_price"
            type="number"
            step="0.01"
            max="999999999.99"
            value={formData.rental_price || ''}
            onChange={(e) => handlePriceChange('rental_price', e.target.value, setRentalPriceError)}
            placeholder="0,00"
            className={rentalPriceError ? 'border-red-500' : ''}
          />
          {rentalPriceError && <p className="text-red-500 text-sm mt-1">{rentalPriceError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="iptu_price">IPTU (R$/ano)</Label>
          <Input
            id="iptu_price"
            type="number"
            step="0.01"
            value={formData.iptu_price || ''}
            onChange={(e) => handlePriceChange('iptu_price', e.target.value, setIptuPriceError)}
            placeholder="0,00"
            className={iptuPriceError ? 'border-red-500' : ''}
          />
          {iptuPriceError && <p className="text-red-500 text-sm mt-1">{iptuPriceError}</p>}
        </div>

        <div>
          <Label htmlFor="condo_price">Condomínio (R$/mês)</Label>
          <Input
            id="condo_price"
            type="number"
            step="0.01"
            value={formData.condo_price || ''}
            onChange={(e) => handlePriceChange('condo_price', e.target.value, setCondoPriceError)}
            placeholder="0,00"
            className={condoPriceError ? 'border-red-500' : ''}
          />
          {condoPriceError && <p className="text-red-500 text-sm mt-1">{condoPriceError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Outros Custos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addOtherCost}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {otherCosts.map((cost: any, index: number) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor={`cost_desc_${index}`}>Descrição</Label>
              <Input
                id={`cost_desc_${index}`}
                value={cost.description}
                onChange={(e) => updateOtherCost(index, 'description', e.target.value)}
                placeholder="Ex: Taxa de limpeza"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end w-full">
              <div className="flex-1 w-full">
                <Label htmlFor={`cost_value_${index}`}>Valor (R$)</Label>
                <Input
                  id={`cost_value_${index}`}
                  type="number"
                  step="0.01"
                  value={cost.value}
                  onChange={(e) => updateOtherCost(index, 'value', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
              <div className="flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeOtherCost(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
