import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerateKaufvertragInput {
  kanzlei_id: string;
  kunde_id: string;
  bankkonto_id: string;
  insolvente_unternehmen_id: string;
  spedition_id: string;
  auto_id: string;
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

export const useGenerateKaufvertragDOCX = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: GenerateKaufvertragInput) => {
      const { data, error } = await supabase.functions.invoke('generate-kaufvertrag-docx', {
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
      downloadDOCX(data.base64, data.filename || 'Kaufvertrag.docx');

      toast({
        title: 'Erfolg',
        description: 'Kaufvertrag DOCX wurde erfolgreich generiert.',
      });
    },
    onError: (error: any) => {
      console.error('Error generating Kaufvertrag DOCX:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Generieren des Kaufvertrag DOCX.',
        variant: 'destructive',
      });
    },
  });
};
