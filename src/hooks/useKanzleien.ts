import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Kanzlei {
  id: string;
  name: string;
  strasse: string;
  plz: string;
  stadt: string;
  rechtsanwalt: string;
  telefon: string;
  fax: string | null;
  email: string | null;
  website: string | null;
  registergericht: string | null;
  register_nr: string | null;
  ust_id: string | null;
  logo_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface KanzleiInput {
  name: string;
  strasse: string;
  plz: string;
  stadt: string;
  rechtsanwalt: string;
  telefon: string;
  fax: string | null;
  email: string | null;
  website: string | null;
  registergericht: string | null;
  register_nr: string | null;
  ust_id: string | null;
  logo_url: string | null;
  is_default?: boolean;
}

export const useKanzleien = () => {
  return useQuery({
    queryKey: ['kanzleien'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('anwaltskanzleien')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Kanzlei[];
    },
  });
};

export const useCreateKanzlei = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (kanzlei: KanzleiInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('anwaltskanzleien')
        .insert([{ ...kanzlei, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzleien'] });
      toast({
        title: 'Erfolg',
        description: 'Kanzlei wurde erfolgreich erstellt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen der Kanzlei.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateKanzlei = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, kanzlei }: { id: string; kanzlei: KanzleiInput }) => {
      const { data, error } = await supabase
        .from('anwaltskanzleien')
        .update(kanzlei)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzleien'] });
      toast({
        title: 'Erfolg',
        description: 'Kanzlei wurde erfolgreich aktualisiert.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Aktualisieren der Kanzlei.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteKanzlei = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get the kanzlei to delete its logo
      const { data: kanzlei } = await supabase
        .from('anwaltskanzleien')
        .select('logo_url')
        .eq('id', id)
        .single();

      // Delete logo from storage if it exists
      if (kanzlei?.logo_url) {
        const logoPath = kanzlei.logo_url.split('/').pop();
        if (logoPath) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.storage
              .from('kanzlei-logos')
              .remove([`${user.id}/${logoPath}`]);
          }
        }
      }

      const { error } = await supabase
        .from('anwaltskanzleien')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzleien'] });
      toast({
        title: 'Erfolg',
        description: 'Kanzlei wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Löschen der Kanzlei.',
        variant: 'destructive',
      });
    },
  });
};

export const useUploadLogo = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Datei muss ein Bild sein');
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        throw new Error('Datei darf maximal 2MB groß sein');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Nur JPG und PNG Dateien sind erlaubt');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kanzlei-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('kanzlei-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Fehler',
        description: error.message || 'Fehler beim Hochladen des Logos.',
        variant: 'destructive',
      });
    },
  });
};

export const useSetDefaultKanzlei = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('anwaltskanzleien')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanzleien'] });
      toast({
        title: 'Erfolg',
        description: 'Standard-Kanzlei wurde gesetzt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Setzen der Standard-Kanzlei.',
        variant: 'destructive',
      });
    },
  });
};