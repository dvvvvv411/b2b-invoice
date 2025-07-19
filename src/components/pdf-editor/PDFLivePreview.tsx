
import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { PDFTemplate, PDFData } from '@/lib/pdfGenerator';

interface PDFLivePreviewProps {
  template: PDFTemplate;
  data: PDFData;
}

export function PDFLivePreview({ template, data }: PDFLivePreviewProps) {
  const [scale, setScale] = useState(0.8);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate HTML preview based on template and data
  useEffect(() => {
    const generatePreview = () => {
      setIsLoading(true);
      
      // Convert template to HTML representation
      const htmlSections = template.sections.map(section => {
        const sectionStyle = {
          position: 'absolute' as const,
          left: `${section.position.x}mm`,
          top: `${section.position.y}mm`,
          width: `${section.size.width}mm`,
          height: `${section.size.height}mm`,
          fontSize: `${section.style.fontSize}px`,
          fontFamily: section.style.fontFamily,
          fontWeight: section.style.fontWeight || 'normal',
          color: section.style.color || '#000000',
          lineHeight: section.style.lineHeight || 1.2,
          border: '1px dashed #ccc',
          padding: '2mm',
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        };

        // Extract field values from data
        const fieldValues = section.fields.map(field => {
          const value = getNestedValue(data, field.key) || field.label;
          return { ...field, value };
        });

        return `
          <div style="${styleObjectToString(sectionStyle)}">
            <div style="font-size: 10px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 4px;">
              ${section.title} (${section.type})
            </div>
            ${fieldValues.map(field => `
              <div style="margin-bottom: 2px;">
                ${field.value}
              </div>
            `).join('')}
          </div>
        `;
      });

      const pageStyle = {
        width: '210mm',
        height: '297mm', // A4
        backgroundColor: 'white',
        position: 'relative' as const,
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #ddd'
      };

      const html = `
        <div style="${styleObjectToString(pageStyle)}">
          ${htmlSections.join('')}
        </div>
      `;

      setPreviewHTML(html);
      setIsLoading(false);
    };

    generatePreview();
  }, [template, data]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const styleObjectToString = (styleObj: Record<string, any>): string => {
    return Object.entries(styleObj)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setScale(0.8);

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            A4 (210 × 297mm)
          </Badge>
          <Badge variant="outline">
            {Math.round(scale * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Vorschau wird generiert...</span>
            </div>
          </div>
        ) : (
          <div 
            ref={previewRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
        )}
      </div>

      {/* Template Info */}
      <Card className="mt-4 p-3 bg-muted/20 border-border/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Template: {template.name}</div>
          <div>Bereiche: {template.sections.length}</div>
          <div>Typ: {template.type}</div>
        </div>
      </Card>
    </div>
  );
}
