
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
          // Multiple pages
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
    
    // Split content into pages
    const pages = await splitHTMLIntoPages(htmlContent);
    
    console.log(`Generating PDF with ${pages.length} page(s)`);
    
    // Configure html2pdf options
    const options = {
      margin: [10, 10, 10, 10], // reduced margins for more content space
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: A4_WIDTH,
        height: A4_HEIGHT,
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
        mode: 'avoid-all'
      }
    };

    if (pages.length === 1) {
      // Single page - generate directly
      const element = document.createElement('div');
      element.innerHTML = pages[0].html;
      await html2pdf().set(options).from(element).save();
    } else {
      // Multiple pages - generate each page and combine
      let pdf = html2pdf().set(options);
      
      for (let i = 0; i < pages.length; i++) {
        const element = document.createElement('div');
        element.innerHTML = pages[i].html;
        
        if (i === 0) {
          pdf = pdf.from(element);
        } else {
          pdf = pdf.from(element).toContainer().toCanvas().toPdf().addPage();
        }
      }
      
      await pdf.save();
    }
    
    console.log('Multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('Multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

export const generatePDFFromMultiPageContent = async (pages: PageContent[], filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    console.log(`Generating PDF from ${pages.length} pre-split page(s)`);
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
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

    let pdf = html2pdf().set(options);
    
    for (let i = 0; i < pages.length; i++) {
      const element = document.createElement('div');
      element.innerHTML = pages[i].html;
      
      if (i === 0) {
        pdf = pdf.from(element);
      } else {
        pdf = pdf.from(element).toContainer().toCanvas().toPdf().addPage();
      }
    }
    
    await pdf.save();
    console.log('PDF generated successfully from multi-page content');
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen.');
  }
};
