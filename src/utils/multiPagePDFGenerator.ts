
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight, ContentComponents } from './contentProcessor';
import { generateSinglePageHTML, generateMultiPageHTML } from './htmlGenerator';
import { generateEnhancedMultiPagePDF } from './enhancedPDFGenerator';

export interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

// Split HTML into pages using improved content processing
export const splitHTMLIntoPages = async (htmlContent: string): Promise<PageContent[]> => {
  return new Promise((resolve, reject) => {
    try {
      const components = extractAndProcessContent(htmlContent);
      
      measureContentHeight(components).then((contentHeight) => {
        const numberOfPages = Math.max(1, Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT));
        
        console.log('PDF Generator - Total content height:', contentHeight, 'Pages needed:', numberOfPages);

        const pages: PageContent[] = [];

        if (numberOfPages <= 1) {
          // Single page
          const pageHtml = generateSinglePageHTML(components, 1, 1);
          pages.push({
            html: pageHtml,
            pageNumber: 1,
            totalPages: 1
          });
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
        }

        resolve(pages);
      }).catch(reject);

    } catch (error) {
      reject(error);
    }
  });
};

// Enhanced multi-page PDF generation with improved footer handling
export const generateMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('Using enhanced multi-page PDF generator');
    await generateEnhancedMultiPagePDF(htmlContent, filename);
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// Generate PDF from multi-page content - simplified approach
export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    if (pages.length === 0) {
      throw new Error('No pages to generate PDF from');
    }
    
    // Use the first page's HTML as base and let the enhanced generator handle pagination
    const firstPageHTML = pages[0].html;
    await generateEnhancedMultiPagePDF(firstPageHTML, filename);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen.');
  }
};
