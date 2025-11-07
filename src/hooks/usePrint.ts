import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PrintData {
  properties: any[];
  company?: any;
  showFullAddress?: boolean;
  layout?: 'default' | 'compact';
}

interface PrintTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  photo_columns?: number;
  photo_placement?: 'before_text' | 'after_text' | 'intercalated';
  max_photos?: number;
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '';
  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const formatArea = (value?: number | null) => {
  if (value === null || value === undefined) return '';
  return `${value}m²`;
};

const formatLabel = (value?: string | null) => {
  if (!value) return '';
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPhotoGrid = (images: any[], template: PrintTemplate) => {
  if (!images || images.length === 0) {
    return '';
  }

  const columns = template.photo_columns && template.photo_columns > 0 ? template.photo_columns : 2;
  const maxPhotos = template.max_photos && template.max_photos > 0 ? template.max_photos : 6;
  const selectedImages = images.slice(0, maxPhotos);

  const photosHtml = selectedImages
    .map((img) => `
      <div style="position: relative; width: 100%; overflow: hidden; aspect-ratio: 4 / 3; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <img src="${img.url}" alt="Imagem do imóvel" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
      </div>
    `)
    .join('');

  return `
    <div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 12px; margin: 20px 0;">
      ${photosHtml}
    </div>
  `;
};

const sortPropertyImages = (images: any[] = []) => {
  return [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });
};

