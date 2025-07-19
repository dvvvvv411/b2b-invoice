
import { A4_CONSTANTS } from './pdfConstants';

// Generate standard page CSS for single page documents
export const generateStandardPageCSS = (baseStyles: string = ''): string => {
  return `
    ${baseStyles}
    
    /* Enhanced DIN A4 Page Standards */
    * {
      box-sizing: border-box;
    }
    
    html {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
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
      overflow-x: hidden;
    }
    
    .page-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      min-height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      position: relative;
      z-index: 1;
    }
    
    .pdf-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f8f9fa;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: #666;
    }
    
    /* Enhanced table and content formatting */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .info-section, 
    .signature-section {
      page-break-inside: avoid;
      margin-bottom: 15px;
    }
    
    /* Print optimizations */
    @media print {
      body { margin: 0; }
      .pdf-footer { 
        position: fixed; 
        bottom: 0; 
      }
    }
  `;
};

// Generate CSS with content offset for multi-page documents
export const generateMultiPageOffsetCSS = (baseStyles: string = '', pageIndex: number): string => {
  const offsetY = pageIndex * A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT;
  
  return `
    ${baseStyles}
    
    /* Multi-page DIN A4 with content offset */
    * {
      box-sizing: border-box;
    }
    
    html {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: ${A4_CONSTANTS.WIDTH}px;
      height: ${A4_CONSTANTS.HEIGHT}px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
      position: relative;
      overflow: hidden;
    }
    
    .page-content {
      position: absolute;
      top: ${A4_CONSTANTS.MARGIN_TOP - offsetY}px;
      left: ${A4_CONSTANTS.MARGIN_LEFT}px;
      right: ${A4_CONSTANTS.MARGIN_RIGHT}px;
      width: ${A4_CONSTANTS.CONTENT_WIDTH}px;
      transform: translateY(0);
    }
    
    .pdf-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f8f9fa;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: #666;
    }
  `;
};

// Generate optimized CSS for html2pdf.js with enhanced compatibility
export const generateHTML2PDFOptimizedCSS = (baseStyles: string = ''): string => {
  return `
    ${baseStyles}
    
    /* html2pdf.js Optimized CSS */
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    
    .pdf-page {
      width: ${A4_CONSTANTS.WIDTH}px;
      min-height: ${A4_CONSTANTS.HEIGHT}px;
      margin: 0 auto;
      position: relative;
      background: white;
      page-break-after: always;
    }
    
    .pdf-content {
      padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM + A4_CONSTANTS.FOOTER_HEIGHT + 20}px ${A4_CONSTANTS.MARGIN_LEFT}px;
      min-height: ${A4_CONSTANTS.CONTENT_HEIGHT}px;
      position: relative;
      z-index: 1;
    }
    
    .pdf-footer {
      position: absolute;
      bottom: ${A4_CONSTANTS.MARGIN_BOTTOM}px;
      left: 0;
      right: 0;
      height: ${A4_CONSTANTS.FOOTER_HEIGHT}px;
      background: #f8f9fa;
      padding: ${A4_CONSTANTS.FOOTER_PADDING}px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      color: #666;
      margin: 0 ${A4_CONSTANTS.MARGIN_LEFT}px;
      width: calc(100% - ${A4_CONSTANTS.MARGIN_LEFT + A4_CONSTANTS.MARGIN_RIGHT}px);
    }
    
    /* Enhanced content formatting for PDF */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f5f5f5 !important;
      font-weight: bold;
    }
    
    .info-section, 
    .signature-section {
      page-break-inside: avoid;
      margin-bottom: 15px;
    }
    
    .page-break-before {
      page-break-before: always;
    }
    
    .page-break-after {
      page-break-after: always;
    }
    
    .no-break,
    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
    
    /* Ensure text and colors render properly */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      margin: 1em 0 0.5em 0;
    }
    
    p {
      margin: 0.5em 0;
      orphans: 3;
      widows: 3;
    }
    
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }
  `;
};
