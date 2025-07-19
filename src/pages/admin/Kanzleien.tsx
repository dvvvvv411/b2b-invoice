import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useKanzleien } from '@/hooks/useKanzleien';
import { KanzleienTable } from '@/components/kanzleien/KanzleienTable';
import { KanzleiForm } from '@/components/kanzleien/KanzleiForm';
import { Plus, Building2, AlertCircle, Users, Phone, Globe } from 'lucide-react';
import type { Kanzlei } from '@/hooks/useKanzleien';

const Kanzleien = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKanzlei, setEditingKanzlei] = useState<Kanzlei | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: kanzleien = [], isLoading, error } = useKanzleien();

  const handleEdit = (kanzlei: Kanzlei) => {
    setEditingKanzlei(kanzlei);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingKanzlei(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setEditingKanzlei(undefined);
    }
    setIsFormOpen(open);
  };

  // Calculate stats
  const kanzleienWithLogos = kanzleien.filter(k => k.logo_url).length;
  const kanzleienWithEmail = kanzleien.filter(k => k.email).length;
  const kanzleienWithWebsite = kanzleien.filter(k => k.website).length;
  const todayAdded = kanzleien.filter(kanzlei => {
    const today = new Date().toDateString();
    const created = new Date(kanzlei.created_at).toDateString();
    return today === created;
  }).length;

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Fehler beim Laden</h2>
          <p className="text-muted-foreground">
            Die Kanzlei-Daten konnten nicht geladen werden.
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
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">
              Kanzleien
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Anwaltskanzlei-Daten
            </p>
          </div>
        </div>
        
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Kanzlei
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Kanzleien</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {kanzleien.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-secondary/20">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Mit Logo</p>
                <p className="text-2xl font-bold text-gradient-secondary">
                  {kanzleienWithLogos}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-lg border-neon-green/20">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-sm text-muted-foreground">Mit E-Mail</p>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
                  {kanzleienWithEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-lg border-primary/20">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Mit Website</p>
                <p className="text-2xl font-bold text-gradient-primary">
                  {kanzleienWithWebsite}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <KanzleienTable
        kanzleien={kanzleien}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Form Modal */}
      <KanzleiForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        kanzlei={editingKanzlei}
      />
    </div>
  );
};

export default Kanzleien;