const buildCompactPrintDocument = (
  property: any,
  company: any,
  systemSettings: any,
  qrCodeUrl: string,
  showFullAddress?: boolean
) => {
  const sortedImages = sortPropertyImages(property?.property_images).slice(0, 6);
  const location = buildFullAddress(property, showFullAddress) || buildFullAddress(property, false);
  const primaryColor = company?.primary_color || '#1f2937';
  const secondaryColor = company?.secondary_color || '#475569';

  const metrics = [
    { label: 'Dormitórios', value: property?.bedrooms },
    { label: 'Suítes', value: property?.suites },
    { label: 'Banheiros', value: property?.bathrooms },
    { label: 'Vagas Cobertas', value: property?.covered_parking },
    { label: 'Vagas Descobertas', value: property?.uncovered_parking },
    { label: 'Área Útil', value: property?.useful_area ? `${property.useful_area} m²` : null },
    { label: 'Área Total', value: property?.total_area ? `${property.total_area} m²` : null },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '');

  const valueCards = [
    { label: 'Valor de Venda', value: formatCurrency(property?.sale_price) },
    { label: 'Valor de Locação', value: formatCurrency(property?.rental_price) },
    { label: 'Valor do IPTU', value: formatCurrency(property?.iptu_price ?? property?.iptu) },
    { label: 'Taxa de Condomínio', value: formatCurrency(property?.condo_price ?? property?.condominium_fee) },
    { label: 'Taxa de Administração', value: formatCurrency(property?.administration_fee) },
  ].filter((item) => item.value);

  const summaryCards = [
    {
      label: 'Finalidade',
      value:
        property?.purpose === 'venda'
          ? 'Venda'
          : property?.purpose === 'locacao'
          ? 'Locação'
          : property?.purpose === 'venda/locacao'
          ? 'Venda/Locação'
          : '',
    },
    { label: 'Status', value: property?.status ? formatLabel(property.status) : '' },
    { label: 'Localização', value: location },
    {
      label: 'Aceita Permuta',
      value:
        property?.accepts_exchange === true
          ? 'Sim'
          : property?.accepts_exchange === false
          ? 'Não'
          : '',
    },
  ].filter((item) => item.value);

  const propertyFeatures = Array.isArray(property?.property_features)
    ? property.property_features.filter(Boolean).slice(0, 12)
    : [];
  const condoAmenities = Array.isArray(property?.condo_amenities)
    ? property.condo_amenities.filter(Boolean).slice(0, 12)
    : [];

  const descriptionText = property?.description
    ? escapeHtml(property.description.length > 900 ? `${property.description.substring(0, 900)}...` : property.description).replace(/\n/g, '<br />')
    : '';

  const logoHtml = company?.logo_url
    ? `<img src="${company.logo_url}" alt="Logo da empresa" style="max-height: 48px;" />`
    : `<div style="font-weight: 700; font-size: 14px; color: ${primaryColor};">${escapeHtml(company?.name || systemSettings?.app_name || 'ImoGuru')}</div>`;

  const primaryPrice = property?.purpose === 'locacao' && property?.rental_price
    ? formatCurrency(property.rental_price)
    : formatCurrency(property?.sale_price) || formatCurrency(property?.rental_price);
  const primaryPriceLabel = property?.purpose === 'locacao' && property?.rental_price
    ? 'Valor de Locação'
    : property?.sale_price
    ? 'Valor de Venda'
    : property?.rental_price
    ? 'Valor de Locação'
    : '';

  const photosHtml = sortedImages
    .map(
      (img) => `
        <div class="photo">
          <img src="${img.url}" alt="Foto do imóvel" onerror="this.style.display='none'" />
        </div>
      `
    )
    .join('');

  return `
    <div class="sheet">
      <header class="sheet-header">
        <div class="header-left">
          <h1>${escapeHtml(property?.title || 'Imóvel')}</h1>
          <p class="location">${escapeHtml(location)}</p>
        </div>
        <div class="header-right">
          ${logoHtml}
          ${primaryPrice ? `<p class="price-label">${primaryPriceLabel}</p><p class="price">${primaryPrice}</p>` : ''}
        </div>
      </header>

      ${metrics.length > 0 ? `
        <section class="metrics-grid">
          ${metrics
            .map(
              (metric) => `
                <div class="metric-card">
                  <p class="metric-label">${escapeHtml(metric.label)}</p>
                  <p class="metric-value">${escapeHtml(String(metric.value))}</p>
                </div>
              `
            )
            .join('')}
        </section>
      ` : ''}

      ${valueCards.length > 0 ? `
        <section class="section">
          <h2 class="section-title" style="color: ${primaryColor};">Valores e Custos</h2>
          <div class="info-grid values">
            ${valueCards
              .map(
                (card) => `
                  <div class="info-card">
                    <p class="info-label">${escapeHtml(card.label)}</p>
                    <p class="info-value">${escapeHtml(card.value)}</p>
                  </div>
                `
              )
              .join('')}
          </div>
        </section>
      ` : ''}

      ${summaryCards.length > 0 ? `
        <section class="section">
          <h2 class="section-title" style="color: ${primaryColor};">Informações Gerais</h2>
          <div class="info-grid summary">
            ${summaryCards
              .map(
                (card) => `
                  <div class="info-card">
                    <p class="info-label">${escapeHtml(card.label)}</p>
                    <p class="info-value">${escapeHtml(card.value)}</p>
                  </div>
                `
              )
              .join('')}
          </div>
        </section>
      ` : ''}

      ${descriptionText ? `
        <section class="section">
          <h2 class="section-title" style="color: ${primaryColor};">Descrição</h2>
          <p class="description">${descriptionText}</p>
        </section>
      ` : ''}

      ${propertyFeatures.length > 0 || condoAmenities.length > 0 ? `
        <section class="section">
          <h2 class="section-title" style="color: ${primaryColor};">Estrutura e Facilidades</h2>
          ${propertyFeatures.length > 0
            ? `<div class="tag-group">
                ${propertyFeatures
                  .map((feature: string) => `<span class="tag">${escapeHtml(feature)}</span>`)
                  .join('')}
              </div>`
            : ''}
          ${condoAmenities.length > 0
            ? `<div class="tag-group">
                ${condoAmenities
                  .map((amenity: string) => `<span class="tag">${escapeHtml(amenity)}</span>`)
                  .join('')}
              </div>`
            : ''}
        </section>
      ` : ''}

      ${photosHtml
        ? `<section class="section">
            <h2 class="section-title" style="color: ${primaryColor};">Fotos</h2>
            <div class="photos-grid">
              ${photosHtml}
            </div>
          </section>`
        : ''}

      <footer class="sheet-footer">
        <div class="footer-info">
          ${company?.name ? `<p><strong>${escapeHtml(company.name)}</strong></p>` : ''}
          ${company?.phone ? `<p>Telefone: ${escapeHtml(company.phone)}</p>` : ''}
          ${company?.email ? `<p>Email: ${escapeHtml(company.email)}</p>` : ''}
          ${company?.whatsapp ? `<p>WhatsApp: ${escapeHtml(company.whatsapp)}</p>` : ''}
        </div>
      </footer>
    </div>
  `;
};

