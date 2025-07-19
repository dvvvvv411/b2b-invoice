import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Bankkonto {
  id: string;
  kontoname: string;
  kontoinhaber: string;
  iban: string;
  bic: string;
  created_at: string;
  updated_at: string;
}

export interface BankkontoInput {
  kontoname: string;
  kontoinhaber: string;
  iban: string;
  bic: string;
}

export const useBankkonten = () => {
  return useQuery({
    queryKey: ['bankkonten'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bankkonten')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bankkonto[];
    },
  });
};

export const useCreateBankkonto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bankkonto: BankkontoInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bankkonten')
        .insert([{ ...bankkonto, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankkonten'] });
      toast({
        title: 'Erfolg',
        description: 'Bankkonto wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen des Bankkontos.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBankkonto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, bankkonto }: { id: string; bankkonto: BankkontoInput }) => {
      const { data, error } = await supabase
        .from('bankkonten')
        .update(bankkonto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankkonten'] });
      toast({
        title: 'Erfolg',
        description: 'Bankkonto wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren des Bankkontos.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBankkonto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bankkonten')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankkonten'] });
      toast({
        title: 'Erfolg',
        description: 'Bankkonto wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen des Bankkontos.',
        variant: 'destructive',
      });
    },
  });
};