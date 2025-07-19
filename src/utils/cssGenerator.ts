
import { A4_CONSTANTS } from './pdfConstants';

// Generate standard CSS for PDF pages with proper footer handling
export const generateStandardPageCSS = (baseStyles: string = ''): string => {
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
      box-sizing: border-box;
    }
    
    .page-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      min-height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      box-sizing: border-box;
      position: relative;
    }
    
    /* Standardized Footer CSS */
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

// Generate CSS for multi-page with content offset
export const generateMultiPageOffsetCSS = (baseStyles: string, pageIndex: number): string => {
  const standardCSS = generateStandardPageCSS(baseStyles);
  
  return `
    ${standardCSS}
    
    /* Multi-page offset styles */
    .page-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      overflow: hidden;
      box-sizing: border-box;
      transform: translateY(-${pageIndex * A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT}px);
      position: relative;
    }
    
    /* Ensure footer stays at bottom */
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
      transform: translateY(${pageIndex * A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT}px);
    }
  `;
};

// Generate optimized CSS for html2pdf.js
export const generateHTML2PDFOptimizedCSS = (baseStyles: string = ''): string => {
  return `
    ${baseStyles}
    
    /* Optimized CSS for html2pdf.js */
    body {
      margin: 0;
      padding: 0;
      width: ${A4_CONSTANTS.WIDTH}px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    
    .pdf-page {
      width: ${A4_CONSTANTS.WIDTH}px;
      min-height: ${A4_CONSTANTS.HEIGHT - 60}px;
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
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
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f5f5f5;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #ddd;
      page-break-inside: avoid;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Prevent breaking inside these elements */
    .info-section, 
    .signature-section, 
    table,
    .no-break {
      page-break-inside: avoid;
    }
    
    /* Force page breaks where needed */
    .page-break {
      page-break-before: always;
    }
    
    /* Table formatting */
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
  `;
};
