
import { generateStandardPageCSS, generateMultiPageOffsetCSS, generateHTML2PDFOptimizedCSS } from './cssGenerator';
import { ContentComponents } from './contentProcessor';

// Generate single page HTML with proper footer integration
export const generateSinglePageHTML = (
  components: ContentComponents,
  pageNumber: number = 1,
  totalPages: number = 1
): string => {
  const { baseStyles, mainContent, footerContent } = components;
  const standardCSS = generateStandardPageCSS(baseStyles);
  
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
        ${footerContent}${footerContent && totalPages > 1 ? ' | ' : ''}${totalPages > 1 ? `Seite ${pageNumber} von ${totalPages}` : ''}
      </div>
    </body>
    </html>
  `;
};

// Generate multi-page HTML with content offset and fixed footer positioning
export const generateMultiPageHTML = (
  components: ContentComponents,
  pageIndex: number,
  totalPages: number
): string => {
  const { baseStyles, mainContent, footerContent } = components;
  const offsetCSS = generateMultiPageOffsetCSS(baseStyles, pageIndex);
  
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
        ${footerContent}${footerContent ? ' | ' : ''}Seite ${pageIndex + 1} von ${totalPages}
      </div>
    </body>
    </html>
  `;
};

// Generate optimized HTML for html2pdf.js with proper structure
export const generateOptimizedHTML2PDFHTML = (components: ContentComponents): string => {
  const { baseStyles, mainContent, footerContent } = components;
  const optimizedCSS = generateHTML2PDFOptimizedCSS(baseStyles);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${optimizedCSS}</style>
    </head>
    <body>
      <div class="pdf-page">
        ${mainContent}
        <div class="pdf-footer">
          ${footerContent}
        </div>
      </div>
    </body>
    </html>
  `;
};
