import * as XLSX from 'xlsx';

const getPropertyData = (properties: any[]) => {
  return properties.map(prop => ({
    'Código': prop.code || '',
    'Título': prop.title || '',
    'Finalidade': prop.purpose || '',
    'Tipo': prop.property_type || '',
    'Condição': prop.condition || '',
    'Status': prop.status || '',
    'CEP': prop.cep || '',
    'Endereço': prop.street || '',
    'Número': prop.number || '',
    'Complemento': prop.complement || '',
    'Bairro': prop.neighborhood || '',
    'Cidade': prop.city || '',
    'Estado': prop.state || '',
    'Dormitórios': prop.bedrooms || 0,
    'Suítes': prop.suites || 0,
    'Banheiros': prop.bathrooms || 0,
    'Vagas': prop.parking_spaces || 0,
    'Área Útil (m²)': prop.useful_area || '',
    'Área Total (m²)': prop.total_area || '',
    'Ano de Construção': prop.construction_year || '',
    'Preço de Venda (R$)': prop.sale_price || '',
    'Preço de Locação (R$)': prop.rental_price || '',
    'IPTU (R$)': prop.iptu_price || '',
    'Condomínio (R$)': prop.condo_price || '',
    'Aceita Permuta': prop.accepts_exchange ? 'Sim' : 'Não',
    'Descrição': prop.description || '',
    'Nome do Proprietário': prop.owner_name || '',
    'CPF/CNPJ do Proprietário': prop.owner_cpf_cnpj || '',
    'Email do Proprietário': prop.owner_email || '',
    'Telefone do Proprietário': prop.owner_phone || '',
    'Publicado': prop.published ? 'Sim' : 'Não',
    'Publicado no Portal': prop.published_on_portal ? 'Sim' : 'Não',
    'Arquivado': prop.archived ? 'Sim' : 'Não',
    'Data de Criação': prop.created_at ? new Date(prop.created_at).toLocaleDateString('pt-BR') : '',
  }));
};

export const exportToCSV = (properties: any[]) => {
  const data = getPropertyData(properties);
  const headers = Object.keys(data[0] || {});
  
  const rows = data.map(row => 
    headers.map(header => {
      const value = String(row[header as keyof typeof row]).replace(/"/g, '""');
      return value.includes(',') || value.includes('"') || value.includes('\n') 
        ? `"${value}"` 
        : value;
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `imoveis_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXLSX = (properties: any[]) => {
  const data = getPropertyData(properties);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Imóveis');
  
  // Auto-adjust column widths
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(Math.max(key.length, 10), maxWidth)
  }));
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, `imoveis_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToJSON = (properties: any[]) => {
  const data = getPropertyData(properties);
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `imoveis_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const shareProperties = async (properties: any[]) => {
  const data = getPropertyData(properties);
  const text = `Confira ${properties.length} imóve${properties.length === 1 ? 'l' : 'is'}:\n\n${
    data.slice(0, 3).map(prop => 
      `${prop.Título} - ${prop.Cidade}/${prop.Estado}\n${prop['Preço de Venda (R$)'] ? `R$ ${prop['Preço de Venda (R$)']}` : `Aluguel: R$ ${prop['Preço de Locação (R$)']}`}`
    ).join('\n\n')
  }${properties.length > 3 ? `\n\n...e mais ${properties.length - 3} imóveis` : ''}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Imóveis - Imóvel Mate',
        text: text,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      return 'clipboard';
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
};
