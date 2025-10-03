
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Kunde, KundeInput, useCreateKunde, useUpdateKunde } from '@/hooks/useKunden';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const kundeSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  plz: z.string()
    .min(5, 'PLZ muss mindestens 5 Zeichen haben')
    .max(5, 'PLZ darf maximal 5 Zeichen haben')
    .regex(/^\d+$/, 'PLZ darf nur Zahlen enthalten'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  geschaeftsfuehrer: z.string().min(1, 'Geschäftsführer ist erforderlich'),
});

interface KundenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kunde?: Kunde;
}

export function KundenForm({ open, onOpenChange, kunde }: KundenFormProps) {
  const createKunde = useCreateKunde();
  const updateKunde = useUpdateKunde();
  const { toast } = useToast();
  
  const isEditing = !!kunde;
  const isLoading = createKunde.isPending || updateKunde.isPending;

  const [quickAddText, setQuickAddText] = useState('');

  const form = useForm<KundeInput>({
    resolver: zodResolver(kundeSchema),
    defaultValues: {
      name: '',
      adresse: '',
      plz: '',
      stadt: '',
      geschaeftsfuehrer: '',
    },
  });

  // Reset form when kunde data changes or dialog opens/closes
  useEffect(() => {
    if (open && kunde) {
      // Editing existing kunde - populate with actual values
      form.reset({
        name: kunde.name || '',
        adresse: kunde.adresse || '',
        plz: kunde.plz || '',
        stadt: kunde.stadt || '',
        geschaeftsfuehrer: kunde.geschaeftsfuehrer || '',
      });
    } else if (open && !kunde) {
      // Creating new kunde - reset to empty values
      form.reset({
        name: '',
        adresse: '',
        plz: '',
        stadt: '',
        geschaeftsfuehrer: '',
      });
      setQuickAddText('');
    }
  }, [open, kunde, form]);

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

    // PLZ und Stadt trennen (z.B. "70629 Stuttgart-Flughafen")
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

    // Formular befüllen
    form.setValue('name', name);
    form.setValue('adresse', adresse);
    form.setValue('plz', plz);
    form.setValue('stadt', stadt);
    form.setValue('geschaeftsfuehrer', geschaeftsfuehrer);

    // Quick Add Text leeren
    setQuickAddText('');

    toast({
      title: 'Erfolg',
      description: 'Daten wurden übernommen!',
    });
  };

  const onSubmit = async (data: KundeInput) => {
    try {
      if (isEditing && kunde) {
        await updateKunde.mutateAsync({ id: kunde.id, kunde: data });
      } else {
        await createKunde.mutateAsync(data);
      }
      
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-2xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary font-orbitron">
            {isEditing ? 'Kunde bearbeiten' : 'Neuer Kunde'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quick Add Section */}
            {!isEditing && (
              <div className="space-y-3 pb-4 border-b border-primary/20">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-gradient-primary">
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
                  Daten übernehmen
                </Button>
              </div>
            )}

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

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="gaming"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
