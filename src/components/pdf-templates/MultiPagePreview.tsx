
import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { A4_CONSTANTS } from '@/utils/pdfConstants';
import { 
  extractAndProcessContent, 
  measureContentHeight,
} from '@/utils/contentProcessor';
import { 
  generateSinglePageHTML, 
  generateMultiPageHTML 
} from '@/utils/htmlGenerator';

interface MultiPagePreviewProps {
  htmlContent: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25];

export function MultiPagePreview({ htmlContent, zoom, onZoomChange, className }: MultiPagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const splitContentIntoPages = useCallback(async (content: string) => {
    setIsProcessing(true);
    
    try {
      const components = extractAndProcessContent(content);
      console.log('Preview - Extracted components:', { 
        hasStyles: !!components.baseStyles, 
        hasContent: !!components.mainContent, 
        hasFooter: !!components.footerContent 
      });

      // Measure content height
      const contentHeight = await measureContentHeight(components);
      const numberOfPages = Math.max(1, Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT));

      console.log('Preview measurement - Height:', contentHeight, 'Available per page:', A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT, 'Pages needed:', numberOfPages);

      const pageContents: PageContent[] = [];

      if (numberOfPages <= 1) {
        // Single page
        const singlePageHTML = generateSinglePageHTML(components, 1, 1);
        pageContents.push({
          html: singlePageHTML,
          pageNumber: 1,
          totalPages: 1
        });
      } else {
        // Multiple pages with content offset
        for (let i = 0; i < numberOfPages; i++) {
          const multiPageHTML = generateMultiPageHTML(components, i, numberOfPages);
          pageContents.push({
            html: multiPageHTML,
            pageNumber: i + 1,
            totalPages: numberOfPages
          });
        }
      }

      setPages(pageContents);
      console.log('Preview - Generated pages:', pageContents.length);
    } catch (error) {
      console.error('Error splitting content into pages:', error);
      // Fallback to single page with original content
      setPages([{
        html: content,
        pageNumber: 1,
        totalPages: 1
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (htmlContent) {
      splitContentIntoPages(htmlContent);
    }
  }, [htmlContent, splitContentIntoPages]);

  useEffect(() => {
    setCurrentPage(0);
  }, [pages]);

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
              width: `${A4_CONSTANTS.WIDTH * zoom}px`,
              height: `${A4_CONSTANTS.HEIGHT * zoom}px`,
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
