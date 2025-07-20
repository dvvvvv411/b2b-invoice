
/**
 * DOM-based content splitter for accurate multi-page PDF generation
 */

const A4_WIDTH = 794; // pixels at 96 DPI
const A4_HEIGHT = 1123; // pixels at 96 DPI
const PAGE_MARGIN = 40; // top/bottom margins
const FOOTER_HEIGHT = 60;
const AVAILABLE_HEIGHT = A4_HEIGHT - PAGE_MARGIN * 2 - FOOTER_HEIGHT;

export interface ContentPage {
  html: string;
  pageNumber: number;
  totalPages: number;
}

export interface SplitResult {
  pages: ContentPage[];
  totalPages: number;
}

export const splitContentIntoPages = async (htmlContent: string): Promise<SplitResult> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting content splitting process');
      
      // Extract components from HTML
      const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
      const footerContent = htmlContent.match(/<div class="pdf-footer">[\s\S]*?<\/div>/i)?.[0] || '';
      const mainContent = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
        .replace(/<div class="pdf-footer">[\s\S]*?<\/div>/gi, '');

      console.log('Extracted content lengths - styles:', baseStyles.length, 'footer:', footerContent.length, 'main:', mainContent.length);

      // Create temporary container for measurement
      const measureContainer = document.createElement('div');
      measureContainer.style.position = 'absolute';
      measureContainer.style.left = '-9999px';
      measureContainer.style.width = `${A4_WIDTH - PAGE_MARGIN * 2}px`;
      measureContainer.style.visibility = 'hidden';
      measureContainer.style.fontSize = '12px';
      measureContainer.style.lineHeight = '1.4';
      measureContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Add styles
      const styleElement = document.createElement('style');
      styleElement.textContent = baseStyles;
      measureContainer.appendChild(styleElement);
      
      // Add content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = mainContent;
      measureContainer.appendChild(contentDiv);
      
      document.body.appendChild(measureContainer);

      // Wait for content to render and fonts to load
      setTimeout(() => {
        try {
          const totalHeight = contentDiv.scrollHeight;
          const estimatedPages = Math.max(1, Math.ceil(totalHeight / AVAILABLE_HEIGHT));

          console.log('DOM measurement - Total height:', totalHeight, 'Available per page:', AVAILABLE_HEIGHT, 'Estimated pages:', estimatedPages);

          const pages: ContentPage[] = [];

          if (estimatedPages === 1 || totalHeight <= AVAILABLE_HEIGHT) {
            // Single page - no splitting needed
            console.log('Creating single page');
            const pageHtml = createSinglePageHTML(baseStyles, mainContent, footerContent, 1, 1);
            pages.push({
              html: pageHtml,
              pageNumber: 1,
              totalPages: 1
            });
          } else {
            // Multiple pages - split content intelligently
            console.log('Splitting into multiple pages');
            const splitPages = splitContentIntelligently(contentDiv, baseStyles, footerContent, estimatedPages);
            pages.push(...splitPages);
          }

          // Clean up
          document.body.removeChild(measureContainer);

          console.log('Content splitting completed. Total pages:', pages.length);

          resolve({
            pages,
            totalPages: pages.length
          });

        } catch (error) {
          document.body.removeChild(measureContainer);
          throw error;
        }
      }, 750); // Increased timeout for better rendering

    } catch (error) {
      console.error('Content splitting failed:', error);
      reject(error);
    }
  });
};

const splitContentIntelligently = (contentDiv: HTMLElement, baseStyles: string, footerContent: string, estimatedPages: number): ContentPage[] => {
  const pages: ContentPage[] = [];
  const elements = Array.from(contentDiv.children);
  
  console.log('Splitting', elements.length, 'elements across', estimatedPages, 'estimated pages');
  
  let currentPageHeight = 0;
  let currentPageElements: Element[] = [];
  let pageNumber = 1;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i] as HTMLElement;
    const elementHeight = element.offsetHeight;
    const marginBottom = parseInt(window.getComputedStyle(element).marginBottom) || 0;
    const totalElementHeight = elementHeight + marginBottom;
    
    console.log(`Element ${i + 1}: height=${elementHeight}, margin=${marginBottom}, total=${totalElementHeight}`);
    
    // Skip elements with no meaningful height
    if (totalElementHeight <= 0) {
      console.log(`Skipping empty element ${i + 1}`);
      continue;
    }
    
    // Check if adding this element would exceed page height
    if (currentPageHeight + totalElementHeight > AVAILABLE_HEIGHT && currentPageElements.length > 0) {
      // Create page with current elements only if they have content
      console.log(`Creating page ${pageNumber} with ${currentPageElements.length} elements, height: ${currentPageHeight}`);
      
      const pageContent = currentPageElements.map(el => el.outerHTML).join('\n');
      const pageHtml = createMultiPageHTML(baseStyles, pageContent, footerContent, pageNumber, estimatedPages);
      
      pages.push({
        html: pageHtml,
        pageNumber: pageNumber,
        totalPages: estimatedPages
      });

      // Start new page
      currentPageElements = [element];
      currentPageHeight = totalElementHeight;
      pageNumber++;
    } else {
      // Add element to current page
      currentPageElements.push(element);
      currentPageHeight += totalElementHeight;
    }
  }

  // Handle remaining elements in last page
  if (currentPageElements.length > 0 && currentPageHeight > 0) {
    console.log(`Creating final page ${pageNumber} with ${currentPageElements.length} elements, height: ${currentPageHeight}`);
    
    const pageContent = currentPageElements.map(el => el.outerHTML).join('\n');
    const pageHtml = createMultiPageHTML(baseStyles, pageContent, footerContent, pageNumber, estimatedPages);
    
    pages.push({
      html: pageHtml,
      pageNumber: pageNumber,
      totalPages: estimatedPages
    });
  }

  // Update total pages for all pages
  const actualTotalPages = pages.length;
  pages.forEach(page => {
    page.totalPages = actualTotalPages;
  });

  return pages;
};

const createSinglePageHTML = (baseStyles: string, content: string, footer: string, pageNum: number, totalPages: number): string => {
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
          width: ${A4_WIDTH}px;
          height: ${A4_HEIGHT}px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          position: relative;
          background: white;
          overflow: hidden;
        }
        .page-content {
          padding: ${PAGE_MARGIN}px;
          height: ${AVAILABLE_HEIGHT}px;
          overflow: hidden;
          box-sizing: border-box;
        }
        .pdf-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: ${FOOTER_HEIGHT}px;
          background: #f5f5f5;
          padding: 10px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #ddd;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="page-content">
        ${content}
      </div>
      <div class="pdf-footer">
        ${footer.replace(/<\/?div[^>]*>/gi, '')} | Seite ${pageNum} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

const createMultiPageHTML = (baseStyles: string, content: string, footer: string, pageNum: number, totalPages: number): string => {
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
          width: ${A4_WIDTH}px;
          height: ${A4_HEIGHT}px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          position: relative;
          background: white;
          overflow: hidden;
        }
        .page-content {
          padding: ${PAGE_MARGIN}px;
          height: ${AVAILABLE_HEIGHT}px;
          overflow: hidden;
          box-sizing: border-box;
        }
        .pdf-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: ${FOOTER_HEIGHT}px;
          background: #f5f5f5;
          padding: 10px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #ddd;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="page-content">
        ${content}
      </div>
      <div class="pdf-footer">
        ${footer.replace(/<\/?div[^>]*>/gi, '')} | Seite ${pageNum} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};