const buildPublicPropertyUrl = (property: any, company: any) => {
  const origin = window.location.origin;
  const companySlug = company?.slug || property?.company_slug || '';
  const propertyIdentifier = property?.public_slug || property?.id;

  if (companySlug && propertyIdentifier) {
    return `${origin}/public-property/${companySlug}/property/${propertyIdentifier}`;
  }

  if (propertyIdentifier) {
    return `${origin}/imovel/${propertyIdentifier}`;
  }

  return origin;
};

const buildFullAddress = (property: any, showFullAddress?: boolean) => {
  if (!property) return '';

  if (showFullAddress) {
    const parts = [property.street, property.number, property.neighborhood, property.city, property.state, property.cep]
      .filter(Boolean)
      .join(', ');
    return parts;
  }

  const parts = [property.neighborhood, property.city, property.state]
    .filter(Boolean)
    .join(', ');
  return parts;
};

const formatTemplateContent = (
  template: PrintTemplate,
  property: any,
  systemSettings: any,
  company: any,
  qrCodeUrl: string,
  showFullAddress?: boolean
) => {
  if (!template?.content) return '';

  let content = template.content;

  const sortedImages = sortPropertyImages(property?.property_images);
  const photoGrid = buildPhotoGrid(sortedImages, template);

  const salePrice = formatCurrency(property?.sale_price);
  const rentalPrice = formatCurrency(property?.rental_price);
  const condominiumFee = formatCurrency(property?.condominium_fee ?? property?.condo_fee ?? property?.condo_price);
  const iptuValue = formatCurrency(property?.iptu ?? property?.iptu_price);
  const price = property?.purpose === 'locacao' ? rentalPrice : salePrice;
  const propertyUrl = buildPublicPropertyUrl(property, company);
  const publicAddress = property?.public_address || buildFullAddress(property, false);
  const coveredParking =
    property?.covered_parking !== undefined && property?.covered_parking !== null
      ? String(property.covered_parking)
      : '';
  const uncoveredParking =
    property?.uncovered_parking !== undefined && property?.uncovered_parking !== null
      ? String(property.uncovered_parking)
      : '';
  const totalArea = formatArea(property?.total_area);
  const usefulArea = formatArea(property?.useful_area);

  const replacements: Record<string, string> = {
    title: property?.title || '',
    code: property?.code || '',
    property_type: property?.property_type || '',
    purpose: property?.purpose === 'venda' ? 'Venda' : property?.purpose === 'locacao' ? 'Locação' : (property?.purpose || ''),
    status: property?.status || '',
    sale_price: salePrice,
    rental_price: rentalPrice,
    price,
    bedrooms: property?.bedrooms !== undefined && property?.bedrooms !== null ? String(property.bedrooms) : '',
    suites: property?.suites !== undefined && property?.suites !== null ? String(property.suites) : '',
    bathrooms: property?.bathrooms !== undefined && property?.bathrooms !== null ? String(property.bathrooms) : '',
    parking_spaces: property?.parking_spaces !== undefined && property?.parking_spaces !== null ? String(property.parking_spaces) : '',
    total_area: totalArea,
    useful_area: usefulArea,
    area_total: totalArea,
    area_util: usefulArea,
    city: property?.city || '',
    neighborhood: property?.neighborhood || '',
    street: property?.street || '',
    state: property?.state || '',
    description: property?.description || '',
    property_url: propertyUrl ? `<a href="${propertyUrl}" target="_blank" rel="noopener noreferrer">${propertyUrl}</a>` : '',
    line_break: '<br /><br />',
    owner_name: property?.owner_name || '',
    owner_cpf_cnpj: property?.owner_cpf_cnpj || '',
    owner_email: property?.owner_email || '',
    owner_phone: property?.owner_phone || '',
    full_address: buildFullAddress(property, showFullAddress),
    public_address: publicAddress,
    app_name: systemSettings?.app_name || 'ImoGuru',
    agency_name: company?.name || property?.company_name || '',
    company_logo: company?.logo_url ? `<img src="${company.logo_url}" alt="Logo da empresa" style="max-height: 60px;" />` : (company?.name || ''),
    logo: systemSettings?.logo_url ? `<img src="${systemSettings.logo_url}" alt="Logo" style="max-height: 60px;" />` : (systemSettings?.app_name || 'ImoGuru'),
    qrcode: qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code" style="width: 110px; height: 110px;" />` : '',
    current_date: new Date().toLocaleDateString('pt-BR'),
    contact_phone: company?.phone || '',
    contact_email: company?.email || '',
    contact_whatsapp: company?.whatsapp || '',
    condominium_fee: condominiumFee,
    condo_fee: condominiumFee,
    iptu: iptuValue,
    valor_condominio: condominiumFee,
    taxa_condominio: condominiumFee,
    valor_iptu: iptuValue,
    valor_venda: salePrice,
    valor_locacao: rentalPrice,
    vagas_cobertas: coveredParking,
    vagas_descobertas: uncoveredParking,
    covered_parking: coveredParking,
    uncovered_parking: uncoveredParking,
    parking_total:
      property?.parking_spaces !== undefined && property?.parking_spaces !== null
        ? String(property.parking_spaces)
        : coveredParking || uncoveredParking
        ? String(Number(coveredParking || 0) + Number(uncoveredParking || 0))
        : '',
    property_primary_color: company?.primary_color || '#1f2937',
    property_secondary_color: company?.secondary_color || '#334155',
  };

  // Permitir utilizar quaisquer campos primitivos adicionais automaticamente
  Object.entries(property || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') return;
    if (!replacements[key]) {
      replacements[key] = String(value);
    }
  });

  Object.entries(company || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') return;
    const normalizedKey = `company_${key}`;
    if (!replacements[normalizedKey]) {
      replacements[normalizedKey] = String(value);
    }
  });

  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
    content = content.replace(regex, value || '');
  });

  if (photoGrid) {
    if (content.includes('{{images}}')) {
      content = content.replace(/{{\s*images\s*}}/g, photoGrid);
    } else if (content.includes('{{photos_grid}}')) {
      content = content.replace(/{{\s*photos_grid\s*}}/g, photoGrid);
    } else {
      const placement = template.photo_placement || 'after_text';
      if (placement === 'before_text') {
        content = photoGrid + content;
      } else if (placement === 'intercalated') {
        const paragraphs = content.split('</p>');
        if (paragraphs.length > 2) {
          paragraphs.splice(2, 0, photoGrid);
          content = paragraphs.join('</p>');
        } else {
          content = content + photoGrid;
        }
      } else {
        content = content + photoGrid;
      }
    }
  } else {
    content = content.replace(/{{\s*images\s*}}/g, '');
    content = content.replace(/{{\s*photos_grid\s*}}/g, '');
  }

  return content;
};

