import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Bestellung {
  id: string;
  user_id: string;
  kunde_id: string;
  kunde_typ: 'privat' | 'unternehmen';
  dekra_nummern: string[];
  rabatt_prozent: number | null;
  rabatt_aktiv: boolean;
  created_at: string;
  updated_at: string;
  kunde?: {
    id: string;
    name: string;
    adresse: string | null;
    plz: string | null;
    stadt: string | null;
    geschaeftsfuehrer: string | null;
  };
}

export interface BestellungInput {
  kunde_id: string;
  kunde_typ: 'privat' | 'unternehmen';
  dekra_nummern: string[];
  rabatt_prozent?: number | null;
  rabatt_aktiv?: boolean;
}

export const useBestellungen = () => {
  return useQuery({
    queryKey: ['bestellungen'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          kunde:kunden(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bestellung[];
    },
  });
};

export const useCreateBestellung = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bestellung: BestellungInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bestellungen')
        .insert([{ ...bestellung, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bestellungen'] });
      toast({
        title: 'Erfolg',
        description: 'Bestellung wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen der Bestellung.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBestellung = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, bestellung }: { id: string; bestellung: BestellungInput }) => {
      const { data, error } = await supabase
        .from('bestellungen')
        .update(bestellung)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bestellungen'] });
      toast({
        title: 'Erfolg',
        description: 'Bestellung wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren der Bestellung.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBestellung = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bestellungen')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bestellungen'] });
      toast({
        title: 'Erfolg',
        description: 'Bestellung wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen der Bestellung.',
        variant: 'destructive',
      });
    },
  });
};
