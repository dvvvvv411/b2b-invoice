import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Rechnungsnummer {
  id: string;
  user_id: string;
  letzte_nummer: number;
  created_at: string;
  updated_at: string;
}

export const useRechnungsnummern = () => {
  return useQuery({
    queryKey: ['rechnungsnummern'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rechnungsnummern')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Rechnungsnummer | null;
    },
  });
};
