import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { InsolventesUnternehmen, useDeleteInsolventesUnternehmen, useSetDefaultInsolventesUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { Search, Edit, Trash2, Star } from 'lucide-react';

interface InsolventeUnternehmenTableProps {
  unternehmen: InsolventesUnternehmen[];
  isLoading: boolean;
  onEdit: (unternehmen: InsolventesUnternehmen) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function InsolventeUnternehmenTable({ 
  unternehmen, 
  isLoading, 
  onEdit, 
  searchTerm, 
  onSearchChange 
}: InsolventeUnternehmenTableProps) {
  const [deleteUnternehmenId, setDeleteUnternehmenId] = useState<string | null>(null);
  const deleteUnternehmen = useDeleteInsolventesUnternehmen();
  const setDefault = useSetDefaultInsolventesUnternehmen();

  const filteredUnternehmen = unternehmen.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.amtsgericht.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.aktenzeichen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.handelsregister.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.adresse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteUnternehmenId) {
      await deleteUnternehmen.mutateAsync(deleteUnternehmenId);
      setDeleteUnternehmenId(null);
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

  return (
    <>
      <Card className="glass p-6 border-primary/20">
        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Insolvente Unternehmen suchen..."
              className="pl-10 bg-background/50 border-border/30"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {filteredUnternehmen.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Keine insolventen Unternehmen gefunden' : 'Noch keine insolventen Unternehmen hinzugefügt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Amtsgericht</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Aktenzeichen</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Handelsregister</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Standard</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnternehmen.map((company) => (
                  <tr 
                    key={company.id} 
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{company.name}</p>
                        {company.adresse && (
                          <p className="text-sm text-muted-foreground mt-1">{company.adresse}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {company.amtsgericht}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {company.aktenzeichen}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {company.handelsregister || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefault.mutate(company.id)}
                        className={company.is_default ? 'text-yellow-500' : 'text-muted-foreground'}
                        title={company.is_default ? 'Ist Standard' : 'Als Standard setzen'}
                      >
                        <Star className={`w-4 h-4 ${company.is_default ? 'fill-yellow-500' : ''}`} />
                      </Button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-green"
                          onClick={() => onEdit(company)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-purple text-destructive hover:text-destructive"
                          onClick={() => setDeleteUnternehmenId(company.id)}
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
      <AlertDialog open={!!deleteUnternehmenId} onOpenChange={() => setDeleteUnternehmenId(null)}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-primary">
              Insolventes Unternehmen löschen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sind Sie sicher, dass Sie dieses insolvente Unternehmen löschen möchten? 
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