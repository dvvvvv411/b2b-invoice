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

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Data is the PDF blob from the edge function
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Kaufvertrag.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

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
