// Utilitário para busca de CEP usando Brasil API

export interface CEPData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  uf?: string;
  localidade?: string;
  bairro?: string;
  logradouro?: string;
}

export async function searchCep(cep: string): Promise<CEPData | null> {
  return fetchCEP(cep);
}

export async function fetchCEP(cep: string): Promise<CEPData | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
    
    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data = await response.json();
    
    return {
      cep: data.cep,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
      street: data.street,
      service: data.service,
      uf: data.state,
      localidade: data.city,
      bairro: data.neighborhood,
      logradouro: data.street
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{3})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return cleaned;
}
