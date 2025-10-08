import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface BasicInfoFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function BasicInfoForm({ formData, setFormData }: BasicInfoFormProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título do Anúncio *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Apartamento 3 quartos no Centro"
          />
        </div>

        <div>
          <Label htmlFor="code">Código do Imóvel</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ex: APT001"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="purpose">Finalidade *</Label>
          <Select
            value={formData.purpose}
            onValueChange={(value) => setFormData({ ...formData, purpose: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
              <SelectItem value="venda_locacao">Venda/Locação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="property_type">Tipo de Imóvel *</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="condition">Condição</Label>
          <Select
            value={formData.condition}
            onValueChange={(value) => setFormData({ ...formData, condition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="em_construcao">Em Construção</SelectItem>
              <SelectItem value="na_planta">Na Planta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="alugado">Alugado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="construction_year">Ano de Construção</Label>
          <Input
            id="construction_year"
            type="number"
            value={formData.construction_year || ''}
            onChange={(e) => setFormData({ ...formData, construction_year: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Ex: 2020"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva as características e diferenciais do imóvel..."
          rows={6}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="accepts_exchange"
          checked={formData.accepts_exchange}
          onCheckedChange={(checked) => setFormData({ ...formData, accepts_exchange: checked })}
        />
        <Label htmlFor="accepts_exchange" className="cursor-pointer">
          Aceita permuta
        </Label>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="published"
            checked={formData.published}
            onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
          />
          <Label htmlFor="published" className="cursor-pointer">
            Publicado no site
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="published_on_portal"
            checked={formData.published_on_portal}
            onCheckedChange={(checked) => setFormData({ ...formData, published_on_portal: checked })}
          />
          <Label htmlFor="published_on_portal" className="cursor-pointer">
            Publicado em portais
          </Label>
        </div>
      </div>
    </div>
  );
}
