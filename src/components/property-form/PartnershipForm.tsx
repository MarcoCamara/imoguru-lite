import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface PartnershipFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function PartnershipForm({ formData, setFormData }: PartnershipFormProps) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <Label className="text-base">Tipo de Captação *</Label>
        <RadioGroup
          value={formData.capture_type || 'propria'}
          onValueChange={(value) => setFormData({ ...formData, capture_type: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="propria" id="propria" />
            <Label htmlFor="propria" className="cursor-pointer font-normal">
              Captação Própria
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="terceiros" id="terceiros" />
            <Label htmlFor="terceiros" className="cursor-pointer font-normal">
              Captação de Terceiros
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="captured_by">Captado por</Label>
        <Input
          id="captured_by"
          value={formData.captured_by || ''}
          onChange={(e) => setFormData({ ...formData, captured_by: e.target.value })}
          placeholder="Nome do corretor/imobiliária que captou o imóvel"
        />
      </div>

      {formData.capture_type === 'propria' && (
        <>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="available_for_partnership"
              checked={formData.available_for_partnership || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, available_for_partnership: checked })
              }
            />
            <Label htmlFor="available_for_partnership" className="cursor-pointer">
              Disponível para Parcerias
            </Label>
          </div>

          {formData.available_for_partnership && (
            <div>
              <Label htmlFor="partnerships_notes">Parcerias Realizadas</Label>
              <Textarea
                id="partnerships_notes"
                value={formData.partnerships_notes || ''}
                onChange={(e) => setFormData({ ...formData, partnerships_notes: e.target.value })}
                placeholder="Anotações sobre parcerias já realizadas com este imóvel..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Registre aqui os corretores e imobiliárias com quem já foi feita parceria
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
