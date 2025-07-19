
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

  // Split content into pages based on A4 dimensions
  const splitContentIntoPages = useCallback(async (content: string) => {
    setIsProcessing(true);
    
    try {
      // Create a temporary iframe to measure content height
      const tempIframe = document.createElement('iframe');
      tempIframe.style.position = 'absolute';
      tempIframe.style.left = '-9999px';
      tempIframe.style.width = `${A4_WIDTH}px`;
      tempIframe.style.height = `${A4_HEIGHT * 10}px`; // Make it tall to see all content
      tempIframe.style.border = 'none';
      document.body.appendChild(tempIframe);

      const doc = tempIframe.contentDocument;
      if (!doc) {
        setPages([content]);
        return;
      }

      // Write the content and add page break detection
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || ''}
            
            /* Additional styles for page breaking */
            .page-container {
              width: ${A4_WIDTH}px;
              min-height: ${A4_HEIGHT}px;
              padding: 0;
              margin: 0;
              box-sizing: border-box;
              page-break-after: always;
              position: relative;
            }
            
            .page-content {
              height: ${A4_HEIGHT - 120}px; /* Account for margins */
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
            }
            
            /* Prevent breaking inside these elements */
            .info-section, .signature-section, table {
              page-break-inside: avoid;
            }
            
            /* Force page breaks */
            .page-break-before {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div id="content-wrapper">
            ${content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')}
          </div>
        </body>
        </html>
      `);
      doc.close();

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const contentWrapper = doc.getElementById('content-wrapper');
      if (!contentWrapper) {
        setPages([content]);
        document.body.removeChild(tempIframe);
        return;
      }

      const contentHeight = contentWrapper.scrollHeight;
      const availablePageHeight = A4_HEIGHT - 120; // Account for margins and footer
      const numberOfPages = Math.ceil(contentHeight / availablePageHeight);

      console.log('Content height:', contentHeight, 'Pages needed:', numberOfPages);

      if (numberOfPages <= 1) {
        // Single page - wrap in page container
        const singlePageContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              ${content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || ''}
              
              .page-container {
                width: ${A4_WIDTH}px;
                height: ${A4_HEIGHT}px;
                padding: 0;
                margin: 0;
                box-sizing: border-box;
                position: relative;
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
              }
            </style>
          </head>
          <body>
            <div class="page-container">
              <div class="page-content">
                ${content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '').replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '')}
              </div>
              ${content.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || ''}
            </div>
          </body>
          </html>
        `;
        setPages([singlePageContent]);
      } else {
        // Multiple pages - split content
        const pageContents: string[] = [];
        const baseStyles = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
        const footerContent = content.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
        const mainContent = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '').replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

        for (let i = 0; i < numberOfPages; i++) {
          const pageContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                ${baseStyles}
                
                .page-container {
                  width: ${A4_WIDTH}px;
                  height: ${A4_HEIGHT}px;
                  padding: 0;
                  margin: 0;
                  box-sizing: border-box;
                  position: relative;
                  background: white;
                }
                
                .page-content {
                  height: ${A4_HEIGHT - 80}px;
                  overflow: hidden;
                  padding: 20px;
                  box-sizing: border-box;
                  transform: translateY(-${i * availablePageHeight}px);
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
                }
                
                .page-number::after {
                  content: "Seite ${i + 1} von ${numberOfPages}";
                }
              </style>
            </head>
            <body>
              <div class="page-container">
                <div class="page-content">
                  ${mainContent}
                </div>
                ${footerContent.replace('{{ AKTUELLES_DATUM }}', new Date().toLocaleDateString('de-DE'))} | <span class="page-number"></span>
              </div>
            </body>
            </html>
          `;
          pageContents.push(pageContent);
        }
        setPages(pageContents);
      }

      document.body.removeChild(tempIframe);
    } catch (error) {
      console.error('Error splitting content into pages:', error);
      setPages([content]);
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
