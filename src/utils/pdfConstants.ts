
// DIN A4 constants and utilities for consistent PDF formatting
export const A4_CONSTANTS = {
  // DIN A4 dimensions at 96 DPI
  WIDTH: 794,
  HEIGHT: 1123,
  
  // Content area calculations
  MARGIN_TOP: 20,
  MARGIN_BOTTOM: 20,
  MARGIN_LEFT: 20,
  MARGIN_RIGHT: 20,
  
  // Footer dimensions
  FOOTER_HEIGHT: 60,
  FOOTER_PADDING: 10,
  
  // Calculated content area
  get CONTENT_WIDTH() {
    return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;
  },
  
  get CONTENT_HEIGHT() {
    return this.HEIGHT - this.MARGIN_TOP - this.MARGIN_BOTTOM - this.FOOTER_HEIGHT;
  },
  
  get AVAILABLE_PAGE_HEIGHT() {
    return this.CONTENT_HEIGHT - 20; // Additional buffer for page breaks
  }
};

// Standard CSS for DIN A4 pages
export const getStandardPageCSS = (baseStyles: string = ''): string => {
  return `
    ${baseStyles}
    
    /* DIN A4 Page Standards */
    body {
      margin: 0;
      padding: 0;
      width: ${A4_CONSTANTS.WIDTH}px;
      min-height: ${A4_CONSTANTS.HEIGHT}px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
      position: relative;
    }
    
    .page-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      min-height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      box-sizing: border-box;
    }
    
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f5f5f5;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #ddd;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    
    /* Multi-page specific styles */
    .page-break {
      page-break-before: always;
    }
    
    .no-break {
      page-break-inside: avoid;
    }
    
    /* Table and content formatting */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
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
    
    .info-section, 
    .signature-section {
      page-break-inside: avoid;
    }
  `;
};

// Footer content processor
export const processFooterContent = (footerHTML: string): string => {
  // Extract inner content from footer div if it exists
  const match = footerHTML.match(/<div class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i);
  if (match) {
    return match[1].trim();
  }
  
  // Remove any existing footer wrapper tags
  return footerHTML
    .replace(/<\/?div[^>]*>/gi, '')
    .trim();
};

// Content integration utility
export const integrateFooterIntoContent = (htmlContent: string, footerContent: string): string => {
  const processedFooter = processFooterContent(footerContent);
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
