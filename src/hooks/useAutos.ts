import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Auto {
  id: string;
  marke: string;
  modell: string;
  fahrgestell_nr: string;
  dekra_bericht_nr: string;
  erstzulassung: string | null;
  kilometer: number | null;
  einzelpreis_netto: number | null;
  created_at: string;
  updated_at: string;
}

export interface AutoInput {
  marke: string;
  modell: string;
  fahrgestell_nr: string;
  dekra_bericht_nr: string;
  erstzulassung: string | null;
  kilometer: number | null;
  einzelpreis_netto: number | null;
}

export const MARKEN = [
  'VW',
  'BMW',
  'Mercedes',
  'Audi',
  'MINI',
  'Andere'
] as const;

export const useAutos = () => {
  return useQuery({
    queryKey: ['autos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('autos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Auto[];
    },
  });
};

export const useCreateAuto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auto: AutoInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for duplicate Fahrgestell-Nr
      const { data: existing } = await supabase
        .from('autos')
        .select('id')
        .eq('fahrgestell_nr', auto.fahrgestell_nr)
        .eq('user_id', user.id);

      if (existing && existing.length > 0) {
        throw new Error('Ein Auto mit dieser Fahrgestell-Nr. existiert bereits');
      }

      const { data, error } = await supabase
        .from('autos')
        .insert([{ ...auto, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autos'] });
      toast({
        title: 'Erfolg',
        description: 'Auto wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen des Autos.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAuto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, auto }: { id: string; auto: AutoInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for duplicate Fahrgestell-Nr (excluding current auto)
      const { data: existing } = await supabase
        .from('autos')
        .select('id')
        .eq('fahrgestell_nr', auto.fahrgestell_nr)
        .eq('user_id', user.id)
        .neq('id', id);

      if (existing && existing.length > 0) {
        throw new Error('Ein Auto mit dieser Fahrgestell-Nr. existiert bereits');
      }

      const { data, error } = await supabase
        .from('autos')
        .update(auto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autos'] });
      toast({
        title: 'Erfolg',
        description: 'Auto wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren des Autos.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteAuto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('autos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autos'] });
      toast({
        title: 'Erfolg',
        description: 'Auto wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen des Autos.',
        variant: 'destructive',
      });
    },
  });
};