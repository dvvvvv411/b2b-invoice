import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Auto, useDeleteAuto, MARKEN } from '@/hooks/useAutos';
import { formatPrice, formatKilometer, formatDate } from '@/lib/formatters';
import { Search, Edit, Trash2, ArrowUpDown } from 'lucide-react';

interface AutosTableProps {
  autos: Auto[];
  isLoading: boolean;
  onEdit: (auto: Auto) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

type SortField = 'marke' | 'modell' | 'erstzulassung' | 'kilometer' | 'einzelpreis_netto';
type SortDirection = 'asc' | 'desc';

export function AutosTable({ 
  autos, 
  isLoading, 
  onEdit, 
  searchTerm, 
  onSearchChange 
}: AutosTableProps) {
  const [deleteAutoId, setDeleteAutoId] = useState<string | null>(null);
  const [markenFilter, setMarkenFilter] = useState<string>('alle');
  const [sortField, setSortField] = useState<SortField>('marke');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const deleteAuto = useDeleteAuto();

  const filteredAndSortedAutos = useMemo(() => {
    let filtered = autos.filter(auto => {
      const matchesSearch = 
        auto.marke.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auto.modell.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auto.fahrgestell_nr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auto.dekra_bericht_nr.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarke = markenFilter === 'alle' || auto.marke === markenFilter;

      return matchesSearch && matchesMarke;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null values
      if (aValue === null) aValue = sortDirection === 'asc' ? Number.MIN_VALUE : Number.MAX_VALUE;
      if (bValue === null) bValue = sortDirection === 'asc' ? Number.MIN_VALUE : Number.MAX_VALUE;

      // Convert dates to timestamps for comparison
      if (sortField === 'erstzulassung') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [autos, searchTerm, markenFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async () => {
    if (deleteAutoId) {
      await deleteAuto.mutateAsync(deleteAutoId);
      setDeleteAutoId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass p-6 border-primary/20">
        <div className="space-y-4">
          <div className="h-10 bg-muted/20 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-primary transition-colors"
    >
      <span>{children}</span>
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <>
      <Card className="glass p-6 border-primary/20">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Autos suchen (Marke, Modell, FIN, DEKRA-Nr.)..."
              className="pl-10 bg-background/50 border-border/30"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <Select value={markenFilter} onValueChange={setMarkenFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Marke filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Marken</SelectItem>
              {MARKEN.map((marke) => (
                <SelectItem key={marke} value={marke}>
                  {marke}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredAndSortedAutos.length} von {autos.length} Autos
          {searchTerm || markenFilter !== 'alle' ? ' (gefiltert)' : ''}
        </div>

        {/* Table */}
        {filteredAndSortedAutos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm || markenFilter !== 'alle' ? 'Keine Autos gefunden' : 'Noch keine Autos hinzugefügt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    <SortButton field="marke">Marke</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    <SortButton field="modell">Modell</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Fahrgestell-Nr.</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">DEKRA-Nr.</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    <SortButton field="erstzulassung">Erstzulassung</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    <SortButton field="kilometer">Kilometer</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    <SortButton field="einzelpreis_netto">Preis</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAutos.map((auto) => (
                  <tr 
                    key={auto.id} 
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {auto.marke}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {auto.modell}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {auto.fahrgestell_nr}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {auto.dekra_bericht_nr}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(auto.erstzulassung)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatKilometer(auto.kilometer)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-semibold">
                      {formatPrice(auto.einzelpreis_netto)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-green"
                          onClick={() => onEdit(auto)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-purple text-destructive hover:text-destructive"
                          onClick={() => setDeleteAutoId(auto.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAutoId} onOpenChange={() => setDeleteAutoId(null)}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-primary">
              Auto löschen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sind Sie sicher, dass Sie dieses Auto löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}