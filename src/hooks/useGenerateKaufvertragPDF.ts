import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export interface GenerateKaufvertragInput {
  kanzlei_id: string;
  kunde_id: string;
  bankkonto_id: string;
  insolvente_unternehmen_id: string;
  spedition_id: string;
  auto_id: string;
}

const base64ToBlob = (base64: string, type: string = 'application/pdf'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
};

const downloadPDF = (base64: string, filename: string) => {
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

export const useGenerateKaufvertragPDF = () => {
  const { toast } = useToast();
  const [lastRequestData, setLastRequestData] = useState<GenerateKaufvertragInput | null>(null);

  const mutation = useMutation({
    onMutate: (input) => {
      setLastRequestData(input);
      return input;
    },
    mutationFn: async (input: GenerateKaufvertragInput) => {
      const { data, error } = await supabase.functions.invoke('generate-kaufvertrag-pdf', {
        body: input,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Fehler bei der PDF-Generierung');
      }

      if (!data || !data.base64) {
        throw new Error('Keine PDF-Daten erhalten');
      }

      return data;
    },
    onSuccess: (data) => {
      downloadPDF(data.base64, 'Kaufvertrag.pdf');

      toast({
        title: 'Erfolg',
        description: 'Kaufvertrag PDF wurde erfolgreich generiert.',
      });
    },
    onError: (error: any) => {
      console.error('Error generating Kaufvertrag PDF:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Generieren des Kaufvertrag PDF.',
        variant: 'destructive',
      });
    },
  });

  return {
    ...mutation,
    lastRequestData,
  };
};

export const useGenerateKaufvertragJSON = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: GenerateKaufvertragInput) => {
      const { data, error } = await supabase.functions.invoke('generate-kaufvertrag-pdf', {
        body: { ...input, debug: true },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Error fetching Kaufvertrag JSON:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Abrufen der JSON-Daten.',
        variant: 'destructive',
      });
    },
  });
};
