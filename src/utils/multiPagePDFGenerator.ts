
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight, ContentComponents } from './contentProcessor';
import { generateSinglePageHTML, generateMultiPageHTML } from './htmlGenerator';
import { generateEnhancedMultiPagePDF } from './enhancedPDFGenerator';

export interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

// Split HTML into pages using improved content processing with better error handling
export const splitHTMLIntoPages = async (htmlContent: string): Promise<PageContent[]> => {
  return new Promise((resolve, reject) => {
    console.log('📄 Starting HTML page splitting...');
    
    try {
      if (!htmlContent || typeof htmlContent !== 'string') {
        console.warn('⚠️ Invalid HTML content for splitting');
        resolve([{
          html: '<div>No content available</div>',
          pageNumber: 1,
          totalPages: 1
        }]);
        return;
      }
      
      const components = extractAndProcessContent(htmlContent);
      console.log('📄 Components extracted for splitting');
      
      measureContentHeight(components).then((contentHeight) => {
        const numberOfPages = Math.max(1, Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT));
        
        console.log('📄 PDF Generator - Total content height:', contentHeight, 'Pages needed:', numberOfPages);

        const pages: PageContent[] = [];

        try {
          if (numberOfPages <= 1) {
            // Single page
            const pageHtml = generateSinglePageHTML(components, 1, 1);
            pages.push({
              html: pageHtml,
              pageNumber: 1,
              totalPages: 1
            });
            console.log('📄 Generated single page');
          } else {
            // Multiple pages
            for (let i = 0; i < numberOfPages; i++) {
              const pageHtml = generateMultiPageHTML(components, i, numberOfPages);
              pages.push({
                html: pageHtml,
                pageNumber: i + 1,
                totalPages: numberOfPages
              });
            }
            console.log('📄 Generated', numberOfPages, 'pages');
          }

          resolve(pages);
        } catch (pageGenError) {
          console.error('❌ Error generating pages:', pageGenError);
          // Fallback to single page with original content
          resolve([{
            html: htmlContent,
            pageNumber: 1,
            totalPages: 1
          }]);
        }

      }).catch((measureError) => {
        console.error('❌ Error measuring content height:', measureError);
        // Fallback to single page
        const components = extractAndProcessContent(htmlContent);
        const fallbackHtml = generateSinglePageHTML(components, 1, 1);
        resolve([{
          html: fallbackHtml,
          pageNumber: 1,
          totalPages: 1
        }]);
      });

    } catch (error) {
      console.error('❌ Error in splitHTMLIntoPages:', error);
      reject(error);
    }
  });
};

// Enhanced multi-page PDF generation with improved error handling and debugging
export const generateMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('🚀 Using enhanced multi-page PDF generator');
    console.log('📄 Content length:', htmlContent?.length || 0);
    
    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
      throw new Error('Kein gültiger HTML-Inhalt zum Generieren des PDFs');
    }
    
    await generateEnhancedMultiPagePDF(htmlContent, filename);
    console.log('✅ Multi-page PDF generation completed successfully');
    
  } catch (error) {
    console.error('❌ Multi-page PDF generation failed:', error);
    
    // Enhanced error message based on error type
    let errorMessage = 'PDF-Generierung fehlgeschlagen.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'PDF-Generierung zu langsam. Bitte versuchen Sie es mit weniger Inhalt.';
      } else if (error.message.includes('html2pdf')) {
        errorMessage = 'PDF-Bibliothek Fehler. Bitte aktualisieren Sie die Seite und versuchen Sie es erneut.';
      } else if (error.message.includes('Kein gültiger HTML-Inhalt')) {
        errorMessage = error.message;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Generate PDF from multi-page content with better error handling
export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    console.log('📄 Generating PDF from', pages?.length || 0, 'pages');
    
    if (!pages || pages.length === 0) {
      throw new Error('Keine Seiten zum Generieren des PDFs vorhanden');
    }
    
    // Validate pages
    const validPages = pages.filter(page => page && page.html && page.html.trim());
    if (validPages.length === 0) {
      throw new Error('Keine gültigen Seiten gefunden');
    }
    
    console.log('📄 Using', validPages.length, 'valid pages out of', pages.length);
    
    // Use the first valid page's HTML as base and let the enhanced generator handle pagination
    const firstPageHTML = validPages[0].html;
    await generateEnhancedMultiPagePDF(firstPageHTML, filename);
    
    console.log('✅ PDF generated from multi-page content successfully');
    
  } catch (error) {
    console.error('❌ PDF generation from multi-page content failed:', error);
    
    let errorMessage = 'PDF-Generierung fehlgeschlagen.';
    if (error instanceof Error && error.message.includes('Keine')) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};
