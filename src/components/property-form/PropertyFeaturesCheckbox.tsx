import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PROPERTY_FEATURES } from '@/lib/propertyConstants';

interface PropertyFeaturesCheckboxProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function PropertyFeaturesCheckbox({ formData, setFormData }: PropertyFeaturesCheckboxProps) {
  const toggleFeature = (feature: string) => {
    const currentFeatures = formData.property_features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature];
    
    setFormData({ ...formData, property_features: newFeatures });
  };

  return (
    <div className="space-y-4 pt-4">
      <Label className="text-base">Comodidades do Imóvel</Label>
      <p className="text-sm text-muted-foreground">
        Selecione as comodidades e características internas do imóvel.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROPERTY_FEATURES.map((feature) => (
          <div key={feature} className="flex items-center space-x-2">
            <Checkbox
              id={`feature-${feature}`}
              checked={(formData.property_features || []).includes(feature)}
              onCheckedChange={() => toggleFeature(feature)}
            />
            <label
              htmlFor={`feature-${feature}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {feature}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
