import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Share2, Heart, Phone, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatisticsProps {
  propertyId: string;
}

interface Stats {
  shares_whatsapp: number;
  shares_email: number;
  shares_facebook: number;
  shares_instagram: number;
  views_whatsapp: number;
  views_email: number;
  views_facebook: number;
  views_instagram: number;
}

export default function PropertyStatistics({ propertyId }: StatisticsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [propertyId]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('property_statistics')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Carregando estatísticas...</div>;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhuma estatística disponível ainda
        </CardContent>
      </Card>
    );
  }

  const totalShares = stats.shares_whatsapp + stats.shares_email + stats.shares_facebook + stats.shares_instagram;
  const totalViews = stats.views_whatsapp + stats.views_email + stats.views_facebook + stats.views_instagram;

  const shareData = [
    { name: 'WhatsApp', value: stats.shares_whatsapp },
    { name: 'Email', value: stats.shares_email },
    { name: 'Facebook', value: stats.shares_facebook },
    { name: 'Instagram', value: stats.shares_instagram },
  ];

  const viewData = [
    { name: 'WhatsApp', value: stats.views_whatsapp },
    { name: 'Email', value: stats.views_email },
    { name: 'Facebook', value: stats.views_facebook },
    { name: 'Instagram', value: stats.views_instagram },
  ];

  const engagementData = [
    { 
      name: 'WhatsApp',
      compartilhamentos: stats.shares_whatsapp,
      visualizações: stats.views_whatsapp 
    },
    { 
      name: 'Email',
      compartilhamentos: stats.shares_email,
      visualizações: stats.views_email 
    },
    { 
      name: 'Facebook',
      compartilhamentos: stats.shares_facebook,
      visualizações: stats.views_facebook 
    },
    { 
      name: 'Instagram',
      compartilhamentos: stats.shares_instagram,
      visualizações: stats.views_instagram 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compartilhamentos</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Total em todas as plataformas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Total de visualizações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalShares > 0 ? ((totalViews / totalShares) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Visualizações por compartilhamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plataforma Líder</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shareData.reduce((prev, current) => 
                prev.value > current.value ? prev : current
              ).name}
            </div>
            <p className="text-xs text-muted-foreground">
              Mais compartilhamentos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compartilhamentos por Plataforma</CardTitle>
            <CardDescription>Distribuição de compartilhamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shareData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualizações por Plataforma</CardTitle>
            <CardDescription>Alcance por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engajamento Comparativo</CardTitle>
          <CardDescription>Comparação de compartilhamentos e visualizações</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="compartilhamentos" fill="hsl(var(--primary))" />
              <Bar dataKey="visualizações" fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">WhatsApp</span>
                <div className="text-right">
                  <div className="text-sm">{stats.shares_whatsapp} compartilhamentos</div>
                  <div className="text-xs text-muted-foreground">{stats.views_whatsapp} visualizações</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email</span>
                <div className="text-right">
                  <div className="text-sm">{stats.shares_email} compartilhamentos</div>
                  <div className="text-xs text-muted-foreground">{stats.views_email} visualizações</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Facebook</span>
                <div className="text-right">
                  <div className="text-sm">{stats.shares_facebook} compartilhamentos</div>
                  <div className="text-xs text-muted-foreground">{stats.views_facebook} visualizações</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Instagram</span>
                <div className="text-right">
                  <div className="text-sm">{stats.shares_instagram} compartilhamentos</div>
                  <div className="text-xs text-muted-foreground">{stats.views_instagram} visualizações</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Plataforma Mais Eficaz</p>
                  <p className="text-muted-foreground">
                    {shareData.reduce((prev, current) => 
                      prev.value > current.value ? prev : current
                    ).name} lidera em compartilhamentos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Taxa de Conversão</p>
                  <p className="text-muted-foreground">
                    {totalShares > 0 ? ((totalViews / totalShares) * 100).toFixed(1) : '0'}% dos compartilhamentos resultam em visualizações
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Share2 className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Alcance Total</p>
                  <p className="text-muted-foreground">
                    {totalShares + totalViews} interações no total
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
