import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ValuesFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function ValuesForm({ formData, setFormData }: ValuesFormProps) {
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount;
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
    </div>
  );
}
