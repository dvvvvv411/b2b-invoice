
import { A4_CONSTANTS, getStandardPageCSS, processFooterContent } from './pdfConstants';
import { extractContentComponents, measureContentHeight, PageContent } from './pageGenerator';

export const splitHTMLIntoPages = async (htmlContent: string): Promise<PageContent[]> => {
  return new Promise((resolve, reject) => {
    try {
      const components = extractContentComponents(htmlContent);
      
      measureContentHeight(components).then((contentHeight) => {
        const numberOfPages = Math.max(1, Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT));
        
        console.log('PDF Generator - Total content height:', contentHeight, 'Pages needed:', numberOfPages);

        const pages: PageContent[] = [];

        if (numberOfPages <= 1) {
          // Single page
          const pageHtml = createSinglePageForPDF(components, 1, 1);
          pages.push({
            html: pageHtml,
            pageNumber: 1,
            totalPages: 1
          });
        } else {
          // Multiple pages
          for (let i = 0; i < numberOfPages; i++) {
            const pageHtml = createMultiPageForPDF(components, i, numberOfPages);
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

// Create single page HTML optimized for PDF generation
const createSinglePageForPDF = (components: any, pageNumber: number, totalPages: number): string => {
  const standardCSS = getStandardPageCSS(components.baseStyles);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${standardCSS}</style>
    </head>
    <body>
      <div class="page-content">
        ${components.mainContent}
      </div>
      <div class="pdf-footer">
        ${components.footerContent} | Seite ${pageNumber} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

// Create multi-page HTML optimized for PDF generation
const createMultiPageForPDF = (components: any, pageIndex: number, totalPages: number): string => {
  const standardCSS = getStandardPageCSS(components.baseStyles);
  
  const offsetCSS = `
    ${standardCSS}
    
    .page-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      overflow: hidden;
      box-sizing: border-box;
      transform: translateY(-${pageIndex * A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT}px);
    }
  `;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${offsetCSS}</style>
    </head>
    <body>
      <div class="page-content">
        ${components.mainContent}
      </div>
      <div class="pdf-footer">
        ${components.footerContent} | Seite ${pageIndex + 1} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

export const generateMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    console.log('Generating multi-page PDF with optimized approach');
    
    // Create optimized single document for html2pdf
    const optimizedHTML = createOptimizedSingleDocument(htmlContent);
    
    // Configure html2pdf options for proper A4 multi-page support
    const options = {
      margin: 0, // Remove margins to control layout ourselves
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: A4_CONSTANTS.WIDTH,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'px', 
        format: [A4_CONSTANTS.WIDTH, A4_CONSTANTS.HEIGHT],
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: 'css',
        before: '.page-break',
        avoid: '.no-break'
      }
    };

    // Create element and generate PDF
    const element = document.createElement('div');
    element.innerHTML = optimizedHTML;
    
    await html2pdf().set(options).from(element).save();
    
    console.log('Multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// Create optimized single document for html2pdf.js
const createOptimizedSingleDocument = (htmlContent: string): string => {
  const components = extractContentComponents(htmlContent);
  const standardCSS = getStandardPageCSS(components.baseStyles);
  
  // Enhanced CSS specifically for html2pdf.js
  const optimizedCSS = `
    ${standardCSS}
    
    /* Optimized CSS for html2pdf.js */
    .pdf-page {
      width: ${A4_CONSTANTS.WIDTH}px;
      min-height: ${A4_CONSTANTS.HEIGHT - 60}px;
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
    }
    
    .pdf-page:last-child {
      page-break-after: avoid;
    }
    
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f5f5f5;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #ddd;
      page-break-inside: avoid;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Prevent breaking inside these elements */
    .info-section, 
    .signature-section, 
    table,
    .no-break {
      page-break-inside: avoid;
    }
    
    /* Force page breaks where needed */
    .page-break {
      page-break-before: always;
    }
  `;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${optimizedCSS}</style>
    </head>
    <body>
      <div class="pdf-page">
        ${components.mainContent}
        <div class="pdf-footer">
          ${components.footerContent}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    if (pages.length === 0) {
      throw new Error('No pages to generate PDF from');
    }
    
    // Extract content from first page and use the main generator
    const firstPageHTML = pages[0].html;
    await generateMultiPagePDF(firstPageHTML, filename);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen.');
  }
};
