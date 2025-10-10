import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface ValuesFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function ValuesForm({ formData, setFormData }: ValuesFormProps) {
  const otherCosts = formData.other_costs || [];

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

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            value={formData.sale_price || ''}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="rental_price">Preço de Locação (R$/mês)</Label>
          <Input
            id="rental_price"
            type="number"
            step="0.01"
            value={formData.rental_price || ''}
            onChange={(e) => setFormData({ ...formData, rental_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0,00"
          />
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
            onChange={(e) => setFormData({ ...formData, iptu_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="condo_price">Condomínio (R$/mês)</Label>
          <Input
            id="condo_price"
            type="number"
            step="0.01"
            value={formData.condo_price || ''}
            onChange={(e) => setFormData({ ...formData, condo_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0,00"
          />
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
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor={`cost_desc_${index}`}>Descrição</Label>
              <Input
                id={`cost_desc_${index}`}
                value={cost.description}
                onChange={(e) => updateOtherCost(index, 'description', e.target.value)}
                placeholder="Ex: Taxa de limpeza"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
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
              <div className="flex items-end">
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
