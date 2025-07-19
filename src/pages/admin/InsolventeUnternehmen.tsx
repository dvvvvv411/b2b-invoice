import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { InsolventeUnternehmenForm } from '@/components/insolvente-unternehmen/InsolventeUnternehmenForm';
import { InsolventeUnternehmenTable } from '@/components/insolvente-unternehmen/InsolventeUnternehmenTable';
import { InsolventesUnternehmen } from '@/hooks/useInsolventeUnternehmen';

const InsolventeUnternehmen = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnternehmen, setEditingUnternehmen] = useState<InsolventesUnternehmen | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: unternehmen = [], isLoading } = useInsolventeUnternehmen();

  const handleCreate = () => {
    setEditingUnternehmen(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (unternehmen: InsolventesUnternehmen) => {
    setEditingUnternehmen(unternehmen);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUnternehmen(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Insolvente Unternehmen</h1>
          <p className="text-muted-foreground">Verwalten Sie insolvente Unternehmen</p>
        </div>
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Unternehmen
        </Button>
      </div>

      <InsolventeUnternehmenTable
        unternehmen={unternehmen}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <InsolventeUnternehmenForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        unternehmen={editingUnternehmen}
      />
    </div>
  );
};

export default InsolventeUnternehmen;