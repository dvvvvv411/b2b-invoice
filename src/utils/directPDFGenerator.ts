
import { A4_CONSTANTS } from './pdfConstants';

// Direct PDF generator that bypasses content extraction to avoid double processing
export const generateDirectPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  let tempElement: HTMLElement | null = null;
  
  try {
    console.log('🚀 Starting direct PDF generation');
    console.log('📄 HTML content length:', htmlContent.length);
    
    // Dynamically import html2pdf with error handling
    let html2pdf;
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default || html2pdfModule;
      console.log('✅ html2pdf loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to import html2pdf:', importError);
      throw new Error('PDF-Bibliothek konnte nicht geladen werden');
    }
    
    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
      throw new Error('Kein gültiger HTML-Inhalt zum Generieren des PDFs');
    }
    
    // Create element directly with the processed content (no double processing)
    tempElement = document.createElement('div');
    tempElement.innerHTML = htmlContent;
    
    // Add element to DOM with proper positioning
    tempElement.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: 0 !important;
      width: ${A4_CONSTANTS.WIDTH}px !important;
      visibility: hidden !important;
      pointer-events: none !important;
      z-index: -1 !important;
    `;
    
    document.body.appendChild(tempElement);
    console.log('✅ Element added to DOM');
    
    // Wait for DOM to settle and fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if fonts are loaded
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
        console.log('✅ Fonts loaded');
      } catch (fontError) {
        console.warn('⚠️ Font loading warning:', fontError);
      }
    }
    
    // Direct html2pdf options without complex processing
    const options = {
      margin: 0,
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.95 
      },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: A4_CONSTANTS.WIDTH,
        height: undefined,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          console.log('🔄 Canvas cloning document');
          const clonedElement = clonedDoc.body.firstElementChild;
          if (clonedElement) {
            (clonedElement as HTMLElement).style.visibility = 'visible';
            (clonedElement as HTMLElement).style.position = 'static';
          }
        }
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

    console.log('⚙️ Starting direct PDF generation with html2pdf');
    
    // Generate PDF with timeout
    const pdfPromise = html2pdf().set(options).from(tempElement).save();
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
    });
    
    await Promise.race([pdfPromise, timeoutPromise]);
    console.log('✅ Direct PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Direct PDF generation failed:', error);
    
    // Simple fallback without complex processing
    console.log('🔄 Attempting simple fallback');
    try {
      await generateSimpleFallbackPDF(htmlContent, filename);
      console.log('✅ Simple fallback PDF generated successfully');
    } catch (fallbackError) {
      console.error('❌ Simple fallback also failed:', fallbackError);
      throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  } finally {
    // Clean up DOM element
    if (tempElement && tempElement.parentNode) {
      document.body.removeChild(tempElement);
      console.log('🧹 Cleaned up temporary DOM element');
    }
  }
};

// Simple fallback that doesn't process content
const generateSimpleFallbackPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('🔄 Starting simple fallback PDF generation');
    
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Use content as-is without any processing
    const fallbackElement = document.createElement('div');
    fallbackElement.innerHTML = htmlContent;
    
    const fallbackOptions = {
      margin: [10, 10, 10, 10],
      filename: filename || `fallback_document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.85 },
      html2canvas: { 
        scale: 1,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    await html2pdf().set(fallbackOptions).from(fallbackElement).save();
    
  } catch (error) {
    console.error('❌ Simple fallback PDF generation failed:', error);
    throw error;
  }
};
