import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Save, Plus, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from '@/hooks/use-toast';
import { usePDFTemplates, PDFTemplate } from '@/hooks/usePDFTemplates';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useKunden } from '@/hooks/useKunden';
import { useAutos } from '@/hooks/useAutos';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import DataSelectionCard, { SelectedData } from '@/components/pdf-templates/DataSelectionCard';
import { replaceTemplateData, TemplateData } from '@/utils/templateDataReplacer';
import { replacePlaceholdersWithRealData, SelectedData as LivePreviewData } from '@/utils/livePreviewReplacer';
import { generateHTMLToPDF } from '@/lib/pdfGenerator';

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
        .content {
            margin: 20px 0;
        }
        .info-section {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .summary {
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        .page-break-before {
            page-break-before: always;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 40%;
            border-top: 1px solid #333;
            padding-top: 5px;
            text-align: center;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="pdf-content">
        <div class="header">
            <div class="title">Rechnung</div>
            <p><strong>Rechnungsnummer:</strong> 2024-001</p>
            <p><strong>Datum:</strong> {{ AKTUELLES_DATUM }}</p>
        </div>
        
        <div class="info-section">
            <h3>Rechnungsempfänger</h3>
            <p><strong>{{ KUNDE_NAME }}</strong><br>
            {{ KUNDE_ADRESSE }}<br>
            {{ KUNDE_PLZ }} {{ KUNDE_STADT }}</p>
        </div>
        
        <div class="content">
            <h3>Leistungen</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 8%">Pos.</th>
                        <th style="width: 50%">Beschreibung</th>
                        <th style="width: 10%">Menge</th>
                        <th style="width: 16%">Einzelpreis</th>
                        <th style="width: 16%">Gesamtpreis</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Rechtsberatung Fahrzeugkauf</td>
                        <td>1</td>
                        <td style="text-align: right">150,00 €</td>
                        <td style="text-align: right">150,00 €</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Vertragsprüfung und -erstellung</td>
                        <td>1</td>
                        <td style="text-align: right">200,00 €</td>
                        <td style="text-align: right">200,00 €</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Abwicklung Fahrzeugübernahme</td>
                        <td>1</td>
                        <td style="text-align: right">100,00 €</td>
                        <td style="text-align: right">100,00 €</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="summary">
                <p><strong>Nettobetrag:</strong> 450,00 €</p>
                <p><strong>MwSt. (19%):</strong> 85,50 €</p>
                <p style="font-size: 14px; margin-top: 10px;"><strong>Gesamtbetrag:</strong> 535,50 €</p>
            </div>
            
            <div class="info-section" style="margin-top: 30px;">
                <h4>Zahlungshinweise</h4>
                <p>Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf folgendes Konto:</p>
                <p><strong>{{ BANKKONTO_KONTONAME }}</strong><br>
                IBAN: {{ BANKKONTO_IBAN }}<br>
                BIC: {{ BANKKONTO_BIC }}<br>
                Verwendungszweck: Rechnung 2024-001</p>
            </div>
        </div>
        
        <div class="signature-section page-break-inside-avoid">
            <div class="signature-box">
                <div>Datum, Unterschrift Auftraggeber</div>
            </div>
            <div class="signature-box">
                <div>Datum, Unterschrift {{ KANZLEI_NAME }}</div>
            </div>
        </div>
    </div>
    
    <!-- This footer will be processed by our HTML processor -->
    <div class="pdf-footer">
        {{ KANZLEI_NAME }} | {{ KANZLEI_STRASSE }}, {{ KANZLEI_PLZ }} {{ KANZLEI_STADT }} | 
        Tel: {{ KANZLEI_TELEFON }} | E-Mail: {{ KANZLEI_EMAIL }} | 
        Erstellt am {{ AKTUELLES_DATUM }}
    </div>
</body>
</html>`;

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25];

export default function PDFTemplates() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, autoSaveTemplate } = usePDFTemplates();
  
  const [htmlContent, setHtmlContent] = useState(DEFAULT_TEMPLATE);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<PDFTemplate | null>(null);
  const [templateName, setTemplateName] = useState('Neue Vorlage');
  const [zoom, setZoom] = useState(1);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Data selection state
  const [selectedData, setSelectedData] = useState<SelectedData>(() => {
    const saved = localStorage.getItem('pdfTemplateSelectedData');
    return saved ? JSON.parse(saved) : {
      kanzlei: '',
      insolventesUnternehmen: '',
      kunde: '',
      auto: '',
      bankkonto: '',
      spedition: '',
      useRealData: false
    };
  });

  // Data hooks for template replacement
  const { data: kanzleien = [] } = useKanzleien();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  const { data: kunden = [] } = useKunden();
  const { data: autos = [] } = useAutos();
  const { data: bankkonten = [] } = useBankkonten();
  const { data: speditionen = [] } = useSpeditionen();

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (!autoSaveEnabled || isCreatingNew || !currentTemplate) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const success = await autoSaveTemplate(currentTemplate.id, htmlContent);
      if (success) {
        console.log('Template auto-saved');
      }
    }, 10000); // 10 seconds
  }, [autoSaveEnabled, isCreatingNew, currentTemplate, htmlContent, autoSaveTemplate]);

  // Schedule auto-save when content changes
  useEffect(() => {
    scheduleAutoSave();
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [scheduleAutoSave]);

  const handleSaveTemplate = async () => {
    if (isCreatingNew) {
      const newTemplate = await createTemplate(templateName, htmlContent, 'invoice');
      if (newTemplate) {
        setCurrentTemplate(newTemplate);
        setSelectedTemplate(newTemplate.id);
        setIsCreatingNew(false);
      }
    } else if (currentTemplate) {
      const success = await updateTemplate(currentTemplate.id, {
        name: templateName,
        html_content: htmlContent,
      });
      if (success) {
        toast({
          title: "Template gespeichert",
          description: `Template "${templateName}" wurde erfolgreich aktualisiert.`,
        });
      }
    }
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate) return;
    
    const success = await deleteTemplate(currentTemplate.id);
    if (success) {
      handleNewTemplate();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Get the processed HTML content from the live preview
      let processedContent = htmlContent;

      // Apply the same data replacement logic as in the preview
      if (selectedData.useRealData) {
        const livePreviewData: LivePreviewData = {};

        if (selectedData.kanzlei) {
          livePreviewData.kanzlei = kanzleien.find(k => k.id === selectedData.kanzlei);
        }
        if (selectedData.insolventesUnternehmen) {
          livePreviewData.insolventes = insolventeUnternehmen.find(u => u.id === selectedData.insolventesUnternehmen);
        }
        if (selectedData.kunde) {
          livePreviewData.kunde = kunden.find(k => k.id === selectedData.kunde);
        }
        if (selectedData.auto) {
          livePreviewData.auto = autos.find(a => a.id === selectedData.auto);
        }
        if (selectedData.bankkonto) {
          livePreviewData.bankkonto = bankkonten.find(b => b.id === selectedData.bankkonto);
        }
        if (selectedData.spedition) {
          livePreviewData.spedition = speditionen.find(s => s.id === selectedData.spedition);
        }

        processedContent = replacePlaceholdersWithRealData(processedContent, livePreviewData);
      } else {
        const templateData: TemplateData = {};

        if (selectedData.kanzlei) {
          templateData.kanzlei = kanzleien.find(k => k.id === selectedData.kanzlei);
        }
        if (selectedData.insolventesUnternehmen) {
          templateData.insolventesUnternehmen = insolventeUnternehmen.find(u => u.id === selectedData.insolventesUnternehmen);
        }
        if (selectedData.kunde) {
          templateData.kunde = kunden.find(k => k.id === selectedData.kunde);
        }
        if (selectedData.auto) {
          templateData.auto = autos.find(a => a.id === selectedData.auto);
        }
        if (selectedData.bankkonto) {
          templateData.bankkonto = bankkonten.find(b => b.id === selectedData.bankkonto);
        }
        if (selectedData.spedition) {
          templateData.spedition = speditionen.find(s => s.id === selectedData.spedition);
        }

        processedContent = replaceTemplateData(processedContent, templateData);
      }

      // Generate filename
      const filename = `${templateName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Generate PDF from HTML
      await generateHTMLToPDF(processedContent, filename);

      toast({
        title: "PDF erfolgreich erstellt",
        description: `Das PDF "${filename}" wurde heruntergeladen.`,
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Fehler beim PDF-Export",
        description: "Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleNewTemplate = () => {
    setHtmlContent(DEFAULT_TEMPLATE);
    setTemplateName('Neue Vorlage');
    setSelectedTemplate('');
    setCurrentTemplate(null);
    setIsCreatingNew(true);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setHtmlContent(template.html_content);
      setTemplateName(template.name);
      setSelectedTemplate(templateId);
      setCurrentTemplate(template);
      setIsCreatingNew(false);
    }
  };

  const updatePreview = useCallback((content: string) => {
    let processedContent = content;

    // Check if Live Preview with real data is enabled
    if (selectedData.useRealData) {
      // Build data object for new live preview replacer
      const livePreviewData: LivePreviewData = {};

      // Get selected data objects
      if (selectedData.kanzlei) {
        livePreviewData.kanzlei = kanzleien.find(k => k.id === selectedData.kanzlei);
      }
      if (selectedData.insolventesUnternehmen) {
        livePreviewData.insolventes = insolventeUnternehmen.find(u => u.id === selectedData.insolventesUnternehmen);
      }
      if (selectedData.kunde) {
        livePreviewData.kunde = kunden.find(k => k.id === selectedData.kunde);
      }
      if (selectedData.auto) {
        livePreviewData.auto = autos.find(a => a.id === selectedData.auto);
      }
      if (selectedData.bankkonto) {
        livePreviewData.bankkonto = bankkonten.find(b => b.id === selectedData.bankkonto);
      }
      if (selectedData.spedition) {
        livePreviewData.spedition = speditionen.find(s => s.id === selectedData.spedition);
      }

      // Use the enhanced live preview replacer with all new placeholders
      processedContent = replacePlaceholdersWithRealData(processedContent, livePreviewData);
    } else {
      // Standard mode - still replace old style placeholders for backward compatibility
      const templateData: TemplateData = {};

      if (selectedData.kanzlei) {
        templateData.kanzlei = kanzleien.find(k => k.id === selectedData.kanzlei);
      }
      if (selectedData.insolventesUnternehmen) {
        templateData.insolventesUnternehmen = insolventeUnternehmen.find(u => u.id === selectedData.insolventesUnternehmen);
      }
      if (selectedData.kunde) {
        templateData.kunde = kunden.find(k => k.id === selectedData.kunde);
      }
      if (selectedData.auto) {
        templateData.auto = autos.find(a => a.id === selectedData.auto);
      }
      if (selectedData.bankkonto) {
        templateData.bankkonto = bankkonten.find(b => b.id === selectedData.bankkonto);
      }
      if (selectedData.spedition) {
        templateData.spedition = speditionen.find(s => s.id === selectedData.spedition);
      }

      processedContent = replaceTemplateData(processedContent, templateData);
    }

    if (previewRef.current?.contentDocument) {
      const doc = previewRef.current.contentDocument;
      doc.open();
      doc.write(processedContent);
      doc.close();
    }
  }, [selectedData, kanzleien, insolventeUnternehmen, kunden, autos, bankkonten, speditionen]);

  // Update preview when selected data changes
  useEffect(() => {
    updatePreview(htmlContent);
  }, [selectedData, htmlContent, updatePreview]);

  return (
    <div className="p-6 space-y-6 h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">PDF Templates</h1>
          <p className="text-muted-foreground">Erstellen und verwalten Sie PDF-Vorlagen</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isCreatingNew && currentTemplate && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Template löschen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sind Sie sicher, dass Sie das Template "{templateName}" löschen möchten? 
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTemplate}>
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button variant="outline" onClick={handleSaveTemplate} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {isCreatingNew ? 'Template erstellen' : 'Speichern'}
          </Button>
          <Button variant="gaming" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF herunterladen
          </Button>
        </div>
      </div>

      {/* Template Controls */}
      <Card className="p-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Template Name</label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name eingeben"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Template auswählen</label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Lädt..." : "Template auswählen"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-6">
            <Button variant="outline" onClick={handleNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Template
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Selection Card */}
      <DataSelectionCard
        selectedData={selectedData}
        onDataChange={setSelectedData}
      />

      {/* Main Content - Split Screen */}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* HTML Editor */}
        <Card className="p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">HTML Editor</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {!isCreatingNew && autoSaveEnabled && (
                <span>Auto-Save aktiviert (alle 10s)</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 border rounded-md overflow-hidden min-h-0">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={htmlContent}
              onChange={(value) => {
                const newContent = value || '';
                setHtmlContent(newContent);
                updatePreview(newContent);
              }}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </Card>

        {/* Live Preview */}
        <Card className="p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              {ZOOM_LEVELS.map((level) => (
                <Button
                  key={level}
                  variant={zoom === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setZoom(level)}
                >
                  {Math.round(level * 100)}%
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(1.25, zoom + 0.25))}
                disabled={zoom >= 1.25}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* DIN A4 Preview Container */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4 rounded-md flex justify-center min-h-0">
            <div 
              className="bg-white shadow-lg flex-shrink-0"
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
              }}
            >
              <iframe
                ref={previewRef}
                className="w-full h-full border-0"
                srcDoc={htmlContent}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
