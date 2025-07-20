
import { A4_CONSTANTS } from './pdfConstants';
import { generateDirectPDF } from './directPDFGenerator';

export interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

// Simplified PDF generation that uses the processed content directly
export const generateMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('🚀 Starting simplified multi-page PDF generation');
    console.log('📄 Content length:', htmlContent?.length || 0);
    
    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
      throw new Error('Kein gültiger HTML-Inhalt zum Generieren des PDFs');
    }
    
    // Use direct PDF generation without complex page splitting
    // The content is already processed and ready for PDF generation
    await generateDirectPDF(htmlContent, filename);
    console.log('✅ PDF generation completed successfully');
    
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

// Legacy function for backward compatibility - now just calls the simplified version
export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    console.log('📄 Generating PDF from', pages?.length || 0, 'pages (legacy mode)');
    
    if (!pages || pages.length === 0) {
      throw new Error('Keine Seiten zum Generieren des PDFs vorhanden');
    }
    
    // Use the first page's HTML content for PDF generation
    const firstPageHTML = pages[0]?.html;
    if (!firstPageHTML) {
      throw new Error('Keine gültigen Seiten gefunden');
    }
    
    await generateMultiPagePDF(firstPageHTML, filename);
    console.log('✅ Legacy PDF generation completed successfully');
    
  } catch (error) {
    console.error('❌ Legacy PDF generation failed:', error);
    throw error;
  }
};

// Simplified page splitting for preview purposes only
export const splitHTMLIntoPages = async (htmlContent: string): Promise<PageContent[]> => {
  return new Promise((resolve) => {
    console.log('📄 Simplified HTML page splitting for preview...');
    
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
      
      // Simple estimation based on content length
      const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
      const CHARS_PER_PAGE = 3000;
      const estimatedPages = Math.max(1, Math.min(5, Math.ceil(textContent.length / CHARS_PER_PAGE)));
      
      console.log('📄 Estimated pages for preview:', estimatedPages);

      const pages: PageContent[] = [];
      
      // Create pages for preview (actual PDF will be generated differently)
      for (let i = 0; i < estimatedPages; i++) {
        const pageIndicator = estimatedPages > 1 ? `
          <div style="position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.1); padding: 5px 10px; font-size: 10px; border-radius: 3px;">
            Seite ${i + 1} von ${estimatedPages}
          </div>
        ` : '';
        
        pages.push({
          html: htmlContent + pageIndicator,
          pageNumber: i + 1,
          totalPages: estimatedPages
        });
      }

      resolve(pages);
    } catch (error) {
      console.error('❌ Error in simplified page splitting:', error);
      resolve([{
        html: htmlContent,
        pageNumber: 1,
        totalPages: 1
      }]);
    }
  });
};
