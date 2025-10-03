import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Auto, AutoInput, useCreateAuto, useUpdateAuto, MARKEN } from '@/hooks/useAutos';
import { parseFormattedNumber } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const autoSchema = z.object({
  marke: z.string().min(1, 'Marke ist erforderlich'),
  modell: z.string().min(1, 'Modell ist erforderlich'),
  fahrgestell_nr: z.string().min(1, 'Fahrgestell-Nr. ist erforderlich'),
  dekra_bericht_nr: z.string().min(1, 'DEKRA Bericht-Nr. ist erforderlich'),
  erstzulassung: z.date().optional(),
  kilometer: z.number().min(0, 'Kilometer muss positiv sein').optional(),
  einzelpreis_netto: z.number().min(0, 'Preis muss positiv sein').optional(),
});

type AutoFormData = z.infer<typeof autoSchema>;

interface AutoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auto?: Auto;
}

export function AutoForm({ open, onOpenChange, auto }: AutoFormProps) {
  const createAuto = useCreateAuto();
  const updateAuto = useUpdateAuto();
  const { toast } = useToast();
  
  const isEditing = !!auto;
  const isLoading = createAuto.isPending || updateAuto.isPending;

  const [bulkUploadText, setBulkUploadText] = useState('');
  const [bulkUploadMode, setBulkUploadMode] = useState(false);

  const form = useForm<AutoFormData>({
    resolver: zodResolver(autoSchema),
    defaultValues: {
      marke: '',
      modell: '',
      fahrgestell_nr: '',
      dekra_bericht_nr: '',
      erstzulassung: undefined,
      kilometer: undefined,
      einzelpreis_netto: undefined,
    },
  });

  // Reset form when dialog opens with or without existing data
  useEffect(() => {
    if (open) {
      setBulkUploadMode(false);
      setBulkUploadText('');
      
      if (auto) {
        // Editing existing auto - populate with existing data
        form.reset({
          marke: auto.marke,
          modell: auto.modell,
          fahrgestell_nr: auto.fahrgestell_nr,
          dekra_bericht_nr: auto.dekra_bericht_nr,
          erstzulassung: auto.erstzulassung ? new Date(auto.erstzulassung) : undefined,
          kilometer: auto.kilometer || undefined,
          einzelpreis_netto: auto.einzelpreis_netto || undefined,
        });
      } else {
        // Creating new auto - reset to empty values
        form.reset({
          marke: '',
          modell: '',
          fahrgestell_nr: '',
          dekra_bericht_nr: '',
          erstzulassung: undefined,
          kilometer: undefined,
          einzelpreis_netto: undefined,
        });
      }
    }
  }, [open, auto, form]);

  const onSubmit = async (data: AutoFormData) => {
    try {
      const autoInput: AutoInput = {
        marke: data.marke,
        modell: data.modell,
        fahrgestell_nr: data.fahrgestell_nr,
        dekra_bericht_nr: data.dekra_bericht_nr,
        erstzulassung: data.erstzulassung ? data.erstzulassung.toISOString().split('T')[0] : null,
        kilometer: data.kilometer || null,
        einzelpreis_netto: data.einzelpreis_netto || null,
      };

      if (isEditing && auto) {
        await updateAuto.mutateAsync({ id: auto.id, auto: autoInput });
      } else {
        await createAuto.mutateAsync(autoInput);
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    setBulkUploadMode(false);
    setBulkUploadText('');
    onOpenChange(false);
  };

  const parseBulkUpload = async (text: string) => {
    const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Keine Daten zum Import gefunden.',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(':');
      
      if (parts.length !== 7) {
        errorCount++;
        errors.push(`Ungültiges Format: ${line.substring(0, 50)}...`);
        continue;
      }

      try {
        const [marke, modell, fahrgestell_nr, dekra_bericht_nr, erstzulassungStr, kilometerStr, preisStr] = parts;

        // Erstzulassung parsen (MM/YY -> Date)
        const [month, year] = erstzulassungStr.split('/');
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        const erstzulassung = new Date(fullYear, parseInt(month) - 1, 1);

        // Kilometer parsen (Punkt als Tausendertrennzeichen entfernen)
        const kilometer = parseInt(kilometerStr.replace(/\./g, ''));

        // Preis parsen (Komma durch Punkt ersetzen, Punkte entfernen)
        const einzelpreis_netto = parseFloat(preisStr.replace(/\./g, '').replace(',', '.'));

        const autoInput: AutoInput = {
          marke: marke.trim(),
          modell: modell.trim(),
          fahrgestell_nr: fahrgestell_nr.trim(),
          dekra_bericht_nr: dekra_bericht_nr.trim(),
          erstzulassung: erstzulassung.toISOString().split('T')[0],
          kilometer,
          einzelpreis_netto,
        };

        await createAuto.mutateAsync(autoInput);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Fehler bei: ${parts[0]} ${parts[1]} - ${error.message}`);
      }
    }

    // Feedback
    if (successCount > 0) {
      toast({
        title: 'Import abgeschlossen',
        description: `${successCount} Auto(s) erfolgreich importiert. ${errorCount > 0 ? `${errorCount} Fehler.` : ''}`,
      });
    }

    if (errors.length > 0 && errors.length <= 5) {
      // Zeige max. 5 Fehler
      errors.forEach(err => {
        toast({
          title: 'Import-Fehler',
          description: err,
          variant: 'destructive',
        });
      });
    } else if (errors.length > 5) {
      toast({
        title: 'Import-Fehler',
        description: `${errors.length} Fehler aufgetreten. Bitte Format überprüfen.`,
        variant: 'destructive',
      });
    }

    // Aufräumen
    setBulkUploadText('');
    setBulkUploadMode(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-2xl border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gradient-primary font-orbitron">
              {isEditing ? 'Auto bearbeiten' : 'Neues Auto'}
            </DialogTitle>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkUploadMode(!bulkUploadMode)}
              >
                <Upload className="w-4 h-4 mr-2" />
                {bulkUploadMode ? 'Einzeleingabe' : 'Massenupload'}
              </Button>
            )}
          </div>
        </DialogHeader>

        {!isEditing && bulkUploadMode ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-gradient-primary">
                Massenupload - Mehrere Autos auf einmal importieren
              </h3>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-md text-xs font-mono">
              <p className="font-semibold mb-1">Format (pro Zeile):</p>
              <p className="text-muted-foreground">
                Marke:Modell:Fahrgestell-Nr:DEKRA-Nr:Erstzulassung(MM/JJ):Kilometer:Preis
              </p>
              <p className="mt-2 text-muted-foreground">Beispiel:</p>
              <p>BMW:X5 M Competition:WBSJU010709K42232:0993:01/22:79.935:41.230,00</p>
            </div>

            <Textarea
              value={bulkUploadText}
              onChange={(e) => setBulkUploadText(e.target.value)}
              placeholder="Fügen Sie hier die Auto-Daten ein (eine Zeile pro Auto)..."
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                variant="gaming"
                onClick={() => parseBulkUpload(bulkUploadText)}
                disabled={!bulkUploadText.trim() || createAuto.isPending}
              >
                {createAuto.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Upload className="w-4 h-4 mr-2" />
                Import starten ({bulkUploadText.trim().split('\n').filter(l => l.trim()).length} Autos)
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marke"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marke *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Marke auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARKEN.map((marke) => (
                          <SelectItem key={marke} value={marke}>
                            {marke}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modell *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="z.B. Golf, A4, X5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fahrgestell_nr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fahrgestell-Nr. *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="17-stellige FIN" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dekra_bericht_nr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DEKRA Bericht-Nr. *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DEKRA-Bericht Nummer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="erstzulassung"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Erstzulassung</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kilometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometer</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="z.B. 125000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="einzelpreis_netto"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Einzelpreis netto (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="z.B. 15750.00"
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
        )}
      </DialogContent>
    </Dialog>
  );
}
