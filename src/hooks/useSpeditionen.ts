import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Spedition {
  id: string;
  name: string;
  strasse: string;
  plz_stadt: string;
  is_default: boolean;
  insolventes_unternehmen_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpeditionInput {
  name: string;
  strasse: string;
  plz_stadt: string;
  is_default?: boolean;
  insolventes_unternehmen_id?: string;
}

export const useSpeditionen = () => {
  return useQuery({
    queryKey: ['speditionen'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('speditionen')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as Spedition[];
    },
  });
};

export const useCreateSpedition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (spedition: SpeditionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('speditionen')
        .insert([{ ...spedition, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speditionen'] });
      toast({
        title: 'Erfolg',
        description: 'Spedition wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen der Spedition.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSpedition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, spedition }: { id: string; spedition: SpeditionInput }) => {
      const { data, error } = await supabase
        .from('speditionen')
        .update(spedition)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speditionen'] });
      toast({
        title: 'Erfolg',
        description: 'Spedition wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren der Spedition.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSpedition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('speditionen')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speditionen'] });
      toast({
        title: 'Erfolg',
        description: 'Spedition wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen der Spedition.',
        variant: 'destructive',
      });
    },
  });
};

export const useSetDefaultSpedition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('speditionen')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speditionen'] });
      toast({
        title: 'Erfolg',
        description: 'Standard-Spedition wurde gesetzt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Setzen der Standard-Spedition.',
        variant: 'destructive',
      });
    },
  });
};