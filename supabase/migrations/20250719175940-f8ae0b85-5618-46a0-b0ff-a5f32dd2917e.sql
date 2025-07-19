
-- Add footer_html column to pdf_templates table
ALTER TABLE public.pdf_templates 
ADD COLUMN footer_html text DEFAULT '';

-- Update existing templates to have a default footer
UPDATE public.pdf_templates 
SET footer_html = '<div class="pdf-footer">
    {{ KANZLEI_NAME }} | {{ KANZLEI_STRASSE }}, {{ KANZLEI_PLZ }} {{ KANZLEI_STADT }} | 
    Tel: {{ KANZLEI_TELEFON }} | E-Mail: {{ KANZLEI_EMAIL }} | 
    Erstellt am {{ AKTUELLES_DATUM }}
</div>'
WHERE footer_html IS NULL OR footer_html = '';
