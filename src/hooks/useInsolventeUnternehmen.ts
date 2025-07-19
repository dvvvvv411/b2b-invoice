import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InsolventesUnternehmen {
  id: string;
  name: string;
  amtsgericht: string;
  aktenzeichen: string;
  handelsregister: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}

export interface InsolventesUnternehmenInput {
  name: string;
  amtsgericht: string;
  aktenzeichen: string;
  handelsregister: string;
  adresse: string;
}

export const useInsolventeUnternehmen = () => {
  return useQuery({
    queryKey: ['insolvente_unternehmen'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('insolvente_unternehmen')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InsolventesUnternehmen[];
    },
  });
};

export const useCreateInsolventesUnternehmen = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (unternehmen: InsolventesUnternehmenInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('insolvente_unternehmen')
        .insert([{ ...unternehmen, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insolvente_unternehmen'] });
      toast({
        title: 'Erfolg',
        description: 'Insolventes Unternehmen wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen des insolventen Unternehmens.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateInsolventesUnternehmen = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, unternehmen }: { id: string; unternehmen: InsolventesUnternehmenInput }) => {
      const { data, error } = await supabase
        .from('insolvente_unternehmen')
        .update(unternehmen)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insolvente_unternehmen'] });
      toast({
        title: 'Erfolg',
        description: 'Insolventes Unternehmen wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren des insolventen Unternehmens.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteInsolventesUnternehmen = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('insolvente_unternehmen')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insolvente_unternehmen'] });
      toast({
        title: 'Erfolg',
        description: 'Insolventes Unternehmen wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen des insolventen Unternehmens.',
        variant: 'destructive',
      });
    },
  });
};