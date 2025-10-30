import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function PublicPropertyPage() {
  const { companyDomain, propertyId } = useParams<{ companyDomain: string; propertyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<any | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!companyDomain || !propertyId) {
      setError('Domínio da empresa ou ID do imóvel não fornecidos.');
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        // Primeiro, buscar o ID da empresa pelo domínio
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('domain', companyDomain)
          .single();

        if (companyError || !companyData) {
          throw new Error('Empresa não encontrada.');
        }

        // Em seguida, buscar o imóvel com base no ID da empresa e no ID do imóvel
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            property_images (url, is_cover, display_order)
          `)
          .eq('id', propertyId)
          .eq('company_id', companyData.id)
          .eq('published', true) // Apenas imóveis publicados
          .single();

        if (propertyError) throw propertyError;

        setProperty(propertyData);
      } catch (err: any) {
        console.error('Erro ao buscar imóvel:', err.message);
        setError('Erro ao carregar o imóvel.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [companyDomain, propertyId]);

  const handleContactSubmit = async () => {
    try {
      if (!property?.company_id) {
        throw new Error("ID da empresa não encontrado.");
      }

      const { error } = await supabase.from('public_contact_requests').insert({
        company_id: property.company_id,
        property_id: propertyId,
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sua solicitação de contato foi enviada com sucesso!",
      });
      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '' });
    } catch (err: any) {
      console.error("Erro ao enviar solicitação de contato:", err.message);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua solicitação de contato.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando imóvel...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Erro: {error}</div>;
  }

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center">Imóvel não encontrado.</div>;
  }

  const coverImage = property.property_images.find((img: any) => img.is_cover)?.url || property.property_images[0]?.url;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{property.title} ({property.code})</h1>
        {coverImage && (
          <img src={coverImage} alt={property.title} className="w-full h-96 object-cover rounded-md mb-6" />
        )}
        <p className="text-gray-700 mb-4">{property.description}</p>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <p><strong>Cidade:</strong> {property.city}</p>
          <p><strong>Estado:</strong> {property.state}</p>
          <p><strong>Dormitórios:</strong> {property.bedrooms}</p>
          <p><strong>Banheiros:</strong> {property.bathrooms}</p>
          <p><strong>Vagas:</strong> {property.parking_spaces}</p>
          <p><strong>Área Total:</strong> {property.total_area}m²</p>
        </div>
        <p className="text-2xl font-bold text-primary-600">R$ {property.sale_price?.toLocaleString('pt-BR') || property.rental_price?.toLocaleString('pt-BR')}</p>
        </div>
        <Button onClick={() => setShowContactForm(true)} className="mt-6 w-full">
          Solicitar Contato
        </Button>

        <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Contato</DialogTitle>
              <DialogDescription>
                Preencha o formulário abaixo para entrar em contato sobre este imóvel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Telefone</Label>
                <Input id="phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleContactSubmit}>Enviar Solicitação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
