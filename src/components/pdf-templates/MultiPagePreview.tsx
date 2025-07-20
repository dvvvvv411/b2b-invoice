
import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { splitContentIntoPages, ContentPage } from '@/utils/domContentSplitter';

interface MultiPagePreviewProps {
  htmlContent: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25];
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export function MultiPagePreview({ htmlContent, zoom, onZoomChange, className }: MultiPagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processContent = useCallback(async () => {
    if (!htmlContent) return;
    
    setIsProcessing(true);
    
    try {
      const result = await splitContentIntoPages(htmlContent);
      setPages(result.pages);
      setCurrentPage(0);
      
      console.log('Preview processed:', result.totalPages, 'pages');
    } catch (error) {
      console.error('Failed to process content for preview:', error);
      // Fallback to single page
      setPages([{
        html: htmlContent,
        pageNumber: 1,
        totalPages: 1
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [htmlContent]);

  useEffect(() => {
    processContent();
  }, [processContent]);

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          {ZOOM_LEVELS.map((level) => (
            <Button
              key={level}
              variant={zoom === level ? "default" : "outline"}
              size="sm"
              onClick={() => onZoomChange(level)}
            >
              {Math.round(level * 100)}%
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(1.25, zoom + 0.25))}
            disabled={zoom >= 1.25}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Page Navigation */}
        {pages.length > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Seite {currentPage + 1} von {pages.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4 rounded-md flex justify-center min-h-0">
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Seiten werden vorbereitet...</div>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="bg-white shadow-lg flex-shrink-0"
            style={{
              width: `${A4_WIDTH * zoom}px`,
              height: `${A4_HEIGHT * zoom}px`,
            }}
          >
            {pages.length > 0 && (
              <iframe
                className="w-full h-full border-0"
                srcDoc={pages[currentPage]?.html}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              />
            )}
          </div>
        )}
      </div>

      {pages.length > 1 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Das Dokument wurde in {pages.length} Seiten aufgeteilt
        </div>
      )}
    </div>
  );
}
