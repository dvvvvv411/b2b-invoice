
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';

const kundeSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  plz: z.string()
    .min(5, 'PLZ muss mindestens 5 Zeichen haben')
    .max(5, 'PLZ darf maximal 5 Zeichen haben')
    .regex(/^\d+$/, 'PLZ darf nur Zahlen enthalten'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  geschaeftsfuehrer: z.string().min(1, 'Geschäftsführer ist erforderlich'),
  aktenzeichen: z.string()
    .min(1, 'Aktenzeichen ist erforderlich')
    .regex(/^AZ\/\d{4}\/\w+$/, 'Format: AZ/0305/XXX'),
  kundennummer: z.string()
    .min(1, 'Kundennummer ist erforderlich')
    .regex(/^\w+\/\d{4}\/IN$/, 'Format: XXX/0745/IN'),
});

interface KundenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kunde?: Kunde;
}

export function KundenForm({ open, onOpenChange, kunde }: KundenFormProps) {
  const createKunde = useCreateKunde();
  const updateKunde = useUpdateKunde();
  
  const isEditing = !!kunde;
  const isLoading = createKunde.isPending || updateKunde.isPending;

  const form = useForm<KundeInput>({
    resolver: zodResolver(kundeSchema),
    defaultValues: {
      name: '',
      adresse: '',
      plz: '',
      stadt: '',
      geschaeftsfuehrer: '',
      aktenzeichen: '',
      kundennummer: '',
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
        aktenzeichen: kunde.aktenzeichen || '',
        kundennummer: kunde.kundennummer || '',
      });
    } else if (open && !kunde) {
      // Creating new kunde - reset to empty values
      form.reset({
        name: '',
        adresse: '',
        plz: '',
        stadt: '',
        geschaeftsfuehrer: '',
        aktenzeichen: '',
        kundennummer: '',
      });
    }
  }, [open, kunde, form]);

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

              <FormField
                control={form.control}
                name="aktenzeichen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktenzeichen *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AZ/0305/001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kundennummer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kundennummer *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MUE/0745/IN" />
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
