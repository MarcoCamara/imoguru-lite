import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from '@/lib/validationUtils';
import { useState } from 'react';

interface OwnerFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function OwnerForm({ formData, setFormData }: OwnerFormProps) {
  const [cpfCnpjError, setCpfCnpjError] = useState<string | null>(null);

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    // Decide se é CPF ou CNPJ baseado no comprimento
    if (value.length <= 11) { // Potencialmente um CPF
      value = formatCPF(value);
      setFormData({ ...formData, owner_cpf_cnpj: value });
      if (value.length === 14 && !validateCPF(value)) { // Se tem 11 dígitos e é inválido
        setCpfCnpjError('CPF inválido.');
      } else if (value.length < 14 && value.length > 0) {
        setCpfCnpjError('CPF incompleto.');
      } else {
        setCpfCnpjError(null);
      }
    } else { // Potencialmente um CNPJ
      value = formatCNPJ(value);
      setFormData({ ...formData, owner_cpf_cnpj: value });
      if (value.length === 18 && !validateCNPJ(value)) { // Se tem 14 dígitos e é inválido
        setCpfCnpjError('CNPJ inválido.');
      } else if (value.length < 18 && value.length > 0) {
        setCpfCnpjError('CNPJ incompleto.');
      } else {
        setCpfCnpjError(null);
      }
    }
    
    // Se o campo está vazio, limpa o erro
    if (value.length === 0) {
      setCpfCnpjError(null);
    }
  };

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
            onChange={handleCpfCnpjChange} // Alterado para usar a nova função
            placeholder="000.000.000-00 ou 00.000.000/0000-00" // Atualizar placeholder
            className={cpfCnpjError ? 'border-red-500' : ''} // Adicionar estilo de erro
          />
          {cpfCnpjError && <p className="text-red-500 text-sm mt-1">{cpfCnpjError}</p>} {/* Exibir erro */}
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
