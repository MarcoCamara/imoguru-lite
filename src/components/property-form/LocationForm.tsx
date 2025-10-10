import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { fetchCEP, formatCEP } from '@/lib/cepUtils';
import { toast } from 'sonner';

interface LocationFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function LocationForm({ formData, setFormData }: LocationFormProps) {
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [searchingExactCEP, setSearchingExactCEP] = useState(false);

  const handleCEPSearch = async (cep: string, isExact: boolean = false) => {
    if (isExact) setSearchingExactCEP(true);
    else setSearchingCEP(true);

    try {
      const data = await fetchCEP(cep);
      if (data) {
        if (isExact) {
          setFormData({
            ...formData,
            exact_cep: formatCEP(data.cep),
            exact_street: data.street,
            exact_neighborhood: data.neighborhood,
          });
        } else {
          setFormData({
            ...formData,
            cep: formatCEP(data.cep),
            street: data.street,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
          });
        }
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      if (isExact) setSearchingExactCEP(false);
      else setSearchingCEP(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Endereço para Publicação</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCEPSearch(formData.cep)}
                  disabled={searchingCEP}
                >
                  {searchingCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="street">Rua/Avenida</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Nome da rua"
              />
            </div>

            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="Número"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                placeholder="Apto, Bloco, etc"
              />
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="-23.550520"
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="-46.633308"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Endereço Completo (Privado)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Estas informações não serão exibidas publicamente
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="exact_cep">CEP Completo</Label>
              <div className="flex gap-2">
                <Input
                  id="exact_cep"
                  value={formData.exact_cep}
                  onChange={(e) => setFormData({ ...formData, exact_cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCEPSearch(formData.exact_cep, true)}
                  disabled={searchingExactCEP}
                >
                  {searchingExactCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="exact_street">Rua/Avenida Completa</Label>
              <Input
                id="exact_street"
                value={formData.exact_street}
                onChange={(e) => setFormData({ ...formData, exact_street: e.target.value })}
                placeholder="Nome completo da rua"
              />
            </div>

            <div>
              <Label htmlFor="exact_number">Número</Label>
              <Input
                id="exact_number"
                value={formData.exact_number}
                onChange={(e) => setFormData({ ...formData, exact_number: e.target.value })}
                placeholder="Número"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exact_complement">Complemento</Label>
              <Input
                id="exact_complement"
                value={formData.exact_complement}
                onChange={(e) => setFormData({ ...formData, exact_complement: e.target.value })}
                placeholder="Complemento completo"
              />
            </div>

            <div>
              <Label htmlFor="exact_neighborhood">Bairro</Label>
              <Input
                id="exact_neighborhood"
                value={formData.exact_neighborhood}
                onChange={(e) => setFormData({ ...formData, exact_neighborhood: e.target.value })}
                placeholder="Bairro"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
