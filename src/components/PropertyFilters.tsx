import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_CATEGORIES } from '@/lib/propertyConstants';

interface PropertyFiltersProps {
  properties: any[];
  onFilterChange: (filtered: any[]) => void;
}

export default function PropertyFilters({ properties, onFilterChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    purpose: 'all',
    propertyCategory: 'all',
    propertyType: 'all',
    status: 'all',
    condition: 'all',
    city: '',
    state: '',
    condoName: '',
    showArchived: false,
    minBedrooms: 0,
    minSuites: 0,
    minBathrooms: 0,
    minCoveredParking: 0,
    minUncoveredParking: 0,
    minArea: 0,
    maxArea: 10000,
    minUsefulArea: 0,
    maxUsefulArea: 10000,
    minPrice: 0,
    maxPrice: 5000000,
    minYear: 1950,
    maxYear: new Date().getFullYear(),
    acceptsExchange: false,
    publishedOnly: false,
  });

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const applyFilters = () => {
    let filtered = [...properties];

    // Filtrar arquivados
    if (!filters.showArchived) {
      filtered = filtered.filter(p => !p.archived);
    }

    if (filters.purpose !== 'all') {
      filtered = filtered.filter(p => p.purpose === filters.purpose || p.purpose === 'venda_locacao');
    }

    if (filters.propertyCategory !== 'all') {
      filtered = filtered.filter(p => {
        const propertyInfo = PROPERTY_TYPES.find(t => t.value === p.property_type);
        return propertyInfo?.category === filters.propertyCategory;
      });
    }

    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.condition !== 'all') {
      filtered = filtered.filter(p => p.condition === filters.condition);
    }

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter(p => 
        p.state?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.condoName) {
      filtered = filtered.filter(p => 
        p.condo_name?.toLowerCase().includes(filters.condoName.toLowerCase())
      );
    }

    if (filters.acceptsExchange) {
      filtered = filtered.filter(p => p.accepts_exchange === true);
    }

    if (filters.publishedOnly) {
      filtered = filtered.filter(p => p.published === true);
    }

    filtered = filtered.filter(p => 
      p.bedrooms >= filters.minBedrooms &&
      (p.suites || 0) >= filters.minSuites &&
      p.bathrooms >= filters.minBathrooms &&
      (p.covered_parking || 0) >= filters.minCoveredParking &&
      (p.uncovered_parking || 0) >= filters.minUncoveredParking &&
      (p.total_area || 0) >= filters.minArea &&
      (p.total_area || 0) <= filters.maxArea &&
      (p.useful_area || 0) >= filters.minUsefulArea &&
      (p.useful_area || 0) <= filters.maxUsefulArea
    );

    filtered = filtered.filter(p => {
      const price = p.purpose === 'locacao' ? p.rental_price : p.sale_price;
      return (price || 0) >= filters.minPrice && (price || 0) <= filters.maxPrice;
    });

    if (filters.minYear > 1950 || filters.maxYear < new Date().getFullYear()) {
      filtered = filtered.filter(p => 
        p.construction_year >= filters.minYear && p.construction_year <= filters.maxYear
      );
    }

    onFilterChange(filtered);
  };

  const resetFilters = () => {
    setFilters({
      purpose: 'all',
      propertyCategory: 'all',
      propertyType: 'all',
      status: 'all',
      condition: 'all',
      city: '',
      state: '',
      condoName: '',
      showArchived: false,
      minBedrooms: 0,
      minSuites: 0,
      minBathrooms: 0,
      minCoveredParking: 0,
      minUncoveredParking: 0,
      minArea: 0,
      maxArea: 10000,
      minUsefulArea: 0,
      maxUsefulArea: 10000,
      minPrice: 0,
      maxPrice: 5000000,
      minYear: 1950,
      maxYear: new Date().getFullYear(),
      acceptsExchange: false,
      publishedOnly: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros Avançados</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
        <div className="space-y-2">
          <Label>Finalidade</Label>
          <Select
            value={filters.purpose}
            onValueChange={(value) => setFilters({ ...filters, purpose: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={filters.propertyCategory}
            onValueChange={(value) => {
              setFilters({ ...filters, propertyCategory: value, propertyType: 'all' });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PROPERTY_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.propertyType}
            onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Todos</SelectItem>
              {filters.propertyCategory === 'all' 
                ? PROPERTY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))
                : PROPERTY_TYPES.filter(t => t.category === filters.propertyCategory).map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="alugado">Alugado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Condição</Label>
          <Select
            value={filters.condition}
            onValueChange={(value) => setFilters({ ...filters, condition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="em_construcao">Em Construção</SelectItem>
              <SelectItem value="na_planta">Na Planta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            placeholder="Cidade..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Input
            placeholder="UF..."
            value={filters.state}
            maxLength={2}
            onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="space-y-2">
          <Label>Condomínio/Edifício</Label>
          <Input
            placeholder="Nome do condomínio/edifício..."
            value={filters.condoName}
            onChange={(e) => setFilters({ ...filters, condoName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="space-y-2">
          <Label>Dorm. (mín.)</Label>
          <Select
            value={filters.minBedrooms.toString()}
            onValueChange={(value) => setFilters({ ...filters, minBedrooms: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Todos' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Suítes (mín.)</Label>
          <Select
            value={filters.minSuites.toString()}
            onValueChange={(value) => setFilters({ ...filters, minSuites: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Todos' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Banh. (mín.)</Label>
          <Select
            value={filters.minBathrooms.toString()}
            onValueChange={(value) => setFilters({ ...filters, minBathrooms: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Todos' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vagas Cobertas (mín.)</Label>
          <Select
            value={filters.minCoveredParking.toString()}
            onValueChange={(value) => setFilters({ ...filters, minCoveredParking: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Todos' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vagas Descobertas (mín.)</Label>
          <Select
            value={filters.minUncoveredParking.toString()}
            onValueChange={(value) => setFilters({ ...filters, minUncoveredParking: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Todos' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Área Total (m²): {filters.minArea} - {filters.maxArea}</Label>
          <Slider
            min={0}
            max={10000}
            step={50}
            value={[filters.minArea, filters.maxArea]}
            onValueChange={([min, max]) => setFilters({ ...filters, minArea: min, maxArea: max })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Área Útil (m²): {filters.minUsefulArea} - {filters.maxUsefulArea}</Label>
          <Slider
            min={0}
            max={10000}
            step={50}
            value={[filters.minUsefulArea, filters.maxUsefulArea]}
            onValueChange={([min, max]) => setFilters({ ...filters, minUsefulArea: min, maxUsefulArea: max })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            Preço: R$ {filters.minPrice.toLocaleString()} - R$ {filters.maxPrice.toLocaleString()}
          </Label>
          <Slider
            min={0}
            max={5000000}
            step={50000}
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Ano: {filters.minYear} - {filters.maxYear}</Label>
          <Slider
            min={1950}
            max={new Date().getFullYear()}
            step={1}
            value={[filters.minYear, filters.maxYear]}
            onValueChange={([min, max]) => setFilters({ ...filters, minYear: min, maxYear: max })}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showArchived"
            checked={filters.showArchived}
            onCheckedChange={(checked) => setFilters({ ...filters, showArchived: checked as boolean })}
          />
          <Label htmlFor="showArchived" className="cursor-pointer">
            Mostrar arquivados
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="publishedOnly"
            checked={filters.publishedOnly}
            onCheckedChange={(checked) => setFilters({ ...filters, publishedOnly: checked as boolean })}
          />
          <Label htmlFor="publishedOnly" className="cursor-pointer">
            Apenas publicados
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="acceptsExchange"
            checked={filters.acceptsExchange}
            onCheckedChange={(checked) => setFilters({ ...filters, acceptsExchange: checked as boolean })}
          />
          <Label htmlFor="acceptsExchange" className="cursor-pointer">
            Aceita Permuta
          </Label>
        </div>
      </div>
    </div>
  );
}
