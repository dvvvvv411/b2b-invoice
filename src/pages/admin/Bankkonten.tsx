import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useBankkonten } from '@/hooks/useBankkonten';
import { BankkontenForm } from '@/components/bankkonten/BankkontenForm';
import { BankkontenTable } from '@/components/bankkonten/BankkontenTable';
import { Bankkonto } from '@/hooks/useBankkonten';

const Bankkonten = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBankkonto, setEditingBankkonto] = useState<Bankkonto | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: bankkonten = [], isLoading } = useBankkonten();

  const handleCreate = () => {
    setEditingBankkonto(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (bankkonto: Bankkonto) => {
    setEditingBankkonto(bankkonto);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBankkonto(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Bankkonten</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Bankverbindungen</p>
        </div>
        <Button variant="gaming" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Bankkonto
        </Button>
      </div>

      <BankkontenTable
        bankkonten={bankkonten}
        isLoading={isLoading}
        onEdit={handleEdit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <BankkontenForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        bankkonto={editingBankkonto}
      />
    </div>
  );
};

export default Bankkonten;