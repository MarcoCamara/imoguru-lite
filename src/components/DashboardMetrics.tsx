import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, TrendingUp, Package, Share2, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

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
}

export default function DashboardMetrics({ showCharts = true }: DashboardMetricsProps) {
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
  const [averageValues, setAverageValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('purpose, status, property_type, sale_price, rental_price')
        .eq('archived', false);

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

      // Valor médio por tipo
      const typePrices: Record<string, number[]> = {};
      properties?.forEach(p => {
        const price = p.purpose === 'venda' ? p.sale_price : p.rental_price;
        if (price) {
          if (!typePrices[p.property_type]) typePrices[p.property_type] = [];
          typePrices[p.property_type].push(Number(price));
        }
      });
      const avgData = Object.entries(typePrices).map(([name, prices]) => ({
        name,
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }));
      setAverageValues(avgData);

      // Estatísticas de compartilhamento
      const { data: stats, error: statsError } = await supabase
        .from('property_statistics')
        .select('shares_whatsapp, shares_email, shares_facebook, shares_instagram');

      if (!statsError && stats) {
        const totalShares = stats.reduce((acc, s) => 
          acc + s.shares_whatsapp + s.shares_email + s.shares_facebook + s.shares_instagram, 0);
        const sharesByPlatform = {
          whatsapp: stats.reduce((acc, s) => acc + s.shares_whatsapp, 0),
          email: stats.reduce((acc, s) => acc + s.shares_email, 0),
          facebook: stats.reduce((acc, s) => acc + s.shares_facebook, 0),
          instagram: stats.reduce((acc, s) => acc + s.shares_instagram, 0),
        };
        setStatistics({ totalShares, sharesByPlatform });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {typeDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {averageValues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Valor Médio por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={averageValues}>
                    <XAxis dataKey="name" fontSize={9} tick={{ fontSize: 9 }} />
                    <YAxis fontSize={9} tick={{ fontSize: 9 }} />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                      contentStyle={{ fontSize: 10 }}
                    />
                    <Bar dataKey="average" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {shareData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Compartilhamentos por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={shareData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {shareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
