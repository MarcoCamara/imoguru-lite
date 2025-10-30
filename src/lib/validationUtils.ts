// Utilitários de validação de CPF, CNPJ e outros dados

/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  
  // Remove formatação
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica tamanho
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se válido, false se inválido
 */
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return false;
  
  // Remove formatação
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  // Verifica tamanho
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Valida primeiro dígito verificador
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Formata CPF
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Valida campo numérico com limite máximo
 * @param value - Valor a validar
 * @param max - Valor máximo permitido
 * @returns true se válido, false se inválido
 */
export const validateNumericField = (value: number | string, max: number = 999999.99): boolean => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return false;
  if (numValue < 0) return false;
  if (numValue > max) return false;
  return true;
};

/**
 * Formata número de telefone
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  phone = phone.replace(/[^\d]/g, '');
  
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Valida email
 * @param email - Email a validar
 * @returns true se válido, false se inválido
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};