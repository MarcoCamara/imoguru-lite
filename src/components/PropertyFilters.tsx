import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface PropertyFiltersProps {
  properties: any[];
  onFilterChange: (filtered: any[]) => void;
}

export default function PropertyFilters({ properties, onFilterChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    purpose: 'all',
    propertyType: 'all',
    status: 'all',
    city: '',
    showArchived: false,
    minBedrooms: 0,
    minBathrooms: 0,
    minParkingSpaces: 0,
    minArea: 0,
    maxArea: 10000,
    minPrice: 0,
    maxPrice: 5000000,
    minYear: 1950,
    maxYear: new Date().getFullYear(),
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

    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    filtered = filtered.filter(p => 
      p.bedrooms >= filters.minBedrooms &&
      p.bathrooms >= filters.minBathrooms &&
      p.parking_spaces >= filters.minParkingSpaces &&
      (p.total_area || 0) >= filters.minArea &&
      (p.total_area || 0) <= filters.maxArea
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
      propertyType: 'all',
      status: 'all',
      city: '',
      showArchived: false,
      minBedrooms: 0,
      minBathrooms: 0,
      minParkingSpaces: 0,
      minArea: 0,
      maxArea: 10000,
      minPrice: 0,
      maxPrice: 5000000,
      minYear: 1950,
      maxYear: new Date().getFullYear(),
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Label>Tipo de Imóvel</Label>
          <Select
            value={filters.propertyType}
            onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="sobrado">Sobrado</SelectItem>
              <SelectItem value="cobertura">Cobertura</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
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
          <Label>Cidade</Label>
          <Input
            placeholder="Digite a cidade..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showArchived"
          checked={filters.showArchived}
          onCheckedChange={(checked) => setFilters({ ...filters, showArchived: checked as boolean })}
        />
        <Label htmlFor="showArchived" className="cursor-pointer">
          Mostrar imóveis arquivados
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Dormitórios (mín.)</Label>
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
                  {n === 0 ? 'Qualquer' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Banheiros (mín.)</Label>
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
                  {n === 0 ? 'Qualquer' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vagas (mín.)</Label>
          <Select
            value={filters.minParkingSpaces.toString()}
            onValueChange={(value) => setFilters({ ...filters, minParkingSpaces: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n === 0 ? 'Qualquer' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Área Total (m²): {filters.minArea} - {filters.maxArea}+</Label>
          <Slider
            min={0}
            max={10000}
            step={50}
            value={[filters.minArea, filters.maxArea]}
            onValueChange={([min, max]) => setFilters({ ...filters, minArea: min, maxArea: max })}
          />
        </div>

        <div className="space-y-2">
          <Label>
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
          <Label>Ano de Construção: {filters.minYear} - {filters.maxYear}</Label>
          <Slider
            min={1950}
            max={new Date().getFullYear()}
            step={1}
            value={[filters.minYear, filters.maxYear]}
            onValueChange={([min, max]) => setFilters({ ...filters, minYear: min, maxYear: max })}
          />
        </div>
      </div>
    </div>
  );
}
