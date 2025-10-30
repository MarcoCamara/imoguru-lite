import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContactRequest {
  id: string;
  company_id: string;
  property_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  archived?: boolean;
  properties: { title: string } | null;
}

export default function ContactRequestsManager() {
  const { user } = useAuth();
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const fetchContactRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_contact_requests')
        .select(`
          id, company_id, property_id, name, email, phone, message, responded_at, responded_by, created_at, archived,
          properties (title)
        `)
        .eq('archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContactRequests(data as ContactRequest[] || []);
    } catch (err: any) {
      console.error('Error fetching contact requests:', err.message);
      setError('Erro ao carregar solicitações de contato.');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as solicitações de contato.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContactRequests();
    }
  }, [user, showArchived]);

  const handleRespondedChange = async (requestId: string, isChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('public_contact_requests')
        .update({
          responded_at: isChecked ? new Date().toISOString() : null,
          responded_by: isChecked ? user?.id : null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: isChecked ? 'Solicitação marcada como respondida.' : 'Solicitação desmarcada como respondida.',
      });
      fetchContactRequests(); // Recarregar para atualizar o estado
    } catch (err: any) {
      console.error('Error updating responded status:', err.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da solicitação.',
        variant: 'destructive',
      });
    }
  };

  const calculateResponseTime = (createdAt: string, respondedAt: string | null) => {
    if (!respondedAt) return '-';
    const created = parseISO(createdAt);
    const responded = parseISO(respondedAt);
    const diff = Math.abs(responded.getTime() - created.getTime()); // Diferença em milissegundos

    // Converter para minutos, horas, dias para melhor leitura
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ${minutes % 60} min`;
    const days = Math.floor(hours / 24);
    return `${days} d ${hours % 24} h`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(contactRequests.map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, requestId]);
    } else {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos uma solicitação para deletar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_contact_requests')
        .delete()
        .in('id', selectedRequests);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedRequests.length} solicitação(ões) deletada(s) com sucesso.`,
      });
      setSelectedRequests([]);
      fetchContactRequests();
    } catch (err: any) {
      console.error('Error deleting contact requests:', err.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar as solicitações.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos uma solicitação para arquivar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_contact_requests')
        .update({ archived: true })
        .in('id', selectedRequests);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedRequests.length} solicitação(ões) arquivada(s) com sucesso.`,
      });
      setSelectedRequests([]);
      fetchContactRequests();
    } catch (err: any) {
      console.error('Error archiving contact requests:', err.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar as solicitações.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos uma solicitação para restaurar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_contact_requests')
        .update({ archived: false })
        .in('id', selectedRequests);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedRequests.length} solicitação(ões) restaurada(s) com sucesso.`,
      });
      setSelectedRequests([]);
      fetchContactRequests();
    } catch (err: any) {
      console.error('Error restoring contact requests:', err.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar as solicitações.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <Card className="p-6 text-center">Carregando solicitações...</Card>;
  }

  if (error) {
    return <Card className="p-6 text-center text-red-500">Erro: {error}</Card>;
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Solicitações de Contato</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowArchived(!showArchived);
                  setSelectedRequests([]);
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? "Ver Ativas" : "Ver Arquivadas"}
              </Button>
              {selectedRequests.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar ({selectedRequests.length})
                  </Button>
                  {!showArchived ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveSelected}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar ({selectedRequests.length})
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreSelected}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restaurar ({selectedRequests.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contactRequests.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma solicitação de contato encontrada.</p>
          ) : (
            <ScrollArea className="w-full" style={{ maxHeight: '600px' }}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRequests.length === contactRequests.length && contactRequests.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>#</TableHead>
                      <TableHead className="min-w-[140px]">Data/Hora</TableHead>
                      <TableHead className="min-w-[180px]">Nome</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Telefone</TableHead>
                      <TableHead className="min-w-[150px]">Imóvel</TableHead>
                      <TableHead className="min-w-[100px]">Tempo de Resposta</TableHead>
                      <TableHead className="text-center min-w-[100px]">Respondida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactRequests.map((request, index) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRequests.includes(request.id)}
                            onCheckedChange={(checked) => handleSelectRequest(request.id, checked === true)}
                          />
                        </TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.phone || '-'}</TableCell>
                        <TableCell>{request.properties?.title || '-'}</TableCell>
                        <TableCell>{calculateResponseTime(request.created_at, request.responded_at)}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={!!request.responded_at}
                            onCheckedChange={(checked) => handleRespondedChange(request.id, checked === true)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
