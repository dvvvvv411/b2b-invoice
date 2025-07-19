import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface PDFTemplate {
  id: string;
  name: string;
  slug: string;
  html_content: string;
  footer_html: string;
  template_type: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const usePDFTemplates = () => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  // Load all templates
  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Fehler",
        description: "Templates konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new template
  const createTemplate = async (
    name: string,
    htmlContent: string,
    templateType: string = 'invoice',
    footerContent: string = ''
  ): Promise<PDFTemplate | null> => {
    if (!user) return null;

    try {
      const slug = generateSlug(name);
      
      const { data, error } = await supabase
        .from('pdf_templates')
        .insert({
          name,
          slug,
          html_content: htmlContent,
          footer_html: footerContent,
          template_type: templateType,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Ein Template mit diesem Namen existiert bereits.');
        }
        throw error;
      }

      await loadTemplates();
      toast({
        title: "Template erstellt",
        description: `Template "${name}" wurde erfolgreich erstellt.`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Fehler",
        description: error.message || "Template konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update template
  const updateTemplate = async (
    id: string,
    updates: Partial<Pick<PDFTemplate, 'name' | 'html_content' | 'footer_html' | 'template_type' | 'is_active'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: any = { ...updates };
      
      // Generate new slug if name is being updated
      if (updates.name) {
        updateData.slug = generateSlug(updates.name);
      }

      const { error } = await supabase
        .from('pdf_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Ein Template mit diesem Namen existiert bereits.');
        }
        throw error;
      }

      await loadTemplates();
      return true;
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "Fehler",
        description: error.message || "Template konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete template
  const deleteTemplate = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadTemplates();
      toast({
        title: "Template gelöscht",
        description: "Template wurde erfolgreich gelöscht.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Fehler",
        description: "Template konnte nicht gelöscht werden.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Auto-save template
  const autoSaveTemplate = async (id: string, htmlContent: string, footerContent?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: any = { html_content: htmlContent };
      if (footerContent !== undefined) {
        updateData.footer_html = footerContent;
      }

      const { error } = await supabase
        .from('pdf_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error auto-saving template:', error);
      return false;
    }
  };

  // Load templates on mount and user change
  useEffect(() => {
    if (user) {
      loadTemplates();
    } else {
      setTemplates([]);
      setLoading(false);
    }
  }, [user]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    autoSaveTemplate,
    loadTemplates,
  };
};