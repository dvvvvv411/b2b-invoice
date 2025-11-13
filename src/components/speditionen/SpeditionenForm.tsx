
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Spedition, SpeditionInput, useCreateSpedition, useUpdateSpedition } from '@/hooks/useSpeditionen';
import { Loader2 } from 'lucide-react';

const speditionSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  strasse: z.string().min(1, 'Straße und Hausnummer ist erforderlich'),
  plz_stadt: z.string()
    .min(1, 'PLZ und Stadt sind erforderlich')
    .regex(/^\d{5}\s+.+$/, 'Format: PLZ (5 Ziffern) Leerzeichen Stadt (z.B. "12345 Berlin")'),
  insolventes_unternehmen_id: z.string().optional(),
});

interface SpeditionenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spedition?: Spedition;
}

export function SpeditionenForm({ open, onOpenChange, spedition }: SpeditionenFormProps) {
  const createSpedition = useCreateSpedition();
  const updateSpedition = useUpdateSpedition();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  
  const isEditing = !!spedition;
  const isLoading = createSpedition.isPending || updateSpedition.isPending;

  const form = useForm<SpeditionInput>({
    resolver: zodResolver(speditionSchema),
    defaultValues: {
      name: '',
      strasse: '',
      plz_stadt: '',
      insolventes_unternehmen_id: '',
    },
  });

  // Reset form when spedition data changes or dialog opens/closes
  useEffect(() => {
    if (open && spedition) {
      // Editing existing spedition - populate with actual values
      form.reset({
        name: spedition.name || '',
        strasse: spedition.strasse || '',
        plz_stadt: spedition.plz_stadt || '',
        insolventes_unternehmen_id: spedition.insolventes_unternehmen_id || '',
      });
    } else if (open && !spedition) {
      // Creating new spedition - reset to empty values
      form.reset({
        name: '',
        strasse: '',
        plz_stadt: '',
        insolventes_unternehmen_id: '',
      });
    }
  }, [open, spedition, form]);

  const onSubmit = async (data: SpeditionInput) => {
    try {
      if (isEditing && spedition) {
        await updateSpedition.mutateAsync({ id: spedition.id, spedition: data });
      } else {
        await createSpedition.mutateAsync(data);
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
            {isEditing ? 'Spedition bearbeiten' : 'Neue Spedition'}
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
                      <Input {...field} placeholder="DHL Express GmbH" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strasse"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Straße und Hausnummer *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Musterstraße 123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plz_stadt"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>PLZ und Stadt *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12345 Berlin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insolventes_unternehmen_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Insolventes Unternehmen (optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Keine Zuordnung" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Keine Zuordnung</SelectItem>
                        {insolventeUnternehmen.map((iu) => (
                          <SelectItem key={iu.id} value={iu.id}>
                            {iu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Diese Spedition wird automatisch verwendet, wenn das Insolvenzpanel für dieses insolvente Unternehmen Dokumente generiert
                    </p>
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
