import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
    .min(22, 'IBAN muss 22 Zeichen haben')
    .max(22, 'IBAN darf maximal 22 Zeichen haben')
    .regex(/^DE\d{20}$/, 'Deutsche IBAN Format: DE + 20 Ziffern'),
  bic: z.string()
    .min(8, 'BIC muss mindestens 8 Zeichen haben')
    .max(11, 'BIC darf maximal 11 Zeichen haben')
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Ungültiges BIC Format'),
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
      kontoname: bankkonto?.kontoname || '',
      kontoinhaber: bankkonto?.kontoinhaber || '',
      iban: bankkonto?.iban || '',
      bic: bankkonto?.bic || '',
    },
  });

  // Format IBAN with spaces for display
  const formatIban = (value: string) => {
    // Remove all spaces and convert to uppercase
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    // Add spaces every 4 characters
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const onSubmit = async (data: BankkontoInput) => {
    try {
      // Remove spaces from IBAN before submitting
      const cleanedData = {
        ...data,
        iban: data.iban.replace(/\s/g, ''),
        bic: data.bic.toUpperCase(),
      };

      if (isEditing && bankkonto) {
        await updateBankkonto.mutateAsync({ id: bankkonto.id, bankkonto: cleanedData });
      } else {
        await createBankkonto.mutateAsync(cleanedData);
      }
      
      form.reset();
      onOpenChange(false);
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
                      <Input {...field} placeholder="Mustermann GmbH" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>IBAN *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        className="font-mono"
                        onChange={(e) => {
                          const formatted = formatIban(e.target.value);
                          if (formatted.length <= 27) { // DE + 20 digits + 5 spaces
                            field.onChange(formatted);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bic"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>BIC *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="COBADEFFXXX"
                        className="font-mono"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
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