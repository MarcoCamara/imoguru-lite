import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2 } from 'lucide-react';
import { fetchCEP, formatCEP } from '@/lib/cepUtils';
import { MARITAL_STATUS_OPTIONS } from '@/lib/propertyConstants';
import { toast } from 'sonner';
import SpouseForm from './SpouseForm';
import PartnersForm from './PartnersForm';
import { supabase } from '@/integrations/supabase/client';

interface OwnerFormExpandedProps {
  formData: any;
  setFormData: (data: any) => void;
  propertyId?: string;
}

export default function OwnerFormExpanded({ formData, setFormData, propertyId }: OwnerFormExpandedProps) {
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [spouseData, setSpouseData] = useState<any>({});
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingSpouse, setLoadingSpouse] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (propertyId) {
      loadSpouseAndPartners();
    }
  }, [propertyId]);

  const loadSpouseAndPartners = async () => {
    if (!propertyId) return;

    try {
      setLoadingSpouse(true);
      setLoadingPartners(true);

      // Load spouse
      const { data: spouseRes, error: spouseError } = await supabase
        .from('property_spouse')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (!spouseError && spouseRes) {
        setSpouseData(spouseRes);
      }

      // Load partners
      const { data: partnersRes, error: partnersError } = await supabase
        .from('property_partners')
        .select('*')
        .eq('property_id', propertyId);

      if (!partnersError && partnersRes) {
        setPartners(partnersRes);
      }
    } catch (error) {
      console.error('Error loading spouse/partners:', error);
    } finally {
      setLoadingSpouse(false);
      setLoadingPartners(false);
    }
  };

  const saveSpouseAndPartners = async () => {
    if (!propertyId) return;

    try {
      // Save spouse if data exists and marital status requires it
      if (formData.owner_marital_status && ['casado', 'uniao_estavel'].includes(formData.owner_marital_status)) {
        if (spouseData.name) {
          const spouseToSave = { ...spouseData, property_id: propertyId };
          
          if (spouseData.id) {
            await supabase
              .from('property_spouse')
              .update(spouseToSave)
              .eq('id', spouseData.id);
          } else {
            await supabase
              .from('property_spouse')
              .insert([spouseToSave]);
          }
        }
      }

      // Save partners if person is juridical
      if (formData.owner_type === 'juridica' && partners.length > 0) {
        // Delete existing partners
        await supabase
          .from('property_partners')
          .delete()
          .eq('property_id', propertyId);

        // Insert new partners
        const partnersToSave = partners
          .filter(p => p.name)
          .map(p => ({ ...p, property_id: propertyId }));

        if (partnersToSave.length > 0) {
          await supabase
            .from('property_partners')
            .insert(partnersToSave);
        }
      }
    } catch (error) {
      console.error('Error saving spouse/partners:', error);
      toast.error('Erro ao salvar dados do cônjuge/sócios');
    }
  };

  // Call this function when the main form is saved
  useEffect(() => {
    if (propertyId) {
      saveSpouseAndPartners();
    }
  }, [propertyId]);

  const handleOwnerCEPSearch = async () => {
    setSearchingCEP(true);
    try {
      const data = await fetchCEP(formData.owner_cep);
      if (data) {
        setFormData({
          ...formData,
          owner_cep: formatCEP(data.cep),
          owner_street: data.street,
          owner_neighborhood: data.neighborhood,
          owner_city: data.city,
          owner_state: data.state,
        });
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setSearchingCEP(false);
    }
  };

  const showSpouseForm = formData.owner_type === 'fisica' && 
    formData.owner_marital_status && 
    ['casado', 'uniao_estavel'].includes(formData.owner_marital_status);

  const showPartnersForm = formData.owner_type === 'juridica';

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informações do Proprietário</h3>
        
        <div>
          <Label htmlFor="owner_type">Tipo de Pessoa *</Label>
          <Select
            value={formData.owner_type || 'fisica'}
            onValueChange={(value) => setFormData({ ...formData, owner_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_name">Nome Completo / Razão Social</Label>
            <Input
              id="owner_name"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <Label htmlFor="owner_cpf_cnpj">{formData.owner_type === 'juridica' ? 'CNPJ' : 'CPF'}</Label>
            <Input
              id="owner_cpf_cnpj"
              value={formData.owner_cpf_cnpj}
              onChange={(e) => setFormData({ ...formData, owner_cpf_cnpj: e.target.value })}
              placeholder={formData.owner_type === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
            />
          </div>
        </div>

        {formData.owner_type === 'fisica' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner_rg">RG</Label>
              <Input
                id="owner_rg"
                value={formData.owner_rg || ''}
                onChange={(e) => setFormData({ ...formData, owner_rg: e.target.value })}
                placeholder="00.000.000-0"
              />
            </div>

            <div>
              <Label htmlFor="owner_marital_status">Estado Civil</Label>
              <Select
                value={formData.owner_marital_status || ''}
                onValueChange={(value) => setFormData({ ...formData, owner_marital_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_email">E-mail</Label>
            <Input
              id="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="owner_phone">Telefone</Label>
            <Input
              id="owner_phone"
              value={formData.owner_phone}
              onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="owner_whatsapp">WhatsApp</Label>
          <Input
            id="owner_whatsapp"
            value={formData.owner_whatsapp || ''}
            onChange={(e) => setFormData({ ...formData, owner_whatsapp: e.target.value })}
            placeholder="(00) 00000-0000"
            className="md:w-1/2"
          />
        </div>

        <Separator />

        <h4 className="font-semibold">Endereço do Proprietário</h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="owner_cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="owner_cep"
                value={formData.owner_cep || ''}
                onChange={(e) => setFormData({ ...formData, owner_cep: formatCEP(e.target.value) })}
                placeholder="00000-000"
                maxLength={9}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleOwnerCEPSearch}
                disabled={searchingCEP}
              >
                {searchingCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="owner_street">Rua/Avenida</Label>
            <Input
              id="owner_street"
              value={formData.owner_street || ''}
              onChange={(e) => setFormData({ ...formData, owner_street: e.target.value })}
              placeholder="Nome da rua"
            />
          </div>

          <div>
            <Label htmlFor="owner_number">Número</Label>
            <Input
              id="owner_number"
              value={formData.owner_number || ''}
              onChange={(e) => setFormData({ ...formData, owner_number: e.target.value })}
              placeholder="Número"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="owner_complement">Complemento</Label>
            <Input
              id="owner_complement"
              value={formData.owner_complement || ''}
              onChange={(e) => setFormData({ ...formData, owner_complement: e.target.value })}
              placeholder="Apto, Bloco, etc"
            />
          </div>

          <div>
            <Label htmlFor="owner_neighborhood">Bairro</Label>
            <Input
              id="owner_neighborhood"
              value={formData.owner_neighborhood || ''}
              onChange={(e) => setFormData({ ...formData, owner_neighborhood: e.target.value })}
              placeholder="Bairro"
            />
          </div>

          <div>
            <Label htmlFor="owner_city">Cidade</Label>
            <Input
              id="owner_city"
              value={formData.owner_city || ''}
              onChange={(e) => setFormData({ ...formData, owner_city: e.target.value })}
              placeholder="Cidade"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="owner_state">Estado</Label>
          <Input
            id="owner_state"
            value={formData.owner_state || ''}
            onChange={(e) => setFormData({ ...formData, owner_state: e.target.value })}
            placeholder="UF"
            maxLength={2}
            className="md:w-1/4"
          />
        </div>
      </div>

      {showSpouseForm && (
        <>
          <Separator />
          {loadingSpouse ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <SpouseForm spouseData={spouseData} setSpouseData={setSpouseData} />
          )}
        </>
      )}

      {showPartnersForm && (
        <>
          <Separator />
          {loadingPartners ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <PartnersForm partners={partners} setPartners={setPartners} />
          )}
        </>
      )}
    </div>
  );
}
