-- Create storage bucket for kanzlei logos
INSERT INTO storage.buckets (id, name, public) VALUES ('kanzlei-logos', 'kanzlei-logos', true);

-- Create storage policies for kanzlei logos
CREATE POLICY "Users can upload their own kanzlei logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'kanzlei-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own kanzlei logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kanzlei-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own kanzlei logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'kanzlei-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own kanzlei logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'kanzlei-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to logos
CREATE POLICY "Kanzlei logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kanzlei-logos');