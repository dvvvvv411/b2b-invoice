import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { BestellungenTable } from '@/components/bestellungen/BestellungenTable';
import { BestellungenForm } from '@/components/bestellungen/BestellungenForm';
import { useBestellungen, Bestellung } from '@/hooks/useBestellungen';

export default function Bestellungen() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBestellung, setEditingBestellung] = useState<Bestellung | null>(null);
  
  const { data: bestellungen = [], isLoading, error } = useBestellungen();

  const handleEdit = (bestellung: Bestellung) => {
    setEditingBestellung(bestellung);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBestellung(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingBestellung(null);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-destructive">
          Fehler beim Laden der Bestellungen. Bitte versuchen Sie es später erneut.
        </div>
      </div>
    );
  }

  const totalBestellungen = bestellungen.length;
  const heuteBestellungen = bestellungen.filter(b => {
    const today = new Date();
    const createdDate = new Date(b.created_at);
    return createdDate.toDateString() === today.toDateString();
  }).length;
  const totalFahrzeuge = bestellungen.reduce((sum, b) => sum + b.dekra_nummern.length, 0);

  return (
    <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gradient-primary">Bestellungen</h1>
            <p className="text-muted-foreground mt-2">
              Verwalten Sie Ihre Bestellungen und leiten Sie diese zum Dokumente-Generator weiter
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Neue Bestellung
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Bestellungen</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBestellungen}</div>
            </CardContent>
          </Card>
          <Card className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heute</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heuteBestellungen}</div>
            </CardContent>
          </Card>
          <Card className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Fahrzeuge</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFahrzeuge}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>Bestellungsliste</CardTitle>
            <CardDescription>
              Klicken Sie auf "Zum Generator" um die Bestellung automatisch zu befüllen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BestellungenTable onEdit={handleEdit} />
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <BestellungenForm
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          bestellung={editingBestellung}
        />
      </div>
  );
}
