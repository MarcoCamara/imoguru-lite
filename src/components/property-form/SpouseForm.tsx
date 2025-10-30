import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SpouseFormProps {
  spouseData: any;
  setSpouseData: (data: any) => void;
}

export default function SpouseForm({ spouseData, setSpouseData }: SpouseFormProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <h4 className="font-semibold">Dados do Cônjuge</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="spouse_name">Nome Completo</Label>
          <Input
            id="spouse_name"
            value={spouseData.name || ''}
            onChange={(e) => setSpouseData({ ...spouseData, name: e.target.value })}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <Label htmlFor="spouse_rg">RG</Label>
          <Input
            id="spouse_rg"
            value={spouseData.rg || ''}
            onChange={(e) => setSpouseData({ ...spouseData, rg: e.target.value })}
            placeholder="00.000.000-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="spouse_cpf">CPF</Label>
          <Input
            id="spouse_cpf"
            value={spouseData.cpf || ''}
            onChange={(e) => setSpouseData({ ...spouseData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <Label htmlFor="spouse_email">E-mail</Label>
          <Input
            id="spouse_email"
            type="email"
            value={spouseData.email || ''}
            onChange={(e) => setSpouseData({ ...spouseData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="spouse_phone">Telefone</Label>
          <Input
            id="spouse_phone"
            value={spouseData.phone || ''}
            onChange={(e) => setSpouseData({ ...spouseData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <Label htmlFor="spouse_whatsapp">WhatsApp</Label>
          <Input
            id="spouse_whatsapp"
            value={spouseData.whatsapp || ''}
            onChange={(e) => setSpouseData({ ...spouseData, whatsapp: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="spouse_street">Endereço</Label>
          <Input
            id="spouse_street"
            value={spouseData.street || ''}
            onChange={(e) => setSpouseData({ ...spouseData, street: e.target.value })}
            placeholder="Rua/Avenida"
          />
        </div>

        <div>
          <Label htmlFor="spouse_number">Número</Label>
          <Input
            id="spouse_number"
            value={spouseData.number || ''}
            onChange={(e) => setSpouseData({ ...spouseData, number: e.target.value })}
            placeholder="Nº"
          />
        </div>

        <div>
          <Label htmlFor="spouse_cep">CEP</Label>
          <Input
            id="spouse_cep"
            value={spouseData.cep || ''}
            onChange={(e) => setSpouseData({ ...spouseData, cep: e.target.value })}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="spouse_complement">Complemento</Label>
          <Input
            id="spouse_complement"
            value={spouseData.complement || ''}
            onChange={(e) => setSpouseData({ ...spouseData, complement: e.target.value })}
            placeholder="Apto, Bloco"
          />
        </div>

        <div>
          <Label htmlFor="spouse_neighborhood">Bairro</Label>
          <Input
            id="spouse_neighborhood"
            value={spouseData.neighborhood || ''}
            onChange={(e) => setSpouseData({ ...spouseData, neighborhood: e.target.value })}
            placeholder="Bairro"
          />
        </div>

        <div>
          <Label htmlFor="spouse_city">Cidade</Label>
          <Input
            id="spouse_city"
            value={spouseData.city || ''}
            onChange={(e) => setSpouseData({ ...spouseData, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="spouse_state">Estado</Label>
        <Input
          id="spouse_state"
          value={spouseData.state || ''}
          onChange={(e) => setSpouseData({ ...spouseData, state: e.target.value })}
          placeholder="UF"
          maxLength={2}
          className="w-full md:w-1/4"
        />
      </div>
    </div>
  );
}
