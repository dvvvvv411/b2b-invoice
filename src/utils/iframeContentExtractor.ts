
/**
 * Extracts the complete HTML content from an iframe, including all styles
 * This ensures the PDF matches the live preview exactly
 */
export const extractIframeContent = (iframe: HTMLIFrameElement): string => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Cannot access iframe content');
    }

    // Get the complete HTML including DOCTYPE and all styles
    const doctype = iframeDoc.doctype ? 
      `<!DOCTYPE ${iframeDoc.doctype.name}${iframeDoc.doctype.publicId ? ` PUBLIC "${iframeDoc.doctype.publicId}"` : ''}${iframeDoc.doctype.systemId ? ` "${iframeDoc.doctype.systemId}"` : ''}>` : 
      '<!DOCTYPE html>';

    // Clone the entire document to avoid modifying the original
    const clonedDoc = iframeDoc.cloneNode(true) as Document;
    
    // Ensure all styles are inlined and preserved
    const styleSheets = Array.from(iframeDoc.styleSheets);
    const inlineStyles: string[] = [];
    
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          inlineStyles.push(rule.cssText);
        });
      } catch (e) {
        // Cross-origin stylesheets might throw errors, skip them
        console.warn('Could not access stylesheet rules:', e);
      }
    });

    // Add any additional inline styles to the head
    if (inlineStyles.length > 0) {
      const styleElement = clonedDoc.createElement('style');
      styleElement.textContent = inlineStyles.join('\n');
      clonedDoc.head.appendChild(styleElement);
    }

    // Get the complete HTML
    const htmlContent = clonedDoc.documentElement.outerHTML;
    
    return doctype + '\n' + htmlContent;
  } catch (error) {
    console.error('Error extracting iframe content:', error);
    throw new Error('Failed to extract iframe content for PDF generation');
  }
};

/**
 * Simplified PDF generation function that uses iframe content directly
 */
export const generatePDFFromIframe = async (iframe: HTMLIFrameElement, filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Extract the complete HTML content from the iframe
    const htmlContent = extractIframeContent(iframe);
    
    // Create a temporary container for the HTML content
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    // Configure html2pdf options optimized for the extracted content
    const options = {
      margin: [15, 10, 20, 10], // top, left, bottom, right in mm
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after, .pdf-page',
        avoid: '.page-break-inside-avoid'
      }
    };
    
    // Generate and download the PDF
    await html2pdf().set(options).from(element).save();
    
    console.log('PDF generated successfully from iframe content');
    
  } catch (error) {
    console.error('PDF generation from iframe failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};
