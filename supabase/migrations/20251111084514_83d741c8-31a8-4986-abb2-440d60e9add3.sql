-- Add docmosis_prefix column to anwaltskanzleien table
ALTER TABLE anwaltskanzleien 
ADD COLUMN docmosis_prefix text;

COMMENT ON COLUMN anwaltskanzleien.docmosis_prefix IS 
'Optionaler Prefix für Docmosis-Templates (z.B. "Solle" wird zu "Solle-Rechnung.docx")';