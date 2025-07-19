
// HTML processing utilities for PDF generation with footer support

export interface ProcessHTMLOptions {
  content: string;
  footerContent?: string;
  pageHeight?: number;
  pageWidth?: number;
}

export interface ProcessedHTML {
  processedContent: string;
  pageCount: number;
}

// Calculate approximate page height based on content
const estimateContentHeight = (element: HTMLElement): number => {
  // Create a temporary div to measure content height
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.fontSize = '12px';
  tempDiv.style.lineHeight = '1.4';
  tempDiv.innerHTML = element.innerHTML;
  
  document.body.appendChild(tempDiv);
  const height = tempDiv.offsetHeight;
  document.body.removeChild(tempDiv);
  
  return height;
};

// Process HTML content to add page-aware footers
export const processHTMLWithFooters = (options: ProcessHTMLOptions): ProcessedHTML => {
  const { content, footerContent, pageHeight = 1123, pageWidth = 794 } = options;
  
  try {
    // Create a temporary DOM to work with the content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Find or create the main content container
    let mainContent = doc.querySelector('.pdf-content');
    if (!mainContent) {
      mainContent = doc.body;
    }
    
    // Remove any existing fixed footers (they don't work in html2pdf)
    const existingFooters = doc.querySelectorAll('.pdf-footer');
    existingFooters.forEach(footer => {
      if (footer.style.position === 'fixed') {
        footer.remove();
      }
    });
    
    // If no custom footer content, try to extract from existing footer
    let finalFooterContent = footerContent;
    if (!finalFooterContent && existingFooters.length > 0) {
      finalFooterContent = existingFooters[0].innerHTML;
    }
    
    // Default footer if none provided
    if (!finalFooterContent) {
      finalFooterContent = `
        <div style="text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px;">
          Erstellt am {{ AKTUELLES_DATUM }}
        </div>
      `;
    }
    
    // For html2pdf.js, we'll use a different approach:
    // Add CSS that works better with the library
    let styleElement = doc.querySelector('style');
    if (!styleElement) {
      styleElement = doc.createElement('style');
      doc.head.appendChild(styleElement);
    }
    
    // Enhanced CSS for better PDF rendering
    const enhancedCSS = `
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        
        .pdf-page {
          page-break-after: always;
          min-height: 100vh;
          position: relative;
          padding-bottom: 60px;
        }
        
        .pdf-page:last-child {
          page-break-after: auto;
        }
        
        .pdf-page-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          background: white;
          margin-top: 20px;
        }
        
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
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
        
        p, div {
          orphans: 3;
          widows: 3;
        }
        
        img {
          max-width: 100%;
          height: auto;
        }
      }
    `;
    
    styleElement.textContent = (styleElement.textContent || '') + enhancedCSS;
    
    // Wrap content in a page structure
    if (mainContent && mainContent !== doc.body) {
      const pageDiv = doc.createElement('div');
      pageDiv.className = 'pdf-page';
      
      // Move all content into the page div
      while (mainContent.firstChild) {
        pageDiv.appendChild(mainContent.firstChild);
      }
      
      // Add footer to the page
      const footerDiv = doc.createElement('div');
      footerDiv.className = 'pdf-page-footer';
      footerDiv.innerHTML = finalFooterContent;
      pageDiv.appendChild(footerDiv);
      
      mainContent.appendChild(pageDiv);
    }
    
    // Process the final content
    let processedContent = new XMLSerializer().serializeToString(doc);
    
    // Fix HTML structure (XMLSerializer can mess up HTML5)
    processedContent = processedContent.replace('<?xml version="1.0" encoding="UTF-8"?>', '');
    processedContent = processedContent.replace('<html xmlns="http://www.w3.org/1999/xhtml">', '<html>');
    
    // Replace current date placeholder
    const currentDate = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    processedContent = processedContent.replace(/\{\{\s*AKTUELLES_DATUM\s*\}\}/g, currentDate);
    
    return {
      processedContent,
      pageCount: 1 // For now, we'll assume single page - could be enhanced later
    };
    
  } catch (error) {
    console.error('HTML processing error:', error);
    // Fallback: return original content with basic footer
    const fallbackFooter = `
      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
        Erstellt am ${new Date().toLocaleDateString('de-DE')}
      </div>
    `;
    
    return {
      processedContent: content + fallbackFooter,
      pageCount: 1
    };
  }
};

// Enhanced date formatting
export const formatGermanDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Enhanced currency formatting  
export const formatGermanCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
