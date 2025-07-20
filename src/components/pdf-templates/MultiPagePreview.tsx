
import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { A4_CONSTANTS } from '@/utils/pdfConstants';

interface MultiPagePreviewProps {
  htmlContent: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25];

export function MultiPagePreview({ htmlContent, zoom, onZoomChange, className }: MultiPagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [estimatedPages, setEstimatedPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple page estimation based on content length and typical page capacity
  const estimatePageCount = useCallback((content: string) => {
    if (!content || !content.trim()) return 1;
    
    // Remove HTML tags for rough content estimation
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const contentLength = textContent.length;
    
    // Rough estimation: ~3000 characters per A4 page with 12px font
    const CHARS_PER_PAGE = 3000;
    const estimatedPageCount = Math.max(1, Math.ceil(contentLength / CHARS_PER_PAGE));
    
    // Cap at reasonable maximum to avoid excessive pages
    return Math.min(estimatedPageCount, 5);
  }, []);

  useEffect(() => {
    if (htmlContent) {
      setIsProcessing(true);
      
      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        const pageCount = estimatePageCount(htmlContent);
        console.log('Preview - Estimated pages:', pageCount);
        setEstimatedPages(pageCount);
        setCurrentPage(0);
        setIsProcessing(false);
      }, 100);
    }
  }, [htmlContent, estimatePageCount]);

  // Generate page-specific content for preview
  const getPageContent = useCallback((pageIndex: number) => {
    if (estimatedPages <= 1) {
      return htmlContent;
    }

    // For multi-page preview, add page indicator
    const pageIndicator = `
      <div style="position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.1); padding: 5px 10px; font-size: 10px; border-radius: 3px;">
        Seite ${pageIndex + 1} von ${estimatedPages}
      </div>
    `;

    return htmlContent + pageIndicator;
  }, [htmlContent, estimatedPages]);

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

        {/* Page Navigation - only show if more than 1 page */}
        {estimatedPages > 1 && (
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
              Seite {currentPage + 1} von {estimatedPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(estimatedPages - 1, currentPage + 1))}
              disabled={currentPage === estimatedPages - 1}
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
            <div className="text-muted-foreground">Vorschau wird vorbereitet...</div>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="bg-white shadow-lg flex-shrink-0"
            style={{
              width: `${A4_CONSTANTS.WIDTH * zoom}px`,
              height: `${A4_CONSTANTS.HEIGHT * zoom}px`,
            }}
          >
            <iframe
              className="w-full h-full border-0"
              srcDoc={getPageContent(currentPage)}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            />
          </div>
        )}
      </div>

      {estimatedPages > 1 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Geschätzte Seitenanzahl: {estimatedPages} (basierend auf Inhaltsumfang)
        </div>
      )}
    </div>
  );
}
