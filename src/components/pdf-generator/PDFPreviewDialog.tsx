
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { PDFData, generatePDF } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface PDFPreviewDialogProps {
  pdfData: PDFData;
  disabled?: boolean;
}

export function PDFPreviewDialog({ pdfData, disabled }: PDFPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const blob = await generatePDF(pdfData);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('PDF preview error:', error);
      toast({
        title: 'Preview-Fehler',
        description: 'Die PDF-Vorschau konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2"
          disabled={disabled}
          onClick={handlePreview}
        >
          <Eye className="w-4 h-4" />
          <span>Vorschau anzeigen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>PDF Vorschau</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>PDF wird geladen...</span>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-96 border-0"
              title="PDF Vorschau"
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              <p>Klicken Sie auf "Vorschau anzeigen" um das PDF zu laden</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
