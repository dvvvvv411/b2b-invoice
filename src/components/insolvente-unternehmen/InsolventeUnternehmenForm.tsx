import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { 
  InsolventesUnternehmen, 
  InsolventesUnternehmenInput, 
  useCreateInsolventesUnternehmen, 
  useUpdateInsolventesUnternehmen 
} from '@/hooks/useInsolventeUnternehmen';
import { Loader2 } from 'lucide-react';

const insolventesUnternehmenSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  amtsgericht: z.string().min(1, 'Amtsgericht ist erforderlich'),
  aktenzeichen: z.string().min(1, 'Aktenzeichen ist erforderlich'),
  handelsregister: z.string().optional().default(''),
  adresse: z.string().optional().default(''),
});

interface InsolventeUnternehmenFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unternehmen?: InsolventesUnternehmen;
}

export function InsolventeUnternehmenForm({ open, onOpenChange, unternehmen }: InsolventeUnternehmenFormProps) {
  const createUnternehmen = useCreateInsolventesUnternehmen();
  const updateUnternehmen = useUpdateInsolventesUnternehmen();
  
  const isEditing = !!unternehmen;
  const isLoading = createUnternehmen.isPending || updateUnternehmen.isPending;

  const form = useForm<InsolventesUnternehmenInput>({
    resolver: zodResolver(insolventesUnternehmenSchema),
    defaultValues: {
      name: unternehmen?.name || '',
      amtsgericht: unternehmen?.amtsgericht || '',
      aktenzeichen: unternehmen?.aktenzeichen || '',
      handelsregister: unternehmen?.handelsregister || '',
      adresse: unternehmen?.adresse || '',
    },
  });

  const onSubmit = async (data: InsolventesUnternehmenInput) => {
    try {
      if (isEditing && unternehmen) {
        await updateUnternehmen.mutateAsync({ id: unternehmen.id, unternehmen: data });
      } else {
        await createUnternehmen.mutateAsync(data);
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
            {isEditing ? 'Insolventes Unternehmen bearbeiten' : 'Neues insolventes Unternehmen'}
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
                      <Input {...field} placeholder="artis GmbH" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amtsgericht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amtsgericht *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Amtsgericht Münster (Westfalen)" />
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
                      <Input {...field} placeholder="Az. 71 IN 1011/24" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handelsregister"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Handelsregister</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Amtsgericht Steinfurt, HRB 11802" />
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
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Bessemerstraße 82, 1 Süd, D-12103 Berlin"
                        className="min-h-[80px]"
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