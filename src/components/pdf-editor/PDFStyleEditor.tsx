
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Palette, Type, Layout } from 'lucide-react';
import { PDFTemplate } from '@/lib/pdfGenerator';

interface PDFStyleEditorProps {
  template: PDFTemplate;
  onChange: (template: PDFTemplate) => void;
}

export function PDFStyleEditor({ template, onChange }: PDFStyleEditorProps) {
  const updateStyles = (updates: Partial<typeof template.styles>) => {
    onChange({
      ...template,
      styles: { ...template.styles, ...updates }
    });
  };

  const updatePageStyles = (updates: Partial<typeof template.styles.page>) => {
    updateStyles({
      page: { ...template.styles.page, ...updates }
    });
  };

  const updateHeaderStyles = (updates: Partial<typeof template.styles.header>) => {
    updateStyles({
      header: { ...template.styles.header, ...updates }
    });
  };

  const updateContentStyles = (updates: Partial<typeof template.styles.content>) => {
    updateStyles({
      content: { ...template.styles.content, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Styles */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
          <Layout className="w-4 h-4 mr-2" />
          Seiten-Layout
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="page-margin">Seitenrand (mm)</Label>
            <Input
              id="page-margin"
              type="number"
              value={template.styles.page.margin}
              onChange={(e) => updatePageStyles({ margin: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="page-font-size">Standard Schriftgröße</Label>
            <Input
              id="page-font-size"
              type="number"
              value={template.styles.page.fontSize}
              onChange={(e) => updatePageStyles({ fontSize: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="page-font-family">Schriftart</Label>
            <Select
              value={template.styles.page.fontFamily}
              onValueChange={(value) => updatePageStyles({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times-Roman">Times</SelectItem>
                <SelectItem value="Courier">Courier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Header Styles */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
          <Type className="w-4 h-4 mr-2" />
          Überschriften-Stil
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="header-font-size">Schriftgröße</Label>
            <Input
              id="header-font-size"
              type="number"
              value={template.styles.header.fontSize}
              onChange={(e) => updateHeaderStyles({ fontSize: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="header-font-weight">Schriftstärke</Label>
            <Select
              value={template.styles.header.fontWeight}
              onValueChange={(value) => updateHeaderStyles({ fontWeight: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Fett</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="header-color">Farbe</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="header-color"
                type="color"
                value={template.styles.header.color}
                onChange={(e) => updateHeaderStyles({ color: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={template.styles.header.color}
                onChange={(e) => updateHeaderStyles({ color: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Content Styles */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Inhalt-Stil
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="content-font-size">Schriftgröße</Label>
            <Input
              id="content-font-size"
              type="number"
              value={template.styles.content.fontSize}
              onChange={(e) => updateContentStyles({ fontSize: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="content-line-height">Zeilenhöhe</Label>
            <Input
              id="content-line-height"
              type="number"
              step="0.1"
              value={template.styles.content.lineHeight}
              onChange={(e) => updateContentStyles({ lineHeight: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="content-color">Farbe</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="content-color"
                type="color"
                value={template.styles.content.color}
                onChange={(e) => updateContentStyles({ color: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={template.styles.content.color}
                onChange={(e) => updateContentStyles({ color: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Style Preview */}
      <Card className="p-4 bg-muted/20 border-border/30">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Stil-Vorschau
        </h4>
        <div className="space-y-3">
          <div 
            style={{
              fontSize: `${template.styles.header.fontSize}px`,
              fontWeight: template.styles.header.fontWeight,
              color: template.styles.header.color,
              fontFamily: template.styles.page.fontFamily
            }}
          >
            Beispiel Überschrift
          </div>
          <div 
            style={{
              fontSize: `${template.styles.content.fontSize}px`,
              color: template.styles.content.color,
              lineHeight: template.styles.content.lineHeight,
              fontFamily: template.styles.page.fontFamily
            }}
          >
            Dies ist ein Beispieltext für den Inhalt. Er zeigt, wie der normale Text in Ihrem PDF-Dokument aussehen wird.
          </div>
        </div>
      </Card>
    </div>
  );
}
