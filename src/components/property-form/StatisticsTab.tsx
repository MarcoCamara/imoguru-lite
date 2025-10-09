import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const shareStats = [
    { label: 'WhatsApp', value: statistics?.shares_whatsapp || 0, color: 'text-green-600' },
    { label: 'Email', value: statistics?.shares_email || 0, color: 'text-blue-600' },
    { label: 'Facebook', value: statistics?.shares_facebook || 0, color: 'text-blue-500' },
    { label: 'Instagram', value: statistics?.shares_instagram || 0, color: 'text-pink-600' },
  ];

  const viewStats = [
    { label: 'WhatsApp', value: statistics?.views_whatsapp || 0, color: 'text-green-600' },
    { label: 'Email', value: statistics?.views_email || 0, color: 'text-blue-600' },
    { label: 'Facebook', value: statistics?.views_facebook || 0, color: 'text-blue-500' },
    { label: 'Instagram', value: statistics?.views_instagram || 0, color: 'text-pink-600' },
  ];

  const totalShares = shareStats.reduce((acc, stat) => acc + stat.value, 0);
  const totalViews = viewStats.reduce((acc, stat) => acc + stat.value, 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhamentos
            </CardTitle>
            <CardDescription>Total de compartilhamentos por rede social</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">{totalShares}</div>
              <div className="space-y-2">
                {shareStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-sm">{stat.label}</span>
                    <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizações
            </CardTitle>
            <CardDescription>Total de visualizações por rede social</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">{totalViews}</div>
              <div className="space-y-2">
                {viewStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-sm">{stat.label}</span>
                    <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
