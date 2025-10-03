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
import { Bankkonto, useDeleteBankkonto } from '@/hooks/useBankkonten';
import { Search, Edit, Trash2 } from 'lucide-react';
import { formatIBAN } from '@/lib/formatters';

interface BankkontenTableProps {
  bankkonten: Bankkonto[];
  isLoading: boolean;
  onEdit: (bankkonto: Bankkonto) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function BankkontenTable({ 
  bankkonten, 
  isLoading, 
  onEdit, 
  searchTerm, 
  onSearchChange 
}: BankkontenTableProps) {
  const [deleteBankkontoId, setDeleteBankkontoId] = useState<string | null>(null);
  const deleteBankkonto = useDeleteBankkonto();

  const filteredBankkonten = bankkonten.filter(bankkonto =>
    bankkonto.kontoname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bankkonto.kontoinhaber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bankkonto.bankname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    bankkonto.iban.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bankkonto.bic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteBankkontoId) {
      await deleteBankkonto.mutateAsync(deleteBankkontoId);
      setDeleteBankkontoId(null);
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
              placeholder="Bankkonten suchen..."
              className="pl-10 bg-background/50 border-border/30"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {filteredBankkonten.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Keine Bankkonten gefunden' : 'Noch keine Bankkonten hinzugefügt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Kontoname</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Kontoinhaber</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Bank</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">IBAN</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">BIC</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredBankkonten.map((bankkonto) => (
                  <tr 
                    key={bankkonto.id} 
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {bankkonto.kontoname}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {bankkonto.kontoinhaber}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {bankkonto.bankname || '-'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {formatIBAN(bankkonto.iban)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                      {bankkonto.bic}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-green"
                          onClick={() => onEdit(bankkonto)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:neon-glow-purple text-destructive hover:text-destructive"
                          onClick={() => setDeleteBankkontoId(bankkonto.id)}
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
      <AlertDialog open={!!deleteBankkontoId} onOpenChange={() => setDeleteBankkontoId(null)}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-primary">
              Bankkonto löschen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sind Sie sicher, dass Sie dieses Bankkonto löschen möchten? 
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