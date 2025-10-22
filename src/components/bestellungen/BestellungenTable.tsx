import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Pencil, Trash2, Search, ArrowRight } from 'lucide-react';
import { useBestellungen, useDeleteBestellung, Bestellung } from '@/hooks/useBestellungen';
import { useAutos } from '@/hooks/useAutos';
import { formatPrice } from '@/lib/formatters';

interface BestellungenTableProps {
  onEdit: (bestellung: Bestellung) => void;
}

export function BestellungenTable({ onEdit }: BestellungenTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: bestellungen = [], isLoading } = useBestellungen();
  const { data: autos = [] } = useAutos();
  const deleteBestellung = useDeleteBestellung();

  // Berechne Gesamtwert inkl. MwSt für eine Bestellung
  const calculateGesamtwert = (bestellung: Bestellung): number => {
    // Finde zugehörige Autos anhand DEKRA-Nummern
    const bestellungsAutos = autos.filter(auto => 
      bestellung.dekra_nummern.includes(auto.dekra_bericht_nr)
    );

    // Summiere Nettopreise
    const summeNetto = bestellungsAutos.reduce((sum, auto) => {
      return sum + (auto.einzelpreis_netto || 0);
    }, 0);

    // Rabatt anwenden
    let summeNachRabatt = summeNetto;
    if (bestellung.rabatt_aktiv && bestellung.rabatt_prozent) {
      summeNachRabatt = summeNetto * (1 - bestellung.rabatt_prozent / 100);
    }

    // MwSt 19% hinzufügen
    const gesamtBrutto = summeNachRabatt * 1.19;

    return gesamtBrutto;
  };

  const filteredBestellungen = bestellungen.filter((bestellung) => {
    const kundeName = bestellung.kunde?.name || '';
    return kundeName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBestellung.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleZumGenerator = (bestellung: Bestellung) => {
    navigate(`/admin/dokumente-erstellen?bestellung=${bestellung.id}&rechnung=true&treuhand=true`);
  };

  if (isLoading) {
    return <div className="text-center py-8">Lade Bestellungen...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kunde suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kunde</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Gesamtwert inkl. MwSt</TableHead>
              <TableHead>Fahrzeuge</TableHead>
              <TableHead>Rabatt</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBestellungen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Keine Bestellungen gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredBestellungen.map((bestellung) => {
                return (
                  <TableRow key={bestellung.id}>
                    <TableCell className="font-medium">
                      {bestellung.kunde?.name || 'Unbekannt'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bestellung.kunde_typ === 'privat' ? 'default' : 'secondary'}>
                        {bestellung.kunde_typ === 'privat' ? 'Privat' : 'Unternehmen'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(calculateGesamtwert(bestellung))}
                    </TableCell>
                    <TableCell>
                      {bestellung.dekra_nummern.length} Fahrzeug{bestellung.dekra_nummern.length !== 1 ? 'e' : ''}
                    </TableCell>
                    <TableCell>
                      {bestellung.rabatt_aktiv && bestellung.rabatt_prozent ? (
                        <Badge variant="outline">{bestellung.rabatt_prozent}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(bestellung.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZumGenerator(bestellung)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Zum Generator
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(bestellung)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(bestellung.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestellung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
