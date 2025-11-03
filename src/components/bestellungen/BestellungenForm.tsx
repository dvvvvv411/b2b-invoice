import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateKunde, useUpdateKunde, KundeInput } from '@/hooks/useKunden';
import { useCreateBestellung, useUpdateBestellung, Bestellung } from '@/hooks/useBestellungen';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const bestellungSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  plz: z.string()
    .min(5, 'PLZ muss mindestens 5 Zeichen haben')
    .max(5, 'PLZ darf maximal 5 Zeichen haben')
    .regex(/^\d+$/, 'PLZ darf nur Zahlen enthalten'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  geschaeftsfuehrer: z.string().min(1, 'Geschäftsführer ist erforderlich'),
  dekraNummern: z.string().min(1, 'Mindestens eine DEKRA-Nummer erforderlich'),
  rabattProzent: z.string().optional(),
});

interface BestellungenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bestellung?: Bestellung | null;
}

export function BestellungenForm({ open, onOpenChange, bestellung }: BestellungenFormProps) {
  const createKunde = useCreateKunde();
  const updateKunde = useUpdateKunde();
  const createBestellung = useCreateBestellung();
  const updateBestellung = useUpdateBestellung();
  const { toast } = useToast();
  
  const isEditing = !!bestellung;
  const isLoading = createKunde.isPending || updateKunde.isPending || createBestellung.isPending || updateBestellung.isPending;

  const [quickAddText, setQuickAddText] = useState('');
  const [rabattAktiv, setRabattAktiv] = useState(false);
  const [kundeData, setKundeData] = useState<KundeInput | null>(null);

  const form = useForm<z.infer<typeof bestellungSchema>>({
    resolver: zodResolver(bestellungSchema),
    defaultValues: {
      name: '',
      adresse: '',
      plz: '',
      stadt: '',
      geschaeftsfuehrer: '',
      dekraNummern: '',
      rabattProzent: '',
    },
  });

  // Load kunde data when editing
  useEffect(() => {
    const loadKundeData = async () => {
      if (open && bestellung) {
        const { data: kunde } = await supabase
          .from('kunden')
          .select('*')
          .eq('id', bestellung.kunde_id)
          .single();

        if (kunde) {
          setKundeData(kunde);
          form.reset({
            name: kunde.name || '',
            adresse: kunde.adresse || '',
            plz: kunde.plz || '',
            stadt: kunde.stadt || '',
            geschaeftsfuehrer: kunde.geschaeftsfuehrer || '',
            dekraNummern: bestellung.dekra_nummern.join('\n'),
            rabattProzent: bestellung.rabatt_prozent?.toString() || '',
          });
          setRabattAktiv(bestellung.rabatt_aktiv);
        }
      } else if (open && !bestellung) {
        setKundeData(null);
        form.reset({
          name: '',
          adresse: '',
          plz: '',
          stadt: '',
          geschaeftsfuehrer: '',
          dekraNummern: '',
          rabattProzent: '',
        });
        setQuickAddText('');
        setRabattAktiv(false);
      }
    };

    loadKundeData();
  }, [open, bestellung, form]);

  const parseQuickAddText = (text: string) => {
    const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 4) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie alle 4 Zeilen ein (Name, Adresse, PLZ Stadt, Geschäftsführer)',
        variant: 'destructive',
      });
      return;
    }

    const name = lines[0];
    const adresse = lines[1];
    const plzStadtLine = lines[2];
    const geschaeftsfuehrer = lines[3];

    const plzStadtMatch = plzStadtLine.match(/^(\d{5})\s+(.+)$/);
    
    if (!plzStadtMatch) {
      toast({
        title: 'Fehler',
        description: 'PLZ-Stadt Format ungültig. Bitte Format "12345 Stadt" verwenden.',
        variant: 'destructive',
      });
      return;
    }

    const plz = plzStadtMatch[1];
    const stadt = plzStadtMatch[2];

    form.setValue('name', name);
    form.setValue('adresse', adresse);
    form.setValue('plz', plz);
    form.setValue('stadt', stadt);
    form.setValue('geschaeftsfuehrer', geschaeftsfuehrer);

    setQuickAddText('');

    toast({
      title: 'Erfolg',
      description: 'Daten wurden übernommen!',
    });
  };

  const onSubmit = async (data: z.infer<typeof bestellungSchema>) => {
    try {
      const dekraArray = data.dekraNummern
        .split('\n')
        .map(line => line.trim())
        .map(line => line.replace(/\D/g, '')) // NUR ZAHLEN BEHALTEN
        .filter(line => line.length > 0);

      if (dekraArray.length === 0) {
        toast({
          title: 'Fehler',
          description: 'Bitte geben Sie mindestens eine DEKRA-Nummer ein.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditing && bestellung) {
        // Update kunde data first
        const kundeInput: KundeInput = {
          name: data.name,
          adresse: data.adresse,
          plz: data.plz,
          stadt: data.stadt,
          geschaeftsfuehrer: data.geschaeftsfuehrer,
        };

        await updateKunde.mutateAsync({
          id: bestellung.kunde_id,
          kunde: kundeInput,
        });

        // Then update bestellung
        const kundeTyp: 'privat' | 'unternehmen' = data.name === data.geschaeftsfuehrer ? 'privat' : 'unternehmen';
        
        await updateBestellung.mutateAsync({
          id: bestellung.id,
          bestellung: {
            kunde_id: bestellung.kunde_id,
            kunde_typ: kundeTyp,
            dekra_nummern: dekraArray,
            rabatt_aktiv: rabattAktiv,
            rabatt_prozent: rabattAktiv && data.rabattProzent ? parseFloat(data.rabattProzent) : null,
          },
        });
      } else {
        // Create new kunde first
        const kundeInput: KundeInput = {
          name: data.name,
          adresse: data.adresse,
          plz: data.plz,
          stadt: data.stadt,
          geschaeftsfuehrer: data.geschaeftsfuehrer,
        };

        const newKunde = await createKunde.mutateAsync(kundeInput);
        
        if (!newKunde) {
          toast({
            title: 'Fehler',
            description: 'Kunde konnte nicht erstellt werden.',
            variant: 'destructive',
          });
          return;
        }

        // Determine kunde_typ
        const kundeTyp: 'privat' | 'unternehmen' = data.name === data.geschaeftsfuehrer ? 'privat' : 'unternehmen';

        // Create bestellung with new kunde_id
        await createBestellung.mutateAsync({
          kunde_id: newKunde.id,
          kunde_typ: kundeTyp,
          dekra_nummern: dekraArray,
          rabatt_aktiv: rabattAktiv,
          rabatt_prozent: rabattAktiv && data.rabattProzent ? parseFloat(data.rabattProzent) : null,
        });
      }
      
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    setQuickAddText('');
    setRabattAktiv(false);
    setKundeData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Bestellung bearbeiten' : 'Neue Bestellung'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quick Add Section - nur beim Erstellen */}
            {!isEditing && (
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold">
                    Quick Add - Alle Daten auf einmal einfügen
                  </h3>
                </div>
                
                <Textarea
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder={`Unternehmensname\nAdresse & Hausnummer\nPLZ Stadt\nGeschäftsführer\n\nBeispiel:\nHuT Handling und Transport GmbH\nLuftfrachtzentrum 605/5\n70629 Stuttgart-Flughafen\nSebastian Kossack`}
                  className="min-h-[120px] font-mono text-sm"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => parseQuickAddText(quickAddText)}
                  disabled={!quickAddText.trim()}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Daten übernommen
                </Button>
              </div>
            )}

            {/* Kundendaten */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Kundendaten</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Unternehmensname *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Beispiel GmbH" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adresse & Hausnummer *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Musterstraße 123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" maxLength={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stadt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Berlin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="geschaeftsfuehrer"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Geschäftsführer *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Max Mustermann" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* DEKRA Nummern */}
            <FormField
              control={form.control}
              name="dekraNummern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DEKRA-Nummern *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Eine DEKRA-Nummer pro Zeile"
                      rows={5}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie jede DEKRA-Nummer in einer neuen Zeile ein
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rabatt */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="rabatt"
                  checked={rabattAktiv}
                  onCheckedChange={setRabattAktiv}
                />
                <label htmlFor="rabatt" className="text-sm font-medium cursor-pointer">
                  Rabatt aktivieren
                </label>
              </div>

              {rabattAktiv && (
                <FormField
                  control={form.control}
                  name="rabattProzent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rabatt in %</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="z.B. 10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
