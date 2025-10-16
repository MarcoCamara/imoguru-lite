-- Create print templates table
CREATE TABLE IF NOT EXISTS public.print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

-- Policies for print templates
CREATE POLICY "Admins can manage print templates"
ON public.print_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view print templates"
ON public.print_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_print_templates_updated_at
BEFORE UPDATE ON public.print_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default print template with QR code support
INSERT INTO public.print_templates (name, content, is_default)
VALUES (
  'Template Padrão de Impressão',
  '<div style="page-break-after: always; padding: 20px; border: 1px solid #ddd;">
    <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-bottom: 20px;">
      <h1 style="color: #8b5cf6; font-size: 24px; margin: 0;">{{title}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Código: {{code}}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div><strong style="color: #666; font-size: 12px;">TIPO:</strong><br>{{property_type}}</div>
      <div><strong style="color: #666; font-size: 12px;">FINALIDADE:</strong><br>{{purpose}}</div>
      <div><strong style="color: #666; font-size: 12px;">LOCALIZAÇÃO:</strong><br>{{city}} - {{state}}</div>
      <div><strong style="color: #666; font-size: 12px;">ENDEREÇO:</strong><br>{{street}}, {{number}}</div>
      <div><strong style="color: #666; font-size: 12px;">DORMITÓRIOS:</strong><br>{{bedrooms}}</div>
      <div><strong style="color: #666; font-size: 12px;">BANHEIROS:</strong><br>{{bathrooms}}</div>
      <div><strong style="color: #666; font-size: 12px;">VAGAS:</strong><br>{{parking_spaces}}</div>
      <div><strong style="color: #666; font-size: 12px;">ÁREA:</strong><br>{{total_area}} m²</div>
      <div><strong style="color: #666; font-size: 12px;">VALOR:</strong><br>R$ {{price}}</div>
      <div><strong style="color: #666; font-size: 12px;">STATUS:</strong><br>{{status}}</div>
    </div>
    
    {{images}}
    
    <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <strong style="color: #666; font-size: 12px;">DESCRIÇÃO:</strong><br>
      <div style="margin-top: 10px;">{{description}}</div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
      <div>{{qrcode}}</div>
      <div style="text-align: right;">
        <div style="font-size: 18px; font-weight: bold;">{{app_name}}</div>
        <div style="font-size: 14px; margin-top: 5px;">{{logo}}</div>
      </div>
    </div>
  </div>',
  true
);