import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Kunde {
  id: string;
  name: string;
  adresse: string;
  plz: string;
  stadt: string;
  geschaeftsfuehrer: string;
  created_at: string;
  updated_at: string;
}

export interface KundeInput {
  name: string;
  adresse: string;
  plz: string;
  stadt: string;
  geschaeftsfuehrer: string;
}

export const useKunden = () => {
  return useQuery({
    queryKey: ['kunden'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('kunden')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Kunde[];
    },
  });
};

export const useCreateKunde = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (kunde: KundeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('kunden')
        .insert([{ ...kunde, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen des Kunden.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateKunde = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, kunde }: { id: string; kunde: KundeInput }) => {
      const { data, error } = await supabase
        .from('kunden')
        .update(kunde)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren des Kunden.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteKunde = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kunden')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen des Kunden.',
        variant: 'destructive',
      });
    },
  });
};