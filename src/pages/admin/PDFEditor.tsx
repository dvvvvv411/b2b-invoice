
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Eye, 
  Download, 
  Settings, 
  Save,
  Undo,
  Redo
} from 'lucide-react';
import { PDFTemplateEditor } from '@/components/pdf-editor/PDFTemplateEditor';
import { PDFLivePreview } from '@/components/pdf-editor/PDFLivePreview';
import { PDFDataSelector } from '@/components/pdf-editor/PDFDataSelector';
import { PDFStyleEditor } from '@/components/pdf-editor/PDFStyleEditor';
import { PDFTemplate, PDFData } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

const PDFEditor = () => {
  const [activeTab, setActiveTab] = useState('template');
  const [template, setTemplate] = useState<PDFTemplate | null>(null);
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const { toast } = useToast();

  // Initialize with default template
  useEffect(() => {
    const defaultTemplate: PDFTemplate = {
      id: 'rechnung-default',
      name: 'Standard Rechnung',
      type: 'rechnung',
      sections: [
        {
          id: 'header',
          type: 'header',
          title: 'Kopfbereich',
          position: { x: 5, y: 15 },
          size: { width: 200, height: 40 },
          style: { fontSize: 11, fontFamily: 'Helvetica' },
          fields: [
            { key: 'kanzlei.name', label: 'Kanzlei Name', required: true },
            { key: 'kanzlei.adresse', label: 'Adresse', required: true },
            { key: 'kanzlei.telefon', label: 'Telefon', required: false },
            { key: 'kanzlei.email', label: 'E-Mail', required: false }
          ]
        },
        {
          id: 'recipient',
          type: 'address',
          title: 'Empfänger',
          position: { x: 5, y: 90 },
          size: { width: 130, height: 30 },
          style: { fontSize: 11, fontFamily: 'Helvetica' },
          fields: [
            { key: 'kunde.name', label: 'Kunde Name', required: true },
            { key: 'kunde.adresse', label: 'Adresse', required: true },
            { key: 'kunde.plz', label: 'PLZ', required: true },
            { key: 'kunde.stadt', label: 'Stadt', required: true }
          ]
        },
        {
          id: 'invoice-details',
          type: 'content',
          title: 'Rechnungsdetails',
          position: { x: 5, y: 140 },
          size: { width: 180, height: 60 },
          style: { fontSize: 11, fontFamily: 'Helvetica' },
          fields: [
            { key: 'rechnung.nummer', label: 'Rechnungsnummer', required: true },
            { key: 'rechnung.datum', label: 'Datum', required: true },
            { key: 'auto.marke', label: 'Fahrzeug Marke', required: false },
            { key: 'auto.modell', label: 'Fahrzeug Modell', required: false }
          ]
        }
      ],
      styles: {
        page: { margin: 20, fontSize: 11, fontFamily: 'Helvetica' },
        header: { fontSize: 12, fontWeight: 'bold', color: '#000000' },
        content: { fontSize: 11, color: '#000000', lineHeight: 1.4 }
      }
    };
    setTemplate(defaultTemplate);
  }, []);

  const handleTemplateChange = (updatedTemplate: PDFTemplate) => {
    setTemplate(updatedTemplate);
    setPreviewKey(prev => prev + 1); // Force preview refresh
  };

  const handleDataChange = (updatedData: PDFData) => {
    setPdfData(updatedData);
    setPreviewKey(prev => prev + 1); // Force preview refresh
  };

  const handleSaveTemplate = () => {
    if (template) {
      // In a real app, this would save to a database
      localStorage.setItem(`pdf-template-${template.id}`, JSON.stringify(template));
      toast({
        title: 'Template gespeichert',
        description: 'Die Vorlage wurde erfolgreich gespeichert.',
      });
    }
  };

  const handleExportPDF = async () => {
    if (!template || !pdfData) {
      toast({
        title: 'Fehler',
        description: 'Template und Daten müssen ausgewählt sein.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { downloadPDF } = await import('@/lib/pdfGenerator');
      await downloadPDF(pdfData, `${template.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'PDF exportiert',
        description: 'Das PDF wurde erfolgreich heruntergeladen.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export-Fehler',
        description: 'Fehler beim Exportieren des PDFs.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">
            PDF Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Erstellen und bearbeiten Sie PDF-Vorlagen mit Live-Vorschau
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-primary border-primary/50">
            {template?.name || 'Keine Vorlage'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
          <Button variant="gaming" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Editor */}
        <Card className="glass border-primary/20 p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-border/20 p-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="template">
                  <FileText className="w-4 h-4 mr-2" />
                  Template
                </TabsTrigger>
                <TabsTrigger value="data">
                  <Settings className="w-4 h-4 mr-2" />
                  Daten
                </TabsTrigger>
                <TabsTrigger value="style">
                  <Eye className="w-4 h-4 mr-2" />
                  Styling
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <FileText className="w-4 h-4 mr-2" />
                  Vorschau
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <TabsContent value="template" className="mt-0 h-full">
                {template && (
                  <PDFTemplateEditor
                    template={template}
                    onChange={handleTemplateChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="data" className="mt-0 h-full">
                <PDFDataSelector
                  currentData={pdfData}
                  onChange={handleDataChange}
                />
              </TabsContent>

              <TabsContent value="style" className="mt-0 h-full">
                {template && (
                  <PDFStyleEditor
                    template={template}
                    onChange={handleTemplateChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-0 h-full">
                <div className="text-center text-muted-foreground">
                  <p>Nutzen Sie die Live-Vorschau im rechten Panel</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Right Panel - Live Preview */}
        <Card className="glass border-primary/20 p-4">
          <div className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Live-Vorschau
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Undo className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Redo className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Separator className="mb-4" />
            
            <div className="h-[calc(100%-80px)]">
              {template && pdfData ? (
                <PDFLivePreview
                  key={previewKey}
                  template={template}
                  data={pdfData}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Wählen Sie ein Template und Daten für die Vorschau</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PDFEditor;
