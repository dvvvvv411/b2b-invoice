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
import { Spedition, useDeleteSpedition } from '@/hooks/useSpeditionen';
import { Search, Edit, Trash2 } from 'lucide-react';

interface SpeditionenTableProps {
  speditionen: Spedition[];
  isLoading: boolean;
  onEdit: (spedition: Spedition) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SpeditionenTable({ 
  speditionen, 
  isLoading, 
  onEdit, 
  searchTerm, 
  onSearchChange 
}: SpeditionenTableProps) {
  const [deleteSpeditionId, setDeleteSpeditionId] = useState<string | null>(null);
  const deleteSpedition = useDeleteSpedition();

  const filteredSpeditionen = speditionen.filter(spedition =>
    spedition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spedition.stadt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spedition.strasse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spedition.plz.includes(searchTerm)
  );

  const handleDelete = async () => {
    if (deleteSpeditionId) {
      await deleteSpedition.mutateAsync(deleteSpeditionId);
      setDeleteSpeditionId(null);
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
              placeholder="Speditionen suchen..."
              className="pl-10 bg-background/50 border-border/30"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {filteredSpeditionen.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Keine Speditionen gefunden' : 'Noch keine Speditionen hinzugefügt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Adresse</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Stadt</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpeditionen.map((spedition) => (
                  <tr 
                    key={spedition.id} 
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {spedition.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {spedition.strasse}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {spedition.plz} {spedition.stadt}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-green"
                          onClick={() => onEdit(spedition)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-purple text-destructive hover:text-destructive"
                          onClick={() => setDeleteSpeditionId(spedition.id)}
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
      <AlertDialog open={!!deleteSpeditionId} onOpenChange={() => setDeleteSpeditionId(null)}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-primary">
              Spedition löschen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sind Sie sicher, dass Sie diese Spedition löschen möchten? 
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