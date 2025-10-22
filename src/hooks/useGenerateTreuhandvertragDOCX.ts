import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerateTreuhandvertragInput {
  kanzlei_id: string;
  kunde_id: string;
  bankkonto_id: string;
  insolvente_unternehmen_id: string;
  gender: 'M' | 'W';
}

export const useGenerateTreuhandvertragDOCX = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: GenerateTreuhandvertragInput) => {
      const { data, error } = await supabase.functions.invoke('generate-treuhandvertrag-docx', {
        body: input,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.base64 && data.filename) {
        // Convert base64 to blob
        const byteCharacters = atob(data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Treuhandvertrag DOCX erstellt',
          description: `Die Datei "${data.filename}" wurde erfolgreich heruntergeladen.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler beim Erstellen des Treuhandvertrags',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
