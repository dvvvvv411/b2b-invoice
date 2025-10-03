import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useKunden } from '@/hooks/useKunden';
import { KundenTable } from '@/components/kunden/KundenTable';
import { KundenForm } from '@/components/kunden/KundenForm';
import { Plus, Users, AlertCircle } from 'lucide-react';
import type { Kunde } from '@/hooks/useKunden';

const Kunden = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKunde, setEditingKunde] = useState<Kunde | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: kunden = [], isLoading, error } = useKunden();

  const handleEdit = (kunde: Kunde) => {
    setEditingKunde(kunde);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingKunde(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setEditingKunde(undefined);
    }
    setIsFormOpen(open);
  };

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Fehler beim Laden</h2>
          <p className="text-muted-foreground">
            Die Kundendaten konnten nicht geladen werden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">
              Kunden
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Kundendaten
            </p>
          </div>
        </div>
        
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Kunden</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {kunden.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-secondary/20">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Neue heute</p>
                <p className="text-2xl font-bold text-gradient-secondary">
                  {kunden.filter(k => {
                    const today = new Date().toDateString();
                    const created = new Date(k.created_at).toDateString();
                    return today === created;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-sm text-muted-foreground">Gefiltert</p>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
                  {searchTerm ? kunden.filter(k =>
                    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    k.stadt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    k.geschaeftsfuehrer.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length : kunden.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <KundenTable
        kunden={kunden}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Form Modal */}
      <KundenForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        kunde={editingKunde}
      />
    </div>
  );
};

export default Kunden;