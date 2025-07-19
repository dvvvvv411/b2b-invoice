
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight } from './contentProcessor';
import { generateOptimizedHTML2PDFHTML } from './htmlGenerator';

// Enhanced PDF generator with improved footer handling
export const generateEnhancedMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    console.log('Starting enhanced multi-page PDF generation');
    
    // Extract and process content components
    const components = extractAndProcessContent(htmlContent);
    console.log('Extracted components:', { 
      hasStyles: !!components.baseStyles, 
      hasContent: !!components.mainContent, 
      hasFooter: !!components.footerContent 
    });
    
    // Create optimized HTML document for html2pdf
    const optimizedHTML = generateOptimizedHTML2PDFHTML(components);
    
    // Enhanced html2pdf options for better multi-page support
    const options = {
      margin: 0, // Remove margins to control layout ourselves
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 1.5,  // Improved scale for better quality
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: A4_CONSTANTS.WIDTH,
        height: undefined, // Let it calculate height automatically
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'px', 
        format: [A4_CONSTANTS.WIDTH, A4_CONSTANTS.HEIGHT],
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: 'css',
        before: '.page-break',
        avoid: '.no-break'
      }
    };

    // Create element and generate PDF
    const element = document.createElement('div');
    element.innerHTML = optimizedHTML;
    
    // Add to DOM temporarily for proper rendering
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.visibility = 'hidden';
    document.body.appendChild(element);
    
    try {
      await html2pdf().set(options).from(element).save();
      console.log('Enhanced multi-page PDF generated successfully');
    } finally {
      // Clean up
      document.body.removeChild(element);
    }
    
  } catch (error) {
    console.error('Enhanced multi-page PDF generation failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// Generate PDF with automatic page splitting
export const generateAutoSplitPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('Starting auto-split PDF generation');
    
    // Extract and process content
    const components = extractAndProcessContent(htmlContent);
    
    // Measure content to determine if splitting is needed
    const contentHeight = await measureContentHeight(components);
    const needsMultiplePages = contentHeight > A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT;
    
    console.log('Content analysis:', {
      contentHeight,
      availableHeight: A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT,
      needsMultiplePages
    });
    
    // Generate PDF with enhanced generator
    await generateEnhancedMultiPagePDF(htmlContent, filename);
    
  } catch (error) {
    console.error('Auto-split PDF generation failed:', error);
    throw new Error('PDF-Generierung mit automatischer Seitenaufteilung fehlgeschlagen.');
  }
};
