
import { A4_CONSTANTS, getStandardPageCSS, processFooterContent } from './pdfConstants';

export interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

export interface ContentComponents {
  baseStyles: string;
  mainContent: string;
  footerContent: string;
}

// Extract components from HTML content
export const extractContentComponents = (htmlContent: string): ContentComponents => {
  // Extract base styles
  const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
  
  // Extract footer content properly
  const footerMatch = htmlContent.match(/<div class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i);
  const footerContent = footerMatch ? footerMatch[1].trim() : '';
  
  // Extract main content (everything except styles and footer)
  const mainContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
    .replace(/<div class="pdf-footer"[^>]*>[\s\S]*?<\/div>/gi, '')
    .trim();

  return { baseStyles, mainContent, footerContent };
};

// Generate single page HTML
export const generateSinglePageHTML = (
  components: ContentComponents,
  pageNumber: number = 1,
  totalPages: number = 1
): string => {
  const { baseStyles, mainContent, footerContent } = components;
  const standardCSS = getStandardPageCSS(baseStyles);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${standardCSS}</style>
    </head>
    <body>
      <div class="page-content">
        ${mainContent}
      </div>
      <div class="pdf-footer">
        ${footerContent} | Seite ${pageNumber} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

// Generate multi-page HTML with content offset
export const generateMultiPageHTML = (
  components: ContentComponents,
  pageIndex: number,
  totalPages: number
): string => {
  const { baseStyles, mainContent, footerContent } = components;
  const standardCSS = getStandardPageCSS(baseStyles);
  
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
        ${mainContent}
      </div>
      <div class="pdf-footer">
        ${footerContent} | Seite ${pageIndex + 1} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

// Measure content height using temporary iframe
export const measureContentHeight = async (components: ContentComponents): Promise<number> => {
  return new Promise((resolve) => {
    const tempIframe = document.createElement('iframe');
    tempIframe.style.position = 'absolute';
    tempIframe.style.left = '-9999px';
    tempIframe.style.width = `${A4_CONSTANTS.WIDTH}px`;
    tempIframe.style.height = `${A4_CONSTANTS.HEIGHT * 10}px`;
    tempIframe.style.border = 'none';
    tempIframe.style.visibility = 'hidden';
    
    document.body.appendChild(tempIframe);

    const doc = tempIframe.contentDocument;
    if (!doc) {
      document.body.removeChild(tempIframe);
      resolve(A4_CONSTANTS.CONTENT_HEIGHT); // Fallback to single page
      return;
    }

    const standardCSS = getStandardPageCSS(components.baseStyles);
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${standardCSS}
          .pdf-footer { display: none; }
        </style>
      </head>
      <body>
        <div class="page-content">
          ${components.mainContent}
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Wait for content to render
    setTimeout(() => {
      const contentHeight = doc.body?.scrollHeight || A4_CONSTANTS.CONTENT_HEIGHT;
      document.body.removeChild(tempIframe);
      resolve(contentHeight);
    }, 500);
  });
};
