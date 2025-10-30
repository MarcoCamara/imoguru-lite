import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShareHistoryEntry {
  id: string;
  shared_at: string;
  platform: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  properties: { title: string; code: string; } | null;
}

const ITEMS_PER_PAGE = 10;

export default function ShareHistoryTable() {
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState<ShareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchShareHistory = async (page: number) => {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('property_share_history')
      .select(
        `
        id,
        shared_at,
        platform,
        contact_name,
        contact_email,
        contact_phone,
        properties ( title, code )
      `,
        { count: 'exact' }
      );

    if (!isAdmin) {
      query = query.eq('shared_by_user_id', user?.id);
    }

    const { data, error, count } = await query
      .order('shared_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching share history:', error);
      setHistory([]);
    } else {
      setHistory(data as ShareHistoryEntry[] || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchShareHistory(currentPage);
    }
  }, [user, currentPage, isAdmin]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Compartilhamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum compartilhamento encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell>{currentPage * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell>{format(new Date(entry.shared_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{entry.properties ? `${entry.properties.title} (${entry.properties.code})` : 'N/A'}</TableCell>
                    <TableCell>{entry.platform}</TableCell>
                    <TableCell>
                      {
                        entry.contact_name || entry.contact_email || entry.contact_phone || 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  Página
                </span>
                <Select
                  value={String(currentPage + 1)}
                  onValueChange={(value) => setCurrentPage(Number(value) - 1)}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={currentPage + 1} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  de {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
