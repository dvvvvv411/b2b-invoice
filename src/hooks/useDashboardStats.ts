import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parallel queries for all counts
      const [
        kundenResult,
        autosResult,
        kanzleienResult,
        bankkontenResult,
        speditionenResult,
        insolventeResult
      ] = await Promise.all([
        supabase
          .from('kunden')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('autos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('anwaltskanzleien')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('bankkonten')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('speditionen')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('insolvente_unternehmen')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      // Check for errors
      const results = [kundenResult, autosResult, kanzleienResult, bankkontenResult, speditionenResult, insolventeResult];
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return {
        kunden: kundenResult.count || 0,
        autos: autosResult.count || 0,
        kanzleien: kanzleienResult.count || 0,
        bankkonten: bankkontenResult.count || 0,
        speditionen: speditionenResult.count || 0,
        insolventeUnternehmen: insolventeResult.count || 0
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};