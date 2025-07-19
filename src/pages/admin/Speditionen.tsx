import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { SpeditionenForm } from '@/components/speditionen/SpeditionenForm';
import { SpeditionenTable } from '@/components/speditionen/SpeditionenTable';
import { Spedition } from '@/hooks/useSpeditionen';

const Speditionen = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpedition, setEditingSpedition] = useState<Spedition | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: speditionen = [], isLoading } = useSpeditionen();

  const handleCreate = () => {
    setEditingSpedition(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (spedition: Spedition) => {
    setEditingSpedition(spedition);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSpedition(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Speditionen</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Speditionspartner</p>
        </div>
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Spedition
        </Button>
      </div>

      <SpeditionenTable
        speditionen={speditionen}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <SpeditionenForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        spedition={editingSpedition}
      />
    </div>
  );
};

export default Speditionen;