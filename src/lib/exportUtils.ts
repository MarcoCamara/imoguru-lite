export const exportToCSV = (properties: any[]) => {
  const headers = [
    'Código',
    'Título',
    'Finalidade',
    'Tipo',
    'Condição',
    'Status',
    'CEP',
    'Endereço',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'Estado',
    'Dormitórios',
    'Suítes',
    'Banheiros',
    'Vagas',
    'Área Útil (m²)',
    'Área Total (m²)',
    'Ano de Construção',
    'Preço de Venda (R$)',
    'Preço de Locação (R$)',
    'IPTU (R$)',
    'Condomínio (R$)',
    'Aceita Permuta',
    'Descrição',
    'Nome do Proprietário',
    'CPF/CNPJ do Proprietário',
    'Email do Proprietário',
    'Telefone do Proprietário',
    'Publicado',
    'Publicado no Portal',
    'Data de Criação',
  ];

  const rows = properties.map(prop => [
    prop.code || '',
    prop.title || '',
    prop.purpose || '',
    prop.property_type || '',
    prop.condition || '',
    prop.status || '',
    prop.cep || '',
    prop.street || '',
    prop.number || '',
    prop.complement || '',
    prop.neighborhood || '',
    prop.city || '',
    prop.state || '',
    prop.bedrooms || 0,
    prop.suites || 0,
    prop.bathrooms || 0,
    prop.parking_spaces || 0,
    prop.useful_area || '',
    prop.total_area || '',
    prop.construction_year || '',
    prop.sale_price || '',
    prop.rental_price || '',
    prop.iptu_price || '',
    prop.condo_price || '',
    prop.accepts_exchange ? 'Sim' : 'Não',
    prop.description || '',
    prop.owner_name || '',
    prop.owner_cpf_cnpj || '',
    prop.owner_email || '',
    prop.owner_phone || '',
    prop.published ? 'Sim' : 'Não',
    prop.published_on_portal ? 'Sim' : 'Não',
    prop.created_at ? new Date(prop.created_at).toLocaleDateString('pt-BR') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const value = String(cell).replace(/"/g, '""');
        return value.includes(',') || value.includes('"') || value.includes('\n') 
          ? `"${value}"` 
          : value;
      }).join(',')
    ),
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
