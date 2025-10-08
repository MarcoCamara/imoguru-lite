import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface OwnerFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function OwnerForm({ formData, setFormData }: OwnerFormProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="owner_name">Nome do Proprietário</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <Label htmlFor="owner_cpf_cnpj">CPF/CNPJ</Label>
          <Input
            id="owner_cpf_cnpj"
            value={formData.owner_cpf_cnpj}
            onChange={(e) => setFormData({ ...formData, owner_cpf_cnpj: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="owner_email">E-mail</Label>
          <Input
            id="owner_email"
            type="email"
            value={formData.owner_email}
            onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <Label htmlFor="owner_phone">Telefone</Label>
          <Input
            id="owner_phone"
            value={formData.owner_phone}
            onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
    </div>
  );
}
