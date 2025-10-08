import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NearbyPointsFormProps {
  propertyId?: string;
}

export default function NearbyPointsForm({ propertyId }: NearbyPointsFormProps) {
  const { toast } = useToast();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPoint, setNewPoint] = useState({
    name: '',
    category: 'escola',
    distance: '',
  });

  useEffect(() => {
    if (propertyId) {
      loadPoints();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const loadPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('nearby_points')
        .select('*')
        .eq('property_id', propertyId)
        .order('category');

      if (error) throw error;
      setPoints(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pontos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!propertyId) {
      toast({
        title: 'Salve o imóvel primeiro',
        description: 'É necessário salvar o imóvel antes de adicionar pontos próximos.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPoint.name || !newPoint.distance) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e a distância.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('nearby_points').insert([
        {
          property_id: propertyId,
          ...newPoint,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Ponto adicionado!',
      });

      setNewPoint({ name: '', category: 'escola', distance: '' });
      loadPoints();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('nearby_points').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Ponto removido!',
      });

      loadPoints();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!propertyId) {
    return (
      <div className="pt-4 text-center text-muted-foreground">
        Salve o imóvel primeiro para adicionar pontos de interesse próximos.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Adicionar Ponto de Interesse</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor="point_name">Nome</Label>
              <Input
                id="point_name"
                value={newPoint.name}
                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                placeholder="Ex: Shopping Center"
              />
            </div>

            <div>
              <Label htmlFor="point_category">Categoria</Label>
              <Select
                value={newPoint.category}
                onValueChange={(value) => setNewPoint({ ...newPoint, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="escola">Escola</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="supermercado">Supermercado</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="lazer">Lazer</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="point_distance">Distância</Label>
              <Input
                id="point_distance"
                value={newPoint.distance}
                onChange={(e) => setNewPoint({ ...newPoint, distance: e.target.value })}
                placeholder="Ex: 500m"
              />
            </div>
          </div>

          <Button onClick={handleAdd} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {points.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum ponto de interesse cadastrado ainda.
          </p>
        ) : (
          points.map((point) => (
            <Card key={point.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{point.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {point.category} • {point.distance}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(point.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
