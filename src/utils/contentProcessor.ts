
import { A4_CONSTANTS } from './pdfConstants';

export interface ContentComponents {
  baseStyles: string;
  mainContent: string;
  footerContent: string;
}

// Extract and process content components from HTML
export const extractAndProcessContent = (htmlContent: string): ContentComponents => {
  // Extract base styles
  const baseStyles = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
  
  // Extract footer content with improved processing
  const footerMatch = htmlContent.match(/<div class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i);
  let footerContent = '';
  
  if (footerMatch) {
    footerContent = footerMatch[1].trim();
  } else {
    // Try to extract from other footer patterns
    const altFooterMatch = htmlContent.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    if (altFooterMatch) {
      footerContent = altFooterMatch[1].trim();
    }
  }
  
  // Extract main content (everything except styles and footer)
  const mainContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '')
    .replace(/<div class="pdf-footer"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .trim();

  return { baseStyles, mainContent, footerContent };
};

// Clean and process footer content
export const processFooterContent = (footerHTML: string): string => {
  if (!footerHTML) return '';
  
  // Extract inner content from footer div if it exists
  const match = footerHTML.match(/<div class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i);
  if (match) {
    return match[1].trim();
  }
  
  // Remove any existing footer wrapper tags but preserve content
  return footerHTML
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/<\/?footer[^>]*>/gi, '')
    .trim();
};

// Integrate footer into main content with proper structure
export const integrateFooterIntoContent = (htmlContent: string, footerContent: string): string => {
  const processedFooter = processFooterContent(footerContent);
  
  if (!processedFooter) {
    return htmlContent;
  }
  
  const footerHTML = `<div class="pdf-footer">${processedFooter}</div>`;
  
  // Check if content already has a footer
  const hasExistingFooter = /<div class="pdf-footer">[\s\S]*?<\/div>/i.test(htmlContent);
  
  if (hasExistingFooter) {
    // Replace existing footer
    return htmlContent.replace(
      /<div class="pdf-footer">[\s\S]*?<\/div>/gi,
      footerHTML
    );
  } else {
    // Add footer before closing body tag or at the end
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${footerHTML}\n</body>`);
    } else {
      return htmlContent + '\n' + footerHTML;
    }
  }
};

// Measure content height using improved temporary iframe approach
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

    // Create HTML with consistent CSS structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: ${A4_CONSTANTS.WIDTH}px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }
          .page-content {
            padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM}px ${A4_CONSTANTS.MARGIN_LEFT}px;
            box-sizing: border-box;
          }
          ${components.baseStyles}
        </style>
      </head>
      <body>
        <div class="page-content">
          ${components.mainContent}
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Wait for content to render and measure
    setTimeout(() => {
      try {
        const contentHeight = doc.body?.scrollHeight || A4_CONSTANTS.CONTENT_HEIGHT;
        console.log('Measured content height:', contentHeight);
        document.body.removeChild(tempIframe);
        resolve(contentHeight);
      } catch (error) {
        console.error('Error measuring content height:', error);
        document.body.removeChild(tempIframe);
        resolve(A4_CONSTANTS.CONTENT_HEIGHT);
      }
    }, 500);
  });
};
