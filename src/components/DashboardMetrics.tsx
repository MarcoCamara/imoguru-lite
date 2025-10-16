import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Home, DollarSign, Key, TrendingUp } from 'lucide-react';

interface Metrics {
  total: number;
  forSale: number;
  forRent: number;
  available: number;
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    forSale: 0,
    forRent: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('purpose, status, archived')
        .eq('archived', false);

      if (error) throw error;

      const total = properties?.length || 0;
      const forSale = properties?.filter((p) => p.purpose === 'venda').length || 0;
      const forRent = properties?.filter((p) => p.purpose === 'locacao').length || 0;
      const available = properties?.filter((p) => p.status === 'disponivel').length || 0;

      setMetrics({ total, forSale, forRent, available });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Imóveis</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total}</div>
          <p className="text-xs text-muted-foreground">Imóveis cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Para Venda</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.forSale}</div>
          <p className="text-xs text-muted-foreground">
            {((metrics.forSale / metrics.total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Para Locação</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.forRent}</div>
          <p className="text-xs text-muted-foreground">
            {((metrics.forRent / metrics.total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.available}</div>
          <p className="text-xs text-muted-foreground">
            {((metrics.available / metrics.total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
