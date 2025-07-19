
import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface MultiPagePreviewProps {
  htmlContent: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25];
const A4_WIDTH = 794; // pixels at 96 DPI
const A4_HEIGHT = 1123; // pixels at 96 DPI

export function MultiPagePreview({ htmlContent, zoom, onZoomChange, className }: MultiPagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simplified content splitting that matches the PDF generator
  const splitContentIntoPages = useCallback(async (content: string) => {
    setIsProcessing(true);
    
    try {
      // Extract components like the PDF generator does
      const baseStyles = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
      const footerContent = content.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
      const mainContent = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
        .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

      // Create a temporary iframe to measure content height
      const tempIframe = document.createElement('iframe');
      tempIframe.style.position = 'absolute';
      tempIframe.style.left = '-9999px';
      tempIframe.style.width = `${A4_WIDTH}px`;
      tempIframe.style.height = `${A4_HEIGHT * 10}px`;
      tempIframe.style.border = 'none';
      tempIframe.style.visibility = 'hidden';
      document.body.appendChild(tempIframe);

      const doc = tempIframe.contentDocument;
      if (!doc) {
        // Fallback to single page
        const singlePage = createSinglePageHTML(content, baseStyles, mainContent, footerContent, 1, 1);
        setPages([singlePage]);
        setIsProcessing(false);
        return;
      }

      // Write test content to measure
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${baseStyles}
            body {
              margin: 0;
              padding: 20px;
              width: ${A4_WIDTH - 40}px;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
            }
            .pdf-footer { display: none; }
          </style>
        </head>
        <body>${mainContent}</body>
        </html>
      `);
      doc.close();

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const body = doc.body;
      if (!body) {
        const singlePage = createSinglePageHTML(content, baseStyles, mainContent, footerContent, 1, 1);
        setPages([singlePage]);
        document.body.removeChild(tempIframe);
        setIsProcessing(false);
        return;
      }

      const contentHeight = body.scrollHeight;
      const availablePageHeight = A4_HEIGHT - 140; // Account for margins and footer
      const numberOfPages = Math.max(1, Math.ceil(contentHeight / availablePageHeight));

      console.log('Preview measurement - Height:', contentHeight, 'Available per page:', availablePageHeight, 'Pages needed:', numberOfPages);

      // Generate pages
      const pageContents: string[] = [];

      if (numberOfPages <= 1) {
        // Single page
        const singlePage = createSinglePageHTML(content, baseStyles, mainContent, footerContent, 1, 1);
        pageContents.push(singlePage);
      } else {
        // Multiple pages with content offset
        for (let i = 0; i < numberOfPages; i++) {
          const pageHTML = createMultiPageHTML(baseStyles, mainContent, footerContent, i, numberOfPages, availablePageHeight);
          pageContents.push(pageHTML);
        }
      }

      setPages(pageContents);
      document.body.removeChild(tempIframe);
    } catch (error) {
      console.error('Error splitting content into pages:', error);
      // Fallback to single page with original content
      setPages([content]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Helper function to create single page HTML
  const createSinglePageHTML = (originalContent: string, baseStyles: string, mainContent: string, footerContent: string, pageNum: number, totalPages: number): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${baseStyles}
          body {
            margin: 0;
            padding: 0;
            width: ${A4_WIDTH}px;
            height: ${A4_HEIGHT}px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            position: relative;
            overflow: hidden;
            background: white;
          }
          .page-content {
            height: ${A4_HEIGHT - 80}px;
            overflow: hidden;
            padding: 20px;
            box-sizing: border-box;
          }
          .pdf-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #f5f5f5;
            padding: 10px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ddd;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="page-content">
          ${mainContent}
        </div>
        <div class="pdf-footer">
          ${footerContent.replace(/<\/?div[^>]*>/gi, '')} | Seite ${pageNum} von ${totalPages}
        </div>
      </body>
      </html>
    `;
  };

  // Helper function to create multi-page HTML
  const createMultiPageHTML = (baseStyles: string, mainContent: string, footerContent: string, pageIndex: number, totalPages: number, availablePageHeight: number): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${baseStyles}
          body {
            margin: 0;
            padding: 0;
            width: ${A4_WIDTH}px;
            height: ${A4_HEIGHT}px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            position: relative;
            overflow: hidden;
            background: white;
          }
          .page-content {
            height: ${A4_HEIGHT - 80}px;
            overflow: hidden;
            padding: 20px;
            box-sizing: border-box;
            transform: translateY(-${pageIndex * availablePageHeight}px);
          }
          .pdf-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #f5f5f5;
            padding: 10px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ddd;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="page-content">
          ${mainContent}
        </div>
        <div class="pdf-footer">
          ${footerContent.replace(/<\/?div[^>]*>/gi, '')} | Seite ${pageIndex + 1} von ${totalPages}
        </div>
      </body>
      </html>
    `;
  };

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
              width: `${A4_WIDTH * zoom}px`,
              height: `${A4_HEIGHT * zoom}px`,
            }}
          >
            {pages.length > 0 && (
              <iframe
                className="w-full h-full border-0"
                srcDoc={pages[currentPage]}
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
