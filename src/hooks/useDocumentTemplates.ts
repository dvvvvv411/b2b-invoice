import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentTemplate {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  template_type: 'rechnung' | 'angebot' | 'mahnung' | 'sonstiges';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplateInput {
  name: string;
  template_type: 'rechnung' | 'angebot' | 'mahnung' | 'sonstiges';
}

export const useDocumentTemplates = () => {
  return useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });
};

export const useCreateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ templateInput, file }: { templateInput: DocumentTemplateInput; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create template record
      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          user_id: user.id,
          name: templateInput.name,
          file_path: fileName,
          template_type: templateInput.template_type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_templates'] });
      toast({
        title: 'Erfolg',
        description: 'Vorlage erfolgreich hochgeladen',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Hochladen der Vorlage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DocumentTemplateInput & { is_active: boolean }> }) => {
      const { data, error } = await supabase
        .from('document_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_templates'] });
      toast({
        title: 'Erfolg',
        description: 'Vorlage erfolgreich aktualisiert',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Aktualisieren der Vorlage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get template to delete file from storage
      const { data: template } = await supabase
        .from('document_templates')
        .select('file_path')
        .eq('id', id)
        .single();

      if (template) {
        await supabase.storage
          .from('document-templates')
          .remove([template.file_path]);
      }

      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_templates'] });
      toast({
        title: 'Erfolg',
        description: 'Vorlage erfolgreich gelöscht',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Löschen der Vorlage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
