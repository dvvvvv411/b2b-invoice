-- Create PDF Templates table
CREATE TABLE public.pdf_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  html_content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'invoice',
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pdf_templates" 
ON public.pdf_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pdf_templates" 
ON public.pdf_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pdf_templates" 
ON public.pdf_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pdf_templates" 
ON public.pdf_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_pdf_templates_updated_at
BEFORE UPDATE ON public.pdf_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();