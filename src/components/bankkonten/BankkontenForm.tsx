
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
import { Bankkonto, BankkontoInput, useCreateBankkonto, useUpdateBankkonto } from '@/hooks/useBankkonten';
import { Loader2 } from 'lucide-react';

const bankkontoSchema = z.object({
  kontoname: z.string().min(1, 'Kontoname ist erforderlich'),
  kontoinhaber: z.string().min(1, 'Kontoinhaber ist erforderlich'),
  iban: z.string()
    .min(22, 'IBAN muss mindestens 22 Zeichen haben')
    .max(34, 'IBAN darf maximal 34 Zeichen haben')
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'Ungültiges IBAN-Format'),
  bic: z.string()
    .min(8, 'BIC muss mindestens 8 Zeichen haben')
    .max(11, 'BIC darf maximal 11 Zeichen haben')
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Ungültiges BIC-Format'),
});

interface BankkontenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankkonto?: Bankkonto;
}

export function BankkontenForm({ open, onOpenChange, bankkonto }: BankkontenFormProps) {
  const createBankkonto = useCreateBankkonto();
  const updateBankkonto = useUpdateBankkonto();
  
  const isEditing = !!bankkonto;
  const isLoading = createBankkonto.isPending || updateBankkonto.isPending;

  const form = useForm<BankkontoInput>({
    resolver: zodResolver(bankkontoSchema),
    defaultValues: {
      kontoname: '',
      kontoinhaber: '',
      iban: '',
      bic: '',
    },
  });

  // Reset form when bankkonto data changes or dialog opens/closes
  useEffect(() => {
    if (open && bankkonto) {
      // Editing existing bankkonto - populate with actual values
      form.reset({
        kontoname: bankkonto.kontoname || '',
        kontoinhaber: bankkonto.kontoinhaber || '',
        iban: bankkonto.iban || '',
        bic: bankkonto.bic || '',
      });
    } else if (open && !bankkonto) {
      // Creating new bankkonto - reset to empty values
      form.reset({
        kontoname: '',
        kontoinhaber: '',
        iban: '',
        bic: '',
      });
    }
  }, [open, bankkonto, form]);

  const onSubmit = async (data: BankkontoInput) => {
    try {
      if (isEditing && bankkonto) {
        await updateBankkonto.mutateAsync({ id: bankkonto.id, bankkonto: data });
      } else {
        await createBankkonto.mutateAsync(data);
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
            {isEditing ? 'Bankkonto bearbeiten' : 'Neues Bankkonto'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kontoname"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Kontoname *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Geschäftskonto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kontoinhaber"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Kontoinhaber *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Muster GmbH" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DE89370400440532013000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BIC *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="COBADEFFXXX" />
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
