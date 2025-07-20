
/**
 * Enhanced PDF generator with proper DOM-based content splitting
 */
import { splitContentIntoPages } from './domContentSplitter';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export const generateMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    
    console.log('Starting enhanced multi-page PDF generation');
    
    // Split content using DOM analysis
    const result = await splitContentIntoPages(htmlContent);
    
    console.log('Content split into', result.totalPages, 'pages');
    
    if (result.pages.length === 1) {
      // Single page - direct generation
      await generateSinglePagePDF(result.pages[0].html, filename, html2pdf);
    } else {
      // Multi-page - combine all pages into one document
      await generateCombinedPDF(result.pages, filename, html2pdf);
    }
    
    console.log('Multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

const generateSinglePagePDF = async (pageHtml: string, filename: string | undefined, html2pdf: any): Promise<void> => {
  const options = {
    margin: 0,
    filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.5,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      logging: false,
      width: A4_WIDTH,
      height: A4_HEIGHT
    },
    jsPDF: { 
      unit: 'px', 
      format: [A4_WIDTH, A4_HEIGHT],
      orientation: 'portrait'
    }
  };

  const element = document.createElement('div');
  element.innerHTML = pageHtml;
  
  await html2pdf().set(options).from(element).save();
};

const generateCombinedPDF = async (pages: any[], filename: string | undefined, html2pdf: any): Promise<void> => {
  // Create combined document with proper page breaks
  const combinedHtml = createCombinedDocument(pages);
  
  const options = {
    margin: 0,
    filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.5,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      logging: false,
      width: A4_WIDTH
    },
    jsPDF: { 
      unit: 'px', 
      format: [A4_WIDTH, A4_HEIGHT],
      orientation: 'portrait'
    },
    pagebreak: { 
      mode: 'css',
      before: '.pdf-page-break'
    }
  };

  const element = document.createElement('div');
  element.innerHTML = combinedHtml;
  
  await html2pdf().set(options).from(element).save();
};

const createCombinedDocument = (pages: any[]): string => {
  // Extract base styles from first page
  const firstPageDoc = new DOMParser().parseFromString(pages[0].html, 'text/html');
  const baseStyles = firstPageDoc.querySelector('style')?.textContent || '';
  
  // Extract page contents
  const pageContents = pages.map((page, index) => {
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    const content = doc.querySelector('.page-content')?.innerHTML || '';
    const footer = doc.querySelector('.pdf-footer')?.innerHTML || '';
    
    return `
      <div class="pdf-page ${index > 0 ? 'pdf-page-break' : ''}" style="
        width: ${A4_WIDTH}px;
        height: ${A4_HEIGHT}px;
        position: relative;
        page-break-after: ${index < pages.length - 1 ? 'always' : 'avoid'};
        page-break-inside: avoid;
      ">
        <div class="page-content" style="
          padding: 40px;
          height: ${A4_HEIGHT - 140}px;
          overflow: hidden;
          box-sizing: border-box;
        ">
          ${content}
        </div>
        <div class="pdf-footer" style="
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
        ">
          ${footer}
        </div>
      </div>
    `;
  }).join('\n');

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
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        .pdf-page-break {
          page-break-before: always;
        }
        @page {
          margin: 0;
          size: ${A4_WIDTH}px ${A4_HEIGHT}px;
        }
      </style>
    </head>
    <body>
      ${pageContents}
    </body>
    </html>
  `;
};

// Legacy function for backward compatibility
export const splitHTMLIntoPages = async (htmlContent: string) => {
  const result = await splitContentIntoPages(htmlContent);
  return result.pages.map(page => ({
    html: page.html,
    pageNumber: page.pageNumber,
    totalPages: page.totalPages
  }));
};

// Legacy function for backward compatibility  
export const generatePDFFromMultiPageContent = async (pages: any[], filename?: string): Promise<void> => {
  if (pages.length === 0) {
    throw new Error('No pages to generate PDF from');
  }
  
  // Use the first page's HTML to reconstruct the original content
  await generateMultiPagePDF(pages[0].html, filename);
};
