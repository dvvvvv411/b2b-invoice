
/**
 * Enhanced PDF generator that handles multi-page DIN A4 content
 */

const A4_WIDTH = 794; // pixels at 96 DPI
const A4_HEIGHT = 1123; // pixels at 96 DPI

interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

export const splitHTMLIntoPages = async (htmlContent: string): Promise<PageContent[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary iframe to measure content
      const tempIframe = document.createElement('iframe');
      tempIframe.style.position = 'absolute';
      tempIframe.style.left = '-9999px';
      tempIframe.style.width = `${A4_WIDTH}px`;
      tempIframe.style.height = `${A4_HEIGHT * 10}px`;
      tempIframe.style.border = 'none';
      document.body.appendChild(tempIframe);

      const doc = tempIframe.contentDocument;
      if (!doc) {
        reject(new Error('Cannot access iframe content'));
        return;
      }

      doc.open();
      doc.write(htmlContent);
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
        const availablePageHeight = A4_HEIGHT - 120; // Account for margins and footer
        const numberOfPages = Math.ceil(contentHeight / availablePageHeight);

        console.log('Total content height:', contentHeight, 'Pages needed:', numberOfPages);

        const pages: PageContent[] = [];
        const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
        const footerContent = htmlContent.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
        const mainContent = htmlContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
          .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

        if (numberOfPages <= 1) {
          // Single page
          const pageHtml = `
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
                  min-height: ${A4_HEIGHT}px;
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                  line-height: 1.4;
                  color: #000;
                  position: relative;
                }
                
                .page-content {
                  padding: 20px;
                  padding-bottom: 80px;
                  min-height: ${A4_HEIGHT - 80}px;
                }
                
                .pdf-footer {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  background: #f5f5f5;
                  padding: 10px;
                  text-align: center;
                  font-size: 10px;
                  border-top: 1px solid #ddd;
                }
              </style>
            </head>
            <body>
              <div class="page-content">
                ${mainContent}
              </div>
              ${footerContent} | Seite 1 von 1
            </body>
            </html>
          `;
          
          pages.push({
            html: pageHtml,
            pageNumber: 1,
            totalPages: 1
          });
        } else {
          // Multiple pages - split content
          for (let i = 0; i < numberOfPages; i++) {
            const pageHtml = `
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
                  }
                  
                  .page-content {
                    padding: 20px;
                    padding-bottom: 80px;
                    height: ${A4_HEIGHT - 80}px;
                    overflow: hidden;
                    transform: translateY(-${i * availablePageHeight}px);
                  }
                  
                  .pdf-footer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #f5f5f5;
                    padding: 10px;
                    text-align: center;
                    font-size: 10px;
                    border-top: 1px solid #ddd;
                  }
                </style>
              </head>
              <body>
                <div class="page-content">
                  ${mainContent}
                </div>
                ${footerContent} | Seite ${i + 1} von ${numberOfPages}
              </body>
              </html>
            `;
            
            pages.push({
              html: pageHtml,
              pageNumber: i + 1,
              totalPages: numberOfPages
            });
          }
        }

        document.body.removeChild(tempIframe);
        resolve(pages);
      }, 1000);

    } catch (error) {
      reject(error);
    }
  });
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
    
    console.log('Multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// Simplified function to create optimized single document
const createOptimizedSingleDocument = (htmlContent: string): string => {
  // Extract components from original HTML
  const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
  const footerContent = htmlContent.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
  const mainContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
    .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

  // Create single optimized document with proper CSS for html2pdf
  const optimizedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${baseStyles}
        
        /* Optimized CSS for html2pdf.js */
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          width: ${A4_WIDTH}px;
        }
        
        .pdf-page {
          width: ${A4_WIDTH}px;
          min-height: ${A4_HEIGHT - 60}px;
          padding: 20px;
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
          background: #f5f5f5;
          padding: 10px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #ddd;
          page-break-inside: avoid;
        }
        
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
        <div class="pdf-footer">
          ${footerContent.replace(/<\/?div[^>]*>/gi, '')}
        </div>
      </div>
    </body>
    </html>
  `;
  
  return optimizedHTML;
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
