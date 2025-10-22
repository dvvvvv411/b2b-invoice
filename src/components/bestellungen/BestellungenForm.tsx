import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKunden } from '@/hooks/useKunden';
import { useCreateBestellung, useUpdateBestellung, Bestellung, BestellungInput } from '@/hooks/useBestellungen';
import { Loader2 } from 'lucide-react';

interface BestellungenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bestellung?: Bestellung | null;
}

export function BestellungenForm({ open, onOpenChange, bestellung }: BestellungenFormProps) {
  const [kundeId, setKundeId] = useState('');
  const [dekraNummern, setDekraNummern] = useState('');
  const [rabattAktiv, setRabattAktiv] = useState(false);
  const [rabattProzent, setRabattProzent] = useState('');

  const { data: kunden = [], isLoading: kundenLoading } = useKunden();
  const createBestellung = useCreateBestellung();
  const updateBestellung = useUpdateBestellung();

  useEffect(() => {
    if (bestellung) {
      setKundeId(bestellung.kunde_id);
      setDekraNummern(bestellung.dekra_nummern.join('\n'));
      setRabattAktiv(bestellung.rabatt_aktiv);
      setRabattProzent(bestellung.rabatt_prozent?.toString() || '');
    } else {
      setKundeId('');
      setDekraNummern('');
      setRabattAktiv(false);
      setRabattProzent('');
    }
  }, [bestellung, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kundeId) {
      return;
    }

    // Find selected kunde
    const selectedKunde = kunden.find(k => k.id === kundeId);
    if (!selectedKunde) return;

    // Determine kunde_typ automatically
    const kundeTyp: 'privat' | 'unternehmen' = selectedKunde.name === selectedKunde.geschaeftsfuehrer ? 'privat' : 'unternehmen';

    // Parse DEKRA numbers
    const dekraArray = dekraNummern
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const bestellungData: BestellungInput = {
      kunde_id: kundeId,
      kunde_typ: kundeTyp,
      dekra_nummern: dekraArray,
      rabatt_aktiv: rabattAktiv,
      rabatt_prozent: rabattAktiv && rabattProzent ? parseFloat(rabattProzent) : null,
    };

    if (bestellung) {
      await updateBestellung.mutateAsync({
        id: bestellung.id,
        bestellung: bestellungData,
      });
    } else {
      await createBestellung.mutateAsync(bestellungData);
    }

    onOpenChange(false);
  };

  const isLoading = createBestellung.isPending || updateBestellung.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {bestellung ? 'Bestellung bearbeiten' : 'Neue Bestellung'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kunde auswählen */}
          <div className="space-y-2">
            <Label htmlFor="kunde">Kunde *</Label>
            <Select value={kundeId} onValueChange={setKundeId} disabled={kundenLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Kunde auswählen" />
              </SelectTrigger>
              <SelectContent>
                {kunden.map((kunde) => (
                  <SelectItem key={kunde.id} value={kunde.id}>
                    {kunde.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kundeId && kunden.find(k => k.id === kundeId) && (
              <p className="text-sm text-muted-foreground">
                Typ: {kunden.find(k => k.id === kundeId)?.name === kunden.find(k => k.id === kundeId)?.geschaeftsfuehrer ? 'Privat' : 'Unternehmen'}
              </p>
            )}
          </div>

          {/* DEKRA Nummern */}
          <div className="space-y-2">
            <Label htmlFor="dekra">DEKRA-Nummern *</Label>
            <Textarea
              id="dekra"
              value={dekraNummern}
              onChange={(e) => setDekraNummern(e.target.value)}
              placeholder="Eine DEKRA-Nummer pro Zeile"
              rows={5}
              required
            />
            <p className="text-sm text-muted-foreground">
              Geben Sie jede DEKRA-Nummer in einer neuen Zeile ein
            </p>
          </div>

          {/* Rabatt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="rabatt"
                checked={rabattAktiv}
                onCheckedChange={setRabattAktiv}
              />
              <Label htmlFor="rabatt" className="cursor-pointer">
                Rabatt aktivieren
              </Label>
            </div>

            {rabattAktiv && (
              <div className="space-y-2">
                <Label htmlFor="prozent">Rabatt in %</Label>
                <Input
                  id="prozent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rabattProzent}
                  onChange={(e) => setRabattProzent(e.target.value)}
                  placeholder="z.B. 10"
                  required={rabattAktiv}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bestellung ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
