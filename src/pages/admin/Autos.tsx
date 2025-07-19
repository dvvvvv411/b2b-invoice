import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAutos } from '@/hooks/useAutos';
import { AutosTable } from '@/components/autos/AutosTable';
import { AutoForm } from '@/components/autos/AutoForm';
import { formatPrice } from '@/lib/formatters';
import { Plus, Car, AlertCircle, TrendingUp } from 'lucide-react';
import type { Auto } from '@/hooks/useAutos';

const Autos = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState<Auto | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: autos = [], isLoading, error } = useAutos();

  const handleEdit = (auto: Auto) => {
    setEditingAuto(auto);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAuto(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setEditingAuto(undefined);
    }
    setIsFormOpen(open);
  };

  // Calculate stats
  const totalValue = autos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const averageKm = autos.length > 0 
    ? autos.reduce((sum, auto) => sum + (auto.kilometer || 0), 0) / autos.length 
    : 0;
  const todayAdded = autos.filter(auto => {
    const today = new Date().toDateString();
    const created = new Date(auto.created_at).toDateString();
    return today === created;
  }).length;

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Fehler beim Laden</h2>
          <p className="text-muted-foreground">
            Die Auto-Daten konnten nicht geladen werden.
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
          <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20">
            <Car className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">
              Autos
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Fahrzeugdaten
            </p>
          </div>
        </div>
        
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Auto
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Autos</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {autos.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-secondary/20">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamtwert</p>
                <p className="text-lg font-bold text-gradient-secondary">
                  {formatPrice(totalValue)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-neon-green/20">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-sm text-muted-foreground">Ø Kilometer</p>
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
                  {new Intl.NumberFormat('de-DE').format(Math.round(averageKm))}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Neue heute</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {todayAdded}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <AutosTable
        autos={autos}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Form Modal */}
      <AutoForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        auto={editingAuto}
      />
    </div>
  );
};

export default Autos;