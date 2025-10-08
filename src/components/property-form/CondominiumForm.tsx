import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CondominiumFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function CondominiumForm({ formData, setFormData }: CondominiumFormProps) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('name');

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error('Error loading amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenityName: string) => {
    const current = formData.condo_amenities || [];
    const updated = current.includes(amenityName)
      ? current.filter((a: string) => a !== amenityName)
      : [...current, amenityName];
    setFormData({ ...formData, condo_amenities: updated });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="condo_name">Nome do Condomínio</Label>
          <Input
            id="condo_name"
            value={formData.condo_name}
            onChange={(e) => setFormData({ ...formData, condo_name: e.target.value })}
            placeholder="Ex: Residencial Vista Verde"
          />
        </div>

        <div>
          <Label htmlFor="condo_units">Unidades</Label>
          <Input
            id="condo_units"
            type="number"
            min="0"
            value={formData.condo_units || ''}
            onChange={(e) => setFormData({ ...formData, condo_units: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Total de unidades"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="condo_floors">Andares</Label>
        <Input
          id="condo_floors"
          type="number"
          min="0"
          value={formData.condo_floors || ''}
          onChange={(e) => setFormData({ ...formData, condo_floors: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="Total de andares"
          className="md:w-1/3"
        />
      </div>

      <div>
        <Label className="mb-3 block">Comodidades do Condomínio</Label>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={(formData.condo_amenities || []).includes(amenity.name)}
                  onCheckedChange={() => toggleAmenity(amenity.name)}
                />
                <Label htmlFor={`amenity-${amenity.id}`} className="cursor-pointer text-sm">
                  {amenity.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
