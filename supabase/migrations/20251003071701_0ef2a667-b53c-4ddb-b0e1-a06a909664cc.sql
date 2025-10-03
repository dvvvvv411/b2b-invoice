-- Add bankname column to bankkonten table
ALTER TABLE public.bankkonten
ADD COLUMN bankname text;