const generateQRCode = async (property: any, company: any) => {
  try {
    const propertyUrl = buildPublicPropertyUrl(property, company);
    const { default: QRCode } = await import('qrcode');
    return await QRCode.toDataURL(propertyUrl);
  } catch (error) {
    console.error('Erro ao gerar QR Code para impressão:', error);
    return '';
  }
};

const loadSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['app_name', 'logo_url']);

    if (error) throw error;

    const settings: Record<string, any> = { app_name: 'ImoGuru', logo_url: null };
    data?.forEach((item) => {
      settings[item.setting_key] = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error('Erro ao carregar configurações do sistema para impressão:', error);
    return { app_name: 'ImoGuru', logo_url: null };
  }
};

const loadDefaultPrintTemplate = async (): Promise<PrintTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('is_default', true)
      .eq('archived', false)
      .single();

    if (error) throw error;

    return data as PrintTemplate;
  } catch (error) {
    console.error('Erro ao carregar template de impressão padrão:', error);
    return null;
  }
};

const loadCompanyById = async (companyId: string | null | undefined) => {
  if (!companyId) return null;

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao carregar empresa para impressão:', error);
    return null;
  }
};

export const usePrint = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const printProperties = async (data: PrintData) => {
    try {
      if (!data?.properties || data.properties.length === 0) {
        toast({
          title: 'Nenhum imóvel selecionado',
          description: 'Selecione ao menos um imóvel para imprimir.',
          variant: 'destructive',
        });
        return;
      }

      const [template, systemSettings] = await Promise.all([
        loadDefaultPrintTemplate(),
        loadSystemSettings(),
      ]);

      const useCompactLayout = data.layout === 'compact' && data.properties.length === 1;

      if (!useCompactLayout && (!template || !template.content)) {
        toast({
          title: 'Template não configurado',
          description: 'Configure um template padrão em Configurações > Templates de Impressão.',
          variant: 'destructive',
        });
        return;
      }

      const companyCache = new Map<string, any>();

      const qrCodesPromises = data.properties.map(async (property) => {
        const companyId = property?.company_id;

        let resolvedCompany = data.company;
        if (!resolvedCompany) {
          if (companyId) {
            if (companyCache.has(companyId)) {
              resolvedCompany = companyCache.get(companyId);
            } else {
              resolvedCompany = await loadCompanyById(companyId);
              if (resolvedCompany) {
                companyCache.set(companyId, resolvedCompany);
              }
            }
          }
        }

        return generateQRCode(property, resolvedCompany || data.company || null);
      });

      const qrCodes = await Promise.all(qrCodesPromises);

      const printWindow = window.open('', '', 'width=900,height=700');
      if (!printWindow) {
        toast({
          title: 'Erro ao abrir impressão',
          description: 'Ative pop-ups para permitir a impressão.',
          variant: 'destructive',
        });
        return;
      }

      const formattedProperties = await Promise.all(
        data.properties.map(async (property, index) => {
          const companyId = property?.company_id;
          let resolvedCompany = data.company;

          if (!resolvedCompany && companyId) {
            resolvedCompany = companyCache.get(companyId);
            if (!resolvedCompany) {
              resolvedCompany = await loadCompanyById(companyId);
              if (resolvedCompany) {
                companyCache.set(companyId, resolvedCompany);
              }
            }
          }

          const companyForProperty = resolvedCompany || data.company || null;
          const content = useCompactLayout
            ? buildCompactPrintDocument(
                property,
                companyForProperty,
                systemSettings,
                qrCodes[index] || '',
                data.showFullAddress
              )
            : formatTemplateContent(
                template as PrintTemplate,
                property,
                systemSettings,
                companyForProperty,
                qrCodes[index] || '',
                data.showFullAddress
              );

          if (!content || content.trim() === '') {
            return `<div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0;">
              <h2 style="margin-bottom: 8px;">${property?.title || property?.code || 'Imóvel'}</h2>
              <p>Não foi possível gerar o conteúdo para este imóvel. Verifique os dados ou o template.</p>
            </div>`;
          }

          return content;
        })
      );

      const baseStyles = `
        body {
          font-family: Arial, sans-serif;
          color: #1f2937;
          line-height: 1.55;
          padding: 24px;
          background: #fff;
        }

        img {
          max-width: 100%;
          height: auto;
        }
      `;

      const compactStyles = useCompactLayout
        ? `
          body {
            padding: 18px 24px;
            background: #f8fafc;
          }

          .sheet {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 20px 26px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            min-height: calc(100vh - 80px);
          }

          .sheet-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }

          .sheet-header h1 {
            margin: 0;
            font-size: 22px;
            line-height: 1.25;
          }

          .location {
            margin: 4px 0 0;
            font-size: 12px;
            color: #475569;
          }

          .header-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: flex-end;
          }

          .price-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
            margin: 0;
          }

          .price {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }

          .metrics-grid {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .metrics-grid::-webkit-scrollbar {
            height: 6px;
          }

          .metrics-grid::-webkit-scrollbar-thumb {
            background: #cbd5f5;
            border-radius: 999px;
          }

          .metrics-grid::-webkit-scrollbar-track {
            background: transparent;
          }

          .metric-card {
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            min-width: 110px;
          }

          .metric-label {
            margin: 0;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
          }

          .metric-value {
            margin: 4px 0 0;
            font-size: 13px;
            font-weight: 600;
          }

          .section {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .section-title {
            margin: 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .info-grid {
            display: grid;
            gap: 8px;
          }

          .info-grid.summary {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }

          .info-grid.values {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }

          .info-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 8px 10px;
            background: #ffffff;
          }

          .info-label {
            margin: 0;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
          }

          .info-value {
            margin: 4px 0 0;
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
          }

          .description {
            margin: 0;
            font-size: 12px;
            color: #334155;
            text-align: justify;
            max-height: 140px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 8;
            -webkit-box-orient: vertical;
            word-break: break-word;
          }

          .tag-group {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            font-size: 11px;
            border-radius: 999px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
          }

          .photos-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .photo {
            position: relative;
            width: 100%;
            padding-top: 66%;
            overflow: hidden;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
          }

          .photo img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .sheet-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: auto;
          }

          .sheet-footer p {
            margin: 0;
            font-size: 11px;
            color: #475569;
          }

          .footer-qr img {
            width: 96px;
            height: 96px;
          }
        `
        : '';

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impressão de imóveis</title>
            <meta charset="utf-8" />
            <style>
              @media print {
                @page {
                  margin: 1.5cm;
                  size: A4;
                }
                body {
                  height: auto !important;
                  min-height: auto !important;
                }
                .page-break {
                  page-break-after: always;
                }
                body > div:last-child {
                  page-break-after: auto !important;
                  margin-bottom: 0 !important;
                  padding-bottom: 0 !important;
                }
                body > div:empty {
                  display: none !important;
                }
                body *:last-child {
                  margin-bottom: 0 !important;
                }
              }
 
              ${baseStyles}
              ${compactStyles}
            </style>
          </head>
          <body>
            ${formattedProperties
              .map((content, index) => `${content}${index < formattedProperties.length - 1 ? '<div class="page-break"></div>' : ''}`)
              .join('')}
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (error) {
          console.error('Erro ao acionar impressão:', error);
        }
      };

      printWindow.onload = () => {
        setTimeout(triggerPrint, 800);
      };

      setTimeout(() => {
        if (!printWindow.closed && printWindow.document.readyState === 'complete') {
          triggerPrint();
        }
      }, 2000);
    } catch (error: any) {
      console.error('Erro geral ao imprimir imóveis:', error);
      toast({
        title: 'Erro ao imprimir',
        description: error?.message || 'Ocorreu um erro ao preparar a impressão.',
        variant: 'destructive',
      });
    }
  };

  return { printProperties };
};
