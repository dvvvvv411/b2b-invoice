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

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Rechnung</div>
        <p>Rechnungsnummer: 2024-001</p>
        <p>Datum: {{ current_date }}</p>
    </div>
    
    <div class="content">
        <h3>Rechnungsdetails</h3>
        <table>
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Beschreibung</th>
                    <th>Menge</th>
                    <th>Preis</th>
                    <th>Gesamt</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>Beispielprodukt</td>
                    <td>1</td>
                    <td>100,00 €</td>
                    <td>100,00 €</td>
                </tr>
            </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px;">
            <strong>Gesamtsumme: 100,00 €</strong>
        </div>
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

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation and download
    toast({
      title: "PDF wird generiert",
      description: "Das PDF wird heruntergeladen...",
    });
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

    // Replace placeholders with real data if enabled
    if (selectedData.useRealData) {
      const templateData: TemplateData = {};

      // Get selected data objects
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
