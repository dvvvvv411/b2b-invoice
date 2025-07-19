import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Save, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from '@/hooks/use-toast';

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
  const [htmlContent, setHtmlContent] = useState(DEFAULT_TEMPLATE);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [templateName, setTemplateName] = useState('Standardvorlage');
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const handleSaveTemplate = () => {
    // TODO: Implement save to database
    toast({
      title: "Template gespeichert",
      description: `Template "${templateName}" wurde erfolgreich gespeichert.`,
    });
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
  };

  const updatePreview = () => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">PDF Templates</h1>
          <p className="text-muted-foreground">Erstellen und verwalten Sie PDF-Vorlagen</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleSaveTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Template speichern
          </Button>
          <Button variant="gaming" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF herunterladen
          </Button>
        </div>
      </div>

      {/* Template Controls */}
      <Card className="p-4">
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
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Template auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standardvorlage</SelectItem>
                <SelectItem value="invoice">Rechnung Template</SelectItem>
                <SelectItem value="letter">Brief Template</SelectItem>
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

      {/* Main Content - Split Screen */}
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-300px)]">
        {/* HTML Editor */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">HTML Editor</h3>
          </div>
          
          <div className="h-full border rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={htmlContent}
              onChange={(value) => {
                setHtmlContent(value || '');
                setTimeout(updatePreview, 100);
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
        <Card className="p-4">
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
          <div className="h-full overflow-auto bg-gray-100 p-4 rounded-md">
            <div 
              className="mx-auto bg-white shadow-lg"
              style={{
                width: `${794 * zoom}px`,
                height: `${1123 * zoom}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            >
              <iframe
                ref={previewRef}
                className="w-full h-full border-0"
                style={{ 
                  width: '794px', 
                  height: '1123px',
                  transform: 'scale(1)',
                }}
                onLoad={updatePreview}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}