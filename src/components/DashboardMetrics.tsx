import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, TrendingUp, Package, Share2, DollarSign, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { PROPERTY_TYPES } from '@/lib/propertyConstants';
import { useAuth } from '@/contexts/AuthContext';

interface Metrics {
  total: number;
  forSale: number;
  forRent: number;
  available: number;
  negotiating: number;
  sold: number;
}

interface StatisticsData {
  totalShares: number;
  sharesByPlatform: {
    whatsapp: number;
    email: number;
    facebook: number;
    instagram: number;
  };
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardMetricsProps {
  showCharts?: boolean;
  averageResponseTime?: string | null;
}

export default function DashboardMetrics({ showCharts = true, averageResponseTime = null }: DashboardMetricsProps) {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    forSale: 0,
    forRent: 0,
    available: 0,
    negotiating: 0,
    sold: 0,
  });
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalShares: 0,
    sharesByPlatform: { whatsapp: 0, email: 0, facebook: 0, instagram: 0 },
  });
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [averageSaleValues, setAverageSaleValues] = useState<any[]>([]);
  const [averageRentalValues, setAverageRentalValues] = useState<any[]>([]);
  const [salePriceRangeDistribution, setSalePriceRangeDistribution] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [areaRangeDistribution, setAreaRangeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isAdmin) {
      fetchUserCompany();
    } else {
      fetchMetrics();
    }
  }, [user, isAdmin]);

  const fetchUserCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setUserCompanyId(data?.company_id || null);
      fetchMetrics(data?.company_id);
    } catch (error) {
      console.error('Error fetching user company:', error);
      fetchMetrics();
    }
  };

  const typeCategoryMap = PROPERTY_TYPES.reduce<Record<string, string>>((acc, type) => {
    acc[type.value] = type.category;
    return acc;
  }, {});

  const fetchMetrics = async (companyId?: string | null) => {
    try {
      let query = supabase
        .from('properties')
        .select('purpose, status, property_type, sale_price, rental_price, company_id')
        .eq('archived', false);
      
      // Filtrar por empresa se não for admin
      if (!isAdmin && companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data: properties, error } = await query;

      if (error) throw error;

      const total = properties?.length || 0;
      // Corrigido: imóveis com 'venda_locacao' são contados em ambos os cards
      const forSale = properties?.filter(p => p.purpose === 'venda' || p.purpose === 'venda_locacao').length || 0;
      const forRent = properties?.filter(p => p.purpose === 'locacao' || p.purpose === 'venda_locacao').length || 0;
      const available = properties?.filter(p => p.status === 'disponivel').length || 0;
      const negotiating = properties?.filter(p => p.status === 'reservado').length || 0;
      const sold = properties?.filter(p => p.status === 'vendido' || p.status === 'alugado').length || 0;

      setMetrics({ total, forSale, forRent, available, negotiating, sold });

      // Distribuição por tipo
      const typeCount: Record<string, number> = {};
      properties?.forEach(p => {
        typeCount[p.property_type] = (typeCount[p.property_type] || 0) + 1;
      });
      const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
      setTypeDistribution(typeData);

      // Distribuição por categoria
      const categoryCount: Record<string, number> = {};
      properties?.forEach(p => {
        const categoryKey = (p as any).category || typeCategoryMap[p.property_type] || 'Outros';
        categoryCount[categoryKey] = (categoryCount[categoryKey] || 0) + 1;
      });
      const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
      setCategoryDistribution(categoryData);

      // Valor médio por tipo - VENDA
      const typeSalePrices: Record<string, number[]> = {};
      properties?.forEach(p => {
        if ((p.purpose === 'venda' || p.purpose === 'venda_locacao') && p.sale_price) {
          if (!typeSalePrices[p.property_type]) typeSalePrices[p.property_type] = [];
          typeSalePrices[p.property_type].push(Number(p.sale_price));
        }
      });
      const avgSaleData = Object.entries(typeSalePrices).map(([name, prices]) => ({
        name,
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }));
      setAverageSaleValues(avgSaleData);

      // Valor médio por tipo - LOCAÇÃO
      const typeRentalPrices: Record<string, number[]> = {};
      properties?.forEach(p => {
        if ((p.purpose === 'locacao' || p.purpose === 'venda_locacao') && p.rental_price) {
          if (!typeRentalPrices[p.property_type]) typeRentalPrices[p.property_type] = [];
          typeRentalPrices[p.property_type].push(Number(p.rental_price));
        }
      });
      const avgRentalData = Object.entries(typeRentalPrices).map(([name, prices]) => ({
        name,
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }));
      setAverageRentalValues(avgRentalData);

      // Distribuição por faixa de preço (Venda)
      const salePriceRanges = [
        { label: 'Até 250k', min: 0, max: 250000 },
        { label: '250k - 500k', min: 250000, max: 500000 },
        { label: '500k - 1M', min: 500000, max: 1000000 },
        { label: '1M - 2M', min: 1000000, max: 2000000 },
        { label: 'Acima de 2M', min: 2000000, max: Infinity },
      ];

      const saleRangeData = salePriceRanges.map(range => {
        const count = properties?.filter(p => {
          if (!p.sale_price) return false;
          const price = Number(p.sale_price);
          if (Number.isNaN(price)) return false;
          return price >= range.min && price < range.max;
        }).length || 0;

        return { name: range.label, value: count };
      }).filter(item => item.value > 0);

      setSalePriceRangeDistribution(saleRangeData);

      const areaRanges = [
        { label: 'Até 50m²', min: 0, max: 50 },
        { label: '51m² - 100m²', min: 50, max: 100 },
        { label: '101m² - 150m²', min: 100, max: 150 },
        { label: '151m² - 250m²', min: 150, max: 250 },
        { label: 'Acima de 250m²', min: 250, max: Infinity },
      ];

      const areaData = areaRanges.map(range => {
        const count = properties?.filter(p => {
          const area = Number(p.total_area);
          if (!area || Number.isNaN(area)) return false;
          return area > range.min && area <= range.max;
        }).length || 0;

        return { name: range.label, value: count };
      }).filter(item => item.value > 0);

      setAreaRangeDistribution(areaData);

      // Estatísticas de compartilhamento
      const { data: stats, error: statsError } = await supabase
        .from('property_statistics')
        .select('property_id, shares_whatsapp, shares_email, shares_facebook, shares_instagram');

      if (!statsError && stats) {
        let uniqueSharedPropertiesCount = 0;
        const sharedPropertyIds = new Set<string>();
        let totalPlatformShares = 0;
        const sharesByPlatform = {
          whatsapp: 0,
          email: 0,
          facebook: 0,
          instagram: 0,
        };

        stats.forEach(s => {
          const propertyHasShares = s.shares_whatsapp > 0 || s.shares_email > 0 || s.shares_facebook > 0 || s.shares_instagram > 0;
          if (propertyHasShares && s.property_id) {
            sharedPropertyIds.add(s.property_id);
          }

          totalPlatformShares += s.shares_whatsapp + s.shares_email + s.shares_facebook + s.shares_instagram;
          sharesByPlatform.whatsapp += s.shares_whatsapp;
          sharesByPlatform.email += s.shares_email;
          sharesByPlatform.facebook += s.shares_facebook;
          sharesByPlatform.instagram += s.shares_instagram;
        });
        
        uniqueSharedPropertiesCount = sharedPropertyIds.size;

        // O 'totalShares' agora representa o número de propriedades únicas que foram compartilhadas
        // e 'totalPlatformShares' representa a soma de todos os compartilhamentos por plataforma para o Card.
        setStatistics({ totalShares: uniqueSharedPropertiesCount, sharesByPlatform });
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="animate-pulse h-20"></div></CardContent></Card>
        </div>
      </div>
    );
  }

  const shareData = [
    { name: 'WhatsApp', value: statistics.sharesByPlatform.whatsapp },
    { name: 'Email', value: statistics.sharesByPlatform.email },
    { name: 'Facebook', value: statistics.sharesByPlatform.facebook },
    { name: 'Instagram', value: statistics.sharesByPlatform.instagram },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 mb-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Imóveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Venda</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.forSale}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0 ? `${((metrics.forSale / metrics.total) * 100).toFixed(0)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Locação</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.forRent}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0 ? `${((metrics.forRent / metrics.total) * 100).toFixed(0)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.available}</div>
            <p className="text-xs text-muted-foreground">Prontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociando</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.negotiating}</div>
            <p className="text-xs text-muted-foreground">Reservados</p>
          </CardContent>
        </Card>

        {averageResponseTime && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageResponseTime}</div>
              <p className="text-xs text-muted-foreground">Atendimento</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compartilhamentos</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalShares}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Gráfico 1: Distribuição por Tipo */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {typeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }} layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 2: Distribuição por Categoria */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`category-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }} layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados de categoria</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 3: Compartilhamentos por Plataforma */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Compartilhamentos por Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              {shareData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={shareData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {shareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }} layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem compartilhamentos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 4: Status dos Imóveis */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Status dos Imóveis</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const statusData = [
                  { name: 'Disponíveis', value: metrics.available, color: '#10b981' },
                  { name: 'Reservados', value: metrics.negotiating, color: '#f59e0b' },
                  { name: 'Vendidos/Alugados', value: metrics.sold, color: '#ef4444' },
                ].filter(d => d.value > 0);
                
                return statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={statusData} layout="vertical">
                      <XAxis 
                        type="number"
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        width={120}
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip formatter={(value) => `${value} imóvel(is)`} contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusData[index].color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                    <p className="text-sm">Sem dados disponíveis</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico 5: Valor Médio por Tipo (Venda) */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Valor Médio por Tipo (Venda)</CardTitle>
            </CardHeader>
            <CardContent>
              {averageSaleValues.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={averageSaleValues} layout="vertical">
                    <XAxis 
                      type="number"
                      fontSize={10} 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      width={90}
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const maxLength = 12;
                        return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                      contentStyle={{ fontSize: 10 }}
                    />
                    <Bar dataKey="average" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados de venda suficientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Valor Médio por Tipo (Locação)</CardTitle>
            </CardHeader>
            <CardContent>
              {averageRentalValues.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={averageRentalValues}>
                    <XAxis 
                      dataKey="name" 
                      fontSize={10} 
                      tick={{ fontSize: 10 }} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      tickFormatter={(value) => {
                        const maxLength = 8;
                        return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
                      }}
                    />
                    <YAxis 
                      fontSize={10} 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}`}
                    />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                      contentStyle={{ fontSize: 10 }}
                    />
                    <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados de locação suficientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 7: Distribuição por Finalidade (Venda/Locação) */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Distribuição por Finalidade</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const purposeData = [
                  { name: 'Venda', value: metrics.forSale, color: '#8b5cf6' },
                  { name: 'Locação', value: metrics.forRent, color: '#3b82f6' },
                ].filter(d => d.value > 0);
                
                return purposeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={purposeData}>
                      <XAxis 
                        dataKey="name"
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                      />
                      <Tooltip formatter={(value) => `${value} imóvel(is)`} contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {purposeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={purposeData[index].color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                    <p className="text-sm">Sem dados disponíveis</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Gráfico 8: Faixa de Preço (Venda) */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Faixa de Preço (Venda)</CardTitle>
            </CardHeader>
            <CardContent>
              {salePriceRangeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salePriceRangeDistribution} layout="vertical">
                    <XAxis 
                      type="number"
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => `${value} imóvel(is)`}
                      contentStyle={{ fontSize: 10 }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados de venda suficientes</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Imóveis por Faixa de Área</CardTitle>
            </CardHeader>
            <CardContent>
              {areaRangeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={areaRangeDistribution}>
                    <XAxis 
                      dataKey="name"
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value) => `${value} imóvel(is)`}
                      contentStyle={{ fontSize: 10 }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                  <p className="text-sm">Sem dados de área suficientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
