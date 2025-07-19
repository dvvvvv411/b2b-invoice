
import { generateStandardPageCSS, generateMultiPageOffsetCSS, generateHTML2PDFOptimizedCSS } from './cssGenerator';
import { ContentComponents } from './contentProcessor';

// Generate single page HTML with proper footer integration and validation
export const generateSinglePageHTML = (
  components: ContentComponents,
  pageNumber: number = 1,
  totalPages: number = 1
): string => {
  console.log('📄 Generating single page HTML...');
  
  // Validate components
  const safeComponents = {
    baseStyles: components?.baseStyles || '',
    mainContent: components?.mainContent || '<div>No content available</div>',
    footerContent: components?.footerContent || ''
  };
  
  const standardCSS = generateStandardPageCSS(safeComponents.baseStyles);
  
  // Build footer text with page information
  let footerText = safeComponents.footerContent;
  if (totalPages > 1) {
    footerText += footerText ? ' | ' : '';
    footerText += `Seite ${pageNumber} von ${totalPages}`;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${standardCSS}</style>
    </head>
    <body>
      <div class="page-content">
        ${safeComponents.mainContent}
      </div>
      ${footerText ? `<div class="pdf-footer">${footerText}</div>` : ''}
    </body>
    </html>
  `;
  
  console.log('✅ Single page HTML generated, length:', html.length);
  return html;
};

// Generate multi-page HTML with content offset and fixed footer positioning
export const generateMultiPageHTML = (
  components: ContentComponents,
  pageIndex: number,
  totalPages: number
): string => {
  console.log('📄 Generating multi-page HTML for page', pageIndex + 1, 'of', totalPages);
  
  // Validate inputs
  const safePageIndex = Math.max(0, pageIndex || 0);
  const safeTotalPages = Math.max(1, totalPages || 1);
  
  // Validate components
  const safeComponents = {
    baseStyles: components?.baseStyles || '',
    mainContent: components?.mainContent || '<div>No content available</div>',
    footerContent: components?.footerContent || ''
  };
  
  const offsetCSS = generateMultiPageOffsetCSS(safeComponents.baseStyles, safePageIndex);
  
  // Build footer text with page information
  let footerText = safeComponents.footerContent;
  footerText += footerText ? ' | ' : '';
  footerText += `Seite ${safePageIndex + 1} von ${safeTotalPages}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${offsetCSS}</style>
    </head>
    <body>
      <div class="page-content">
        ${safeComponents.mainContent}
      </div>
      <div class="pdf-footer">
        ${footerText}
      </div>
    </body>
    </html>
  `;
  
  console.log('✅ Multi-page HTML generated for page', safePageIndex + 1, 'length:', html.length);
  return html;
};

// Generate optimized HTML for html2pdf.js with proper structure and validation
export const generateOptimizedHTML2PDFHTML = (components: ContentComponents): string => {
  console.log('🔧 Generating optimized HTML for html2pdf...');
  
  // Validate components with detailed logging
  const safeComponents = {
    baseStyles: components?.baseStyles || '',
    mainContent: components?.mainContent || '<div>No content available</div>',
    footerContent: components?.footerContent || ''
  };
  
  console.log('🔧 Components validation:', {
    hasStyles: !!safeComponents.baseStyles,
    stylesLength: safeComponents.baseStyles.length,
    hasContent: !!safeComponents.mainContent,
    contentLength: safeComponents.mainContent.length,
    hasFooter: !!safeComponents.footerContent,
    footerLength: safeComponents.footerContent.length
  });
  
  const optimizedCSS = generateHTML2PDFOptimizedCSS(safeComponents.baseStyles);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${optimizedCSS}</style>
    </head>
    <body>
      <div class="pdf-page">
        ${safeComponents.mainContent}
        ${safeComponents.footerContent ? `<div class="pdf-footer">${safeComponents.footerContent}</div>` : ''}
      </div>
    </body>
    </html>
  `;
  
  console.log('✅ Optimized HTML generated, length:', html.length);
  
  // Additional validation
  if (html.length < 200) {
    console.warn('⚠️ Generated HTML seems too short, may indicate content extraction issues');
  }
  
  return html;
};
