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
import { Kanzlei, useDeleteKanzlei } from '@/hooks/useKanzleien';
import { Search, Edit, Trash2, Building2, Phone, Mail, Globe } from 'lucide-react';

interface KanzleienTableProps {
  kanzleien: Kanzlei[];
  isLoading: boolean;
  onEdit: (kanzlei: Kanzlei) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function KanzleienTable({ 
  kanzleien, 
  isLoading, 
  onEdit, 
  searchTerm, 
  onSearchChange 
}: KanzleienTableProps) {
  const [deleteKanzleiId, setDeleteKanzleiId] = useState<string | null>(null);
  const deleteKanzlei = useDeleteKanzlei();

  const filteredKanzleien = kanzleien.filter(kanzlei =>
    kanzlei.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kanzlei.stadt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kanzlei.rechtsanwalt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kanzlei.email && kanzlei.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async () => {
    if (deleteKanzleiId) {
      await deleteKanzlei.mutateAsync(deleteKanzleiId);
      setDeleteKanzleiId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass p-6 border-primary/20">
        <div className="space-y-4">
          <div className="h-10 bg-muted/20 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
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
              placeholder="Kanzleien suchen..."
              className="pl-10 bg-background/50 border-border/30"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredKanzleien.length} von {kanzleien.length} Kanzleien
          {searchTerm ? ' (gefiltert)' : ''}
        </div>

        {/* Cards Grid for Mobile, Table for Desktop */}
        {filteredKanzleien.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Keine Kanzleien gefunden' : 'Noch keine Kanzleien hinzugefügt'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredKanzleien.map((kanzlei) => (
                <Card key={kanzlei.id} className="glass p-4 border-border/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {kanzlei.logo_url ? (
                        <img
                          src={kanzlei.logo_url}
                          alt={`${kanzlei.name} Logo`}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{kanzlei.name}</h3>
                        <p className="text-sm text-muted-foreground">{kanzlei.stadt}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:neon-glow-green"
                        onClick={() => onEdit(kanzlei)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:neon-glow-purple text-destructive hover:text-destructive"
                        onClick={() => setDeleteKanzleiId(kanzlei.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{kanzlei.rechtsanwalt}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{kanzlei.telefon}</span>
                    </div>
                    {kanzlei.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{kanzlei.email}</span>
                      </div>
                    )}
                    {kanzlei.website && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={kanzlei.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-glow"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Logo</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Stadt</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Rechtsanwalt</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Telefon</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">E-Mail</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKanzleien.map((kanzlei) => (
                    <tr 
                      key={kanzlei.id} 
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        {kanzlei.logo_url ? (
                          <img
                            src={kanzlei.logo_url}
                            alt={`${kanzlei.name} Logo`}
                            className="w-10 h-10 object-contain rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {kanzlei.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {kanzlei.stadt}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {kanzlei.rechtsanwalt}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {kanzlei.telefon}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {kanzlei.email ? (
                          <a 
                            href={`mailto:${kanzlei.email}`}
                            className="text-primary hover:text-primary-glow"
                          >
                            {kanzlei.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:neon-glow-green"
                            onClick={() => onEdit(kanzlei)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:neon-glow-purple text-destructive hover:text-destructive"
                            onClick={() => setDeleteKanzleiId(kanzlei.id)}
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
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKanzleiId} onOpenChange={() => setDeleteKanzleiId(null)}>
        <AlertDialogContent className="glass border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-primary">
              Kanzlei löschen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sind Sie sicher, dass Sie diese Kanzlei löschen möchten? 
              Das Logo wird ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
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