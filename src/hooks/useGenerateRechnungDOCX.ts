import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GenerateRechnungInput {
  kanzlei_id: string;
  kunde_id: string;
  bankkonto_id: string;
  insolvente_unternehmen_id: string;
  auto_ids: string[];
}

const base64ToBlob = (base64: string, type: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
};

const downloadDOCX = (base64: string, filename: string) => {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const useGenerateRechnungDOCX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateRechnungInput) => {
      const { data, error } = await supabase.functions.invoke('generate-rechnung-docx', {
        body: input,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Fehler bei der DOCX-Generierung');
      }

      if (!data || !data.base64) {
        throw new Error('Keine DOCX-Daten erhalten');
      }

      return data;
    },
    onSuccess: (data) => {
      // Download DOCX
      downloadDOCX(data.base64, `Rechnung_${data.rechnungsnummer}.docx`);

      // Show success toast
      toast({
        title: 'Rechnung erstellt',
        description: `Rechnung Nr. ${data.rechnungsnummer} wurde erfolgreich als DOCX erstellt und heruntergeladen.`,
      });

      // Invalidate rechnungsnummern query to refresh the counter
      queryClient.invalidateQueries({ queryKey: ['rechnungsnummern'] });
    },
    onError: (error: Error) => {
      console.error('Generate DOCX error:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler bei der DOCX-Generierung. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    },
  });
};
