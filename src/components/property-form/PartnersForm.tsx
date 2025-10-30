import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface PartnersFormProps {
  partners: any[];
  setPartners: (partners: any[]) => void;
}

export default function PartnersForm({ partners, setPartners }: PartnersFormProps) {
  const addPartner = () => {
    setPartners([...partners, {
      name: '',
      rg: '',
      cpf_cnpj: '',
      email: '',
      phone: '',
      whatsapp: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    }]);
  };

  const removePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };

  const updatePartner = (index: number, field: string, value: any) => {
    const updated = [...partners];
    updated[index] = { ...updated[index], [field]: value };
    setPartners(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Sócios / Outros Proprietários</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPartner}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Sócio
        </Button>
      </div>

      {partners.map((partner, index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Sócio {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePartner(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`partner_name_${index}`}>Nome Completo</Label>
              <Input
                id={`partner_name_${index}`}
                value={partner.name}
                onChange={(e) => updatePartner(index, 'name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor={`partner_rg_${index}`}>RG</Label>
              <Input
                id={`partner_rg_${index}`}
                value={partner.rg}
                onChange={(e) => updatePartner(index, 'rg', e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`partner_cpf_${index}`}>CPF/CNPJ</Label>
              <Input
                id={`partner_cpf_${index}`}
                value={partner.cpf_cnpj}
                onChange={(e) => updatePartner(index, 'cpf_cnpj', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor={`partner_email_${index}`}>E-mail</Label>
              <Input
                id={`partner_email_${index}`}
                type="email"
                value={partner.email}
                onChange={(e) => updatePartner(index, 'email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`partner_phone_${index}`}>Telefone</Label>
              <Input
                id={`partner_phone_${index}`}
                value={partner.phone}
                onChange={(e) => updatePartner(index, 'phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor={`partner_whatsapp_${index}`}>WhatsApp</Label>
              <Input
                id={`partner_whatsapp_${index}`}
                value={partner.whatsapp}
                onChange={(e) => updatePartner(index, 'whatsapp', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor={`partner_cep_${index}`}>CEP</Label>
              <Input
                id={`partner_cep_${index}`}
                value={partner.cep}
                onChange={(e) => updatePartner(index, 'cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`partner_street_${index}`}>Endereço</Label>
              <Input
                id={`partner_street_${index}`}
                value={partner.street}
                onChange={(e) => updatePartner(index, 'street', e.target.value)}
                placeholder="Rua/Avenida"
              />
            </div>

            <div>
              <Label htmlFor={`partner_number_${index}`}>Número</Label>
              <Input
                id={`partner_number_${index}`}
                value={partner.number}
                onChange={(e) => updatePartner(index, 'number', e.target.value)}
                placeholder="Nº"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`partner_complement_${index}`}>Complemento</Label>
              <Input
                id={`partner_complement_${index}`}
                value={partner.complement}
                onChange={(e) => updatePartner(index, 'complement', e.target.value)}
                placeholder="Apto, Bloco"
              />
            </div>

            <div>
              <Label htmlFor={`partner_neighborhood_${index}`}>Bairro</Label>
              <Input
                id={`partner_neighborhood_${index}`}
                value={partner.neighborhood}
                onChange={(e) => updatePartner(index, 'neighborhood', e.target.value)}
                placeholder="Bairro"
              />
            </div>

            <div>
              <Label htmlFor={`partner_city_${index}`}>Cidade</Label>
              <Input
                id={`partner_city_${index}`}
                value={partner.city}
                onChange={(e) => updatePartner(index, 'city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`partner_state_${index}`}>Estado</Label>
            <Input
              id={`partner_state_${index}`}
              value={partner.state}
              onChange={(e) => updatePartner(index, 'state', e.target.value)}
              placeholder="UF"
              maxLength={2}
              className="w-full md:w-1/4"
            />
          </div>
        </div>
      ))}

      {partners.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum sócio adicionado. Clique em "Adicionar Sócio" para incluir.
        </p>
      )}
    </div>
  );
}
