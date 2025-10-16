import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Share2, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface StatisticsTabProps {
  propertyId?: string;
}

interface Statistics {
  shares_whatsapp: number;
  shares_email: number;
  shares_facebook: number;
  shares_instagram: number;
  views_whatsapp: number;
  views_email: number;
  views_facebook: number;
  views_instagram: number;
}

const COLORS = {
  whatsapp: '#25D366',
  email: '#3B82F6',
  facebook: '#1877F2',
  instagram: '#E4405F',
};

export default function StatisticsTab({ propertyId }: StatisticsTabProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      loadStatistics();
    }
  }, [propertyId]);

  const loadStatistics = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_statistics')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStatistics(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!propertyId) {
    return (
      <div className="space-y-4 pt-4">
        <p className="text-muted-foreground">
          Salve o imóvel primeiro para visualizar as estatísticas.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <p className="text-muted-foreground">Carregando estatísticas...</p>
      </div>
    );
  }

  const shareData = [
    { name: 'WhatsApp', value: statistics?.shares_whatsapp || 0, color: COLORS.whatsapp },
    { name: 'Email', value: statistics?.shares_email || 0, color: COLORS.email },
    { name: 'Facebook', value: statistics?.shares_facebook || 0, color: COLORS.facebook },
    { name: 'Instagram', value: statistics?.shares_instagram || 0, color: COLORS.instagram },
  ];

  const viewData = [
    { name: 'WhatsApp', value: statistics?.views_whatsapp || 0, color: COLORS.whatsapp },
    { name: 'Email', value: statistics?.views_email || 0, color: COLORS.email },
    { name: 'Facebook', value: statistics?.views_facebook || 0, color: COLORS.facebook },
    { name: 'Instagram', value: statistics?.views_instagram || 0, color: COLORS.instagram },
  ];

  const engagementData = shareData.map((item, index) => ({
    name: item.name,
    shares: item.value,
    views: viewData[index].value,
    color: item.color,
  }));

  const totalShares = shareData.reduce((acc, item) => acc + item.value, 0);
  const totalViews = viewData.reduce((acc, item) => acc + item.value, 0);
  const engagementRate = totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 pt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compartilhamentos</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">Todas as plataformas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Todas as plataformas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}%</div>
            <p className="text-xs text-muted-foreground">Compartilhamentos/Visualizações</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhamentos por Plataforma
            </CardTitle>
            <CardDescription>Distribuição de compartilhamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shareData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizações por Plataforma
            </CardTitle>
            <CardDescription>Distribuição de visualizações</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={viewData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {viewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Comparativo de Engajamento
          </CardTitle>
          <CardDescription>Compartilhamentos vs Visualizações por plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="shares" name="Compartilhamentos" fill="#8b5cf6" />
              <Bar dataKey="views" name="Visualizações" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Detalhadas</CardTitle>
          <CardDescription>Métricas completas por plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Plataforma</th>
                  <th className="text-right py-3 px-4">Compartilhamentos</th>
                  <th className="text-right py-3 px-4">Visualizações</th>
                  <th className="text-right py-3 px-4">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {engagementData.map((item) => {
                  const rate = item.views > 0 ? ((item.shares / item.views) * 100).toFixed(1) : '0';
                  return (
                    <tr key={item.name} className="border-b">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{item.shares}</td>
                      <td className="text-right py-3 px-4 font-medium">{item.views}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-bold">
                <tr className="border-t-2">
                  <td className="py-3 px-4">Total</td>
                  <td className="text-right py-3 px-4">{totalShares}</td>
                  <td className="text-right py-3 px-4">{totalViews}</td>
                  <td className="text-right py-3 px-4">{engagementRate}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
