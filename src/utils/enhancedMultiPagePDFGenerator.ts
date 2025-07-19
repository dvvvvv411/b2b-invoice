
import { FooterConfig, DEFAULT_FOOTER_CONFIG } from '@/components/pdf-templates/FooterConfiguration';
import { generateFooterHTML, generateFooterCSS, FooterData } from './footerGenerator';

const A4_WIDTH = 794; // pixels at 96 DPI
const A4_HEIGHT = 1123; // pixels at 96 DPI

interface EnhancedPageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

export const generateEnhancedMultiPagePDF = async (
  htmlContent: string, 
  footerConfig: FooterConfig = DEFAULT_FOOTER_CONFIG,
  filename?: string
): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    console.log('Generating enhanced multi-page PDF with configurable footer');
    
    // Create optimized document with footer configuration
    const optimizedHTML = createOptimizedDocument(htmlContent, footerConfig);
    
    // Configure html2pdf options
    const options = {
      margin: 0,
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
        width: A4_WIDTH,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'px', 
        format: [A4_WIDTH, A4_HEIGHT],
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
    
    console.log('Enhanced multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('Enhanced PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

const createOptimizedDocument = (htmlContent: string, footerConfig: FooterConfig): string => {
  // Extract components from original HTML
  const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
  const mainContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
    .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

  // Extract placeholder data for footer
  const placeholders = extractPlaceholders(htmlContent);
  const currentDate = new Date().toLocaleDateString('de-DE');

  // Generate footer CSS
  const footerCSS = generateFooterCSS(footerConfig);
  const footerHeight = footerConfig.enabled ? (footerConfig.fontSize * 1.2) + (footerConfig.padding * 2) + (footerConfig.borderTop ? 1 : 0) : 0;

  // Create single optimized document
  const optimizedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${baseStyles}
        
        /* Enhanced CSS for html2pdf.js with footer support */
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          width: ${A4_WIDTH}px;
          position: relative;
        }
        
        .pdf-page {
          width: ${A4_WIDTH}px;
          min-height: ${A4_HEIGHT - footerHeight}px;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        .pdf-page:last-child {
          page-break-after: avoid;
        }
        
        ${footerCSS}
        
        /* Prevent breaking inside these elements */
        .info-section, 
        .signature-section, 
        table,
        .no-break {
          page-break-inside: avoid;
        }
        
        /* Table specific rules */
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        /* Force page breaks where needed */
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="pdf-page">
        ${mainContent}
        ${footerConfig.enabled ? generateFooterHTML(footerConfig, {
          pageNumber: 1,
          totalPages: 1, // Will be updated by html2pdf's page counter
          currentDate,
          placeholders
        }) : ''}
      </div>
    </body>
    </html>
  `;
  
  return optimizedHTML;
};

const extractPlaceholders = (htmlContent: string): Record<string, string> => {
  const placeholders: Record<string, string> = {};
  
  // Extract common placeholders from the content
  const matches = htmlContent.match(/{{[^}]+}}/g) || [];
  matches.forEach(match => {
    const key = match.replace(/[{}]/g, '').trim();
    placeholders[key] = match; // Keep original format as fallback
  });
  
  return placeholders;
};

export const splitEnhancedHTMLIntoPages = async (
  htmlContent: string,
  footerConfig: FooterConfig = DEFAULT_FOOTER_CONFIG
): Promise<EnhancedPageContent[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary iframe to measure content
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
        reject(new Error('Cannot access iframe content'));
        return;
      }

      // Extract and process content
      const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
      const mainContent = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
        .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

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
          </style>
        </head>
        <body>${mainContent}</body>
        </html>
      `);
      doc.close();

      // Wait for content to render
      setTimeout(() => {
        const body = doc.body;
        if (!body) {
          reject(new Error('No body content found'));
          document.body.removeChild(tempIframe);
          return;
        }

        const contentHeight = body.scrollHeight;
        const footerHeight = footerConfig.enabled ? (footerConfig.fontSize * 1.2) + (footerConfig.padding * 2) + 20 : 20;
        const availablePageHeight = A4_HEIGHT - footerHeight - 40; // Account for margins
        const numberOfPages = Math.max(1, Math.ceil(contentHeight / availablePageHeight));

        console.log('Enhanced content measurement - Height:', contentHeight, 'Pages needed:', numberOfPages);

        const pages: EnhancedPageContent[] = [];
        const placeholders = extractPlaceholders(htmlContent);
        const currentDate = new Date().toLocaleDateString('de-DE');

        for (let i = 0; i < numberOfPages; i++) {
          const pageHTML = createEnhancedPageHTML(
            baseStyles,
            mainContent,
            footerConfig,
            i,
            numberOfPages,
            availablePageHeight,
            { placeholders, currentDate }
          );
          
          pages.push({
            html: pageHTML,
            pageNumber: i + 1,
            totalPages: numberOfPages
          });
        }

        document.body.removeChild(tempIframe);
        resolve(pages);
      }, 500);

    } catch (error) {
      reject(error);
    }
  });
};

const createEnhancedPageHTML = (
  baseStyles: string,
  mainContent: string,
  footerConfig: FooterConfig,
  pageIndex: number,
  totalPages: number,
  availablePageHeight: number,
  footerData: { placeholders: Record<string, string>; currentDate: string }
): string => {
  const footerHeight = footerConfig.enabled ? (footerConfig.fontSize * 1.2) + (footerConfig.padding * 2) + 10 : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${baseStyles}
        ${generateFooterCSS(footerConfig)}
        
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
          height: ${A4_HEIGHT - footerHeight}px;
          overflow: hidden;
          padding: 20px;
          box-sizing: border-box;
          transform: translateY(-${pageIndex * availablePageHeight}px);
        }
      </style>
    </head>
    <body>
      <div class="page-content">
        ${mainContent}
      </div>
      ${footerConfig.enabled ? generateFooterHTML(footerConfig, {
        pageNumber: pageIndex + 1,
        totalPages,
        currentDate: footerData.currentDate,
        placeholders: footerData.placeholders
      }) : ''}
    </body>
    </html>
  `;
};
