
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
    
    console.log('Generating multi-page PDF using single HTML approach');
    
    // Create a single HTML document with proper page break controls
    const singleDocumentHTML = await createSingleDocumentHTML(htmlContent);
    
    // Configure html2pdf options for multi-page support
    const options = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: A4_WIDTH,
        height: undefined, // Let it calculate based on content
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before, .pdf-page-break',
        after: '.page-break-after',
        avoid: '.page-break-inside-avoid, .info-section, .signature-section'
      }
    };

    // Create element and generate PDF using standard html2pdf workflow
    const element = document.createElement('div');
    element.innerHTML = singleDocumentHTML;
    
    // Use the standard html2pdf workflow - no complex chaining
    await html2pdf().set(options).from(element).save();
    
    console.log('Multi-page PDF generated successfully using single document approach');
    
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// Helper function to create a single HTML document with page breaks
const createSingleDocumentHTML = async (htmlContent: string): Promise<string> => {
  try {
    // Split content into logical pages for measurement
    const pages = await splitHTMLIntoPages(htmlContent);
    
    if (pages.length <= 1) {
      // Single page - return as is
      return pages[0]?.html || htmlContent;
    }
    
    // Multi-page - create single document with page breaks
    const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
    const footerContent = htmlContent.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
    const mainContent = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
      .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

    const singleDocumentHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${baseStyles}
          
          /* Multi-page CSS styles */
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }
          
          .pdf-page {
            width: 100%;
            min-height: 297mm; /* A4 height */
            padding: 20px;
            padding-bottom: 60px;
            box-sizing: border-box;
            position: relative;
            page-break-after: always;
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
          .info-section, .signature-section, table {
            page-break-inside: avoid;
          }
          
          /* Force page breaks */
          .page-break-before, .pdf-page-break {
            page-break-before: always;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          .page-break-inside-avoid {
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
        </style>
      </head>
      <body>
        <div class="pdf-page">
          ${mainContent}
          <div class="pdf-footer">
            ${footerContent.replace(/<\/?div[^>]*>/gi, '')} | Seite 1 von ${pages.length}
          </div>
        </div>
        ${pages.slice(1).map((_, index) => `
        <div class="pdf-page">
          ${mainContent}
          <div class="pdf-footer">
            ${footerContent.replace(/<\/?div[^>]*>/gi, '')} | Seite ${index + 2} von ${pages.length}
          </div>
        </div>
        `).join('')}
      </body>
      </html>
    `;
    
    return singleDocumentHTML;
    
  } catch (error) {
    console.error('Error creating single document HTML:', error);
    // Fallback to original content
    return htmlContent;
  }
};

export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    // Use the new approach - convert pages back to single document
    if (pages.length === 0) {
      throw new Error('No pages to generate PDF from');
    }
    
    // Extract base content from first page
    const firstPageHTML = pages[0].html;
    const baseStyles = firstPageHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
    const mainContentMatch = firstPageHTML.match(/<div class="page-content">([\s\S]*?)<\/div>/i);
    const mainContent = mainContentMatch?.[1] || '';
    const footerMatch = firstPageHTML.match(/<div class="pdf-footer">([\s\S]*?)<\/div>/i);
    const footerContent = footerMatch?.[1] || '';
    
    // Create single document HTML
    const singleDocumentHTML = `
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
          
          .pdf-page {
            width: 100%;
            min-height: 297mm;
            padding: 20px;
            padding-bottom: 60px;
            box-sizing: border-box;
            position: relative;
            page-break-after: always;
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
        </style>
      </head>
      <body>
        ${pages.map((page, index) => `
        <div class="pdf-page">
          ${mainContent}
          <div class="pdf-footer">
            ${footerContent} | Seite ${index + 1} von ${pages.length}
          </div>
        </div>
        `).join('')}
      </body>
      </html>
    `;
    
    // Use the main generateMultiPagePDF function
    await generateMultiPagePDF(singleDocumentHTML, filename);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen.');
  }
};
