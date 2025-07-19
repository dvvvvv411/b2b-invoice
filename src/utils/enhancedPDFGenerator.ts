
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight } from './contentProcessor';
import { generateOptimizedHTML2PDFHTML } from './htmlGenerator';

// Enhanced PDF generator with improved debugging and error handling
export const generateEnhancedMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  let tempElement: HTMLElement | null = null;
  
  try {
    console.log('🚀 Starting enhanced multi-page PDF generation');
    console.log('📄 HTML content length:', htmlContent.length);
    
    // Dynamically import html2pdf with better error handling
    let html2pdf;
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default || html2pdfModule;
      console.log('✅ html2pdf loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to import html2pdf:', importError);
      throw new Error('PDF-Bibliothek konnte nicht geladen werden');
    }
    
    // Extract and process content components with validation
    const components = extractAndProcessContent(htmlContent);
    console.log('🔍 Extracted components:', { 
      hasStyles: !!components.baseStyles, 
      hasContent: !!components.mainContent.length, 
      hasFooter: !!components.footerContent.length,
      stylesLength: components.baseStyles.length,
      contentLength: components.mainContent.length,
      footerLength: components.footerContent.length
    });
    
    if (!components.mainContent.trim()) {
      console.warn('⚠️ No main content found, using original HTML');
      components.mainContent = htmlContent;
    }
    
    // Create optimized HTML document for html2pdf
    const optimizedHTML = generateOptimizedHTML2PDFHTML(components);
    console.log('📋 Optimized HTML length:', optimizedHTML.length);
    
    // Create element with improved setup
    tempElement = document.createElement('div');
    tempElement.innerHTML = optimizedHTML;
    
    // Add element to DOM with better positioning and visibility
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
    
    // Enhanced html2pdf options with better error handling
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
          // Ensure all styles are properly applied in the clone
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

    console.log('⚙️ Starting PDF generation with html2pdf');
    
    // Generate PDF with timeout and error handling
    const pdfPromise = html2pdf().set(options).from(tempElement).save();
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
    });
    
    await Promise.race([pdfPromise, timeoutPromise]);
    console.log('✅ Enhanced multi-page PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Enhanced multi-page PDF generation failed:', error);
    
    // Implement fallback PDF generation
    console.log('🔄 Attempting fallback PDF generation');
    try {
      await generateFallbackPDF(htmlContent, filename);
      console.log('✅ Fallback PDF generated successfully');
    } catch (fallbackError) {
      console.error('❌ Fallback PDF generation also failed:', fallbackError);
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

// Fallback PDF generation using simplified approach
const generateFallbackPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('🔄 Starting fallback PDF generation');
    
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Create a simple, clean HTML structure
    const fallbackHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .fallback-content {
            max-width: 100%;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="fallback-content">
          ${htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')}
        </div>
      </body>
      </html>
    `;
    
    const fallbackElement = document.createElement('div');
    fallbackElement.innerHTML = fallbackHTML;
    
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
    console.error('❌ Fallback PDF generation failed:', error);
    throw error;
  }
};

// Generate PDF with automatic page splitting and enhanced error handling
export const generateAutoSplitPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    console.log('🚀 Starting auto-split PDF generation');
    
    // Extract and process content
    const components = extractAndProcessContent(htmlContent);
    
    // Measure content to determine if splitting is needed
    const contentHeight = await measureContentHeight(components);
    const needsMultiplePages = contentHeight > A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT;
    
    console.log('📊 Content analysis:', {
      contentHeight,
      availableHeight: A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT,
      needsMultiplePages,
      estimatedPages: Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT)
    });
    
    // Generate PDF with enhanced generator
    await generateEnhancedMultiPagePDF(htmlContent, filename);
    
  } catch (error) {
    console.error('❌ Auto-split PDF generation failed:', error);
    throw new Error('PDF-Generierung mit automatischer Seitenaufteilung fehlgeschlagen.');
  }
};
