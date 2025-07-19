
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight } from './contentProcessor';
import { generateOptimizedHTML2PDFHTML } from './htmlGenerator';

// Enhanced PDF generator with comprehensive debugging and error handling
export const generateEnhancedMultiPagePDF = async (htmlContent: string, filename?: string): Promise<void> => {
  console.log('=== PDF Generation Debug Start ===');
  console.log('Input content length:', htmlContent.length);
  console.log('Requested filename:', filename);

  try {
    // Step 1: Dynamic import with detailed logging
    console.log('Step 1: Importing html2pdf...');
    let html2pdf;
    
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default || html2pdfModule;
      console.log('✓ html2pdf imported successfully', typeof html2pdf);
    } catch (importError) {
      console.error('✗ html2pdf import failed:', importError);
      throw new Error('html2pdf library could not be loaded. Please refresh the page and try again.');
    }

    // Step 2: Process content
    console.log('Step 2: Processing content...');
    const components = extractAndProcessContent(htmlContent);
    console.log('✓ Content processed:', { 
      hasStyles: !!components.baseStyles, 
      hasContent: !!components.mainContent, 
      hasFooter: !!components.footerContent,
      contentLength: components.mainContent.length,
      footerLength: components.footerContent.length
    });

    // Step 3: Generate optimized HTML
    console.log('Step 3: Generating optimized HTML...');
    const optimizedHTML = generateOptimizedHTML2PDFHTML(components);
    console.log('✓ Optimized HTML generated, length:', optimizedHTML.length);

    // Step 4: Create DOM element
    console.log('Step 4: Creating DOM element...');
    const element = document.createElement('div');
    element.innerHTML = optimizedHTML;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.visibility = 'hidden';
    element.style.width = `${A4_CONSTANTS.WIDTH}px`;
    element.style.minHeight = `${A4_CONSTANTS.HEIGHT}px`;
    
    document.body.appendChild(element);
    console.log('✓ Element added to DOM');

    // Step 5: Configure html2pdf options
    const finalFilename = filename || `document_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('Step 5: Configuring options for filename:', finalFilename);

    const options = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: finalFilename,
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
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4',
        orientation: 'portrait',
        compress: true,
        precision: 2
      },
      pagebreak: { 
        mode: ['avoid-all', 'css'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: '.no-break, .page-break-inside-avoid'
      }
    };

    console.log('✓ Options configured:', JSON.stringify(options, null, 2));

    // Step 6: Generate PDF with enhanced error handling
    console.log('Step 6: Generating PDF...');
    
    try {
      // Test if html2pdf is callable
      if (typeof html2pdf !== 'function') {
        throw new Error('html2pdf is not a function');
      }

      // Create html2pdf worker
      const worker = html2pdf();
      console.log('✓ Worker created');

      // Configure worker
      const configuredWorker = worker.set(options);
      console.log('✓ Worker configured');

      // Set source
      const sourceWorker = configuredWorker.from(element);
      console.log('✓ Source set');

      // Generate and save
      console.log('Attempting to save PDF...');
      await sourceWorker.save();
      console.log('✓ PDF save() called successfully');

      // Additional verification - check if file was created
      setTimeout(() => {
        console.log('PDF generation process completed');
      }, 1000);

    } catch (pdfError) {
      console.error('✗ PDF generation error:', pdfError);
      
      // Fallback: Try alternative approach
      console.log('Attempting fallback PDF generation...');
      await generateFallbackPDF(optimizedHTML, finalFilename);
    }

    // Step 7: Cleanup
    console.log('Step 7: Cleaning up...');
    try {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
        console.log('✓ Element removed from DOM');
      }
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
    }

    console.log('=== PDF Generation Debug End ===');
    
  } catch (error) {
    console.error('=== PDF Generation Failed ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    // Try one more fallback approach
    try {
      console.log('Attempting final fallback...');
      await generateSimpleFallbackPDF(htmlContent, filename);
    } catch (fallbackError) {
      console.error('All PDF generation methods failed:', fallbackError);
      throw new Error(`PDF-Generierung fehlgeschlagen: ${error.message}. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.`);
    }
  }
};

// Fallback PDF generation using different approach
const generateFallbackPDF = async (htmlContent: string, filename: string): Promise<void> => {
  console.log('=== Fallback PDF Generation ===');
  
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Simpler configuration
    const fallbackOptions = {
      margin: 1,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Create temporary element with simpler structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '210mm';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    document.body.appendChild(tempDiv);
    
    try {
      await html2pdf().set(fallbackOptions).from(tempDiv).save();
      console.log('✓ Fallback PDF generated successfully');
    } finally {
      document.body.removeChild(tempDiv);
    }
    
  } catch (fallbackError) {
    console.error('Fallback PDF generation failed:', fallbackError);
    throw fallbackError;
  }
};

// Simple fallback - create downloadable HTML file if PDF fails
const generateSimpleFallbackPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  console.log('=== Simple Fallback: Creating HTML file ===');
  
  const htmlFilename = (filename || 'document.pdf').replace('.pdf', '.html');
  
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Document</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        .print-info {
          background: #f0f0f0;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="print-info no-print">
        <strong>Hinweis:</strong> Die PDF-Generierung war nicht möglich. 
        Verwenden Sie Strg+P (Cmd+P auf Mac) um diese Seite als PDF zu drucken.
      </div>
      ${htmlContent}
    </body>
    </html>
  `;

  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = htmlFilename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  console.log('✓ HTML file created as fallback:', htmlFilename);
  
  // Show user instructions
  throw new Error('PDF konnte nicht generiert werden. Eine HTML-Datei wurde stattdessen heruntergeladen. Verwenden Sie Strg+P um diese als PDF zu drucken.');
};

// Auto-split PDF generation with enhanced debugging
export const generateAutoSplitPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  console.log('=== Auto-Split PDF Generation ===');
  
  try {
    const components = extractAndProcessContent(htmlContent);
    const contentHeight = await measureContentHeight(components);
    const needsMultiplePages = contentHeight > A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT;
    
    console.log('Content analysis:', {
      contentHeight,
      availableHeight: A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT,
      needsMultiplePages,
      estimatedPages: Math.ceil(contentHeight / A4_CONSTANTS.AVAILABLE_PAGE_HEIGHT)
    });
    
    await generateEnhancedMultiPagePDF(htmlContent, filename);
    
  } catch (error) {
    console.error('Auto-split PDF generation failed:', error);
    throw error;
  }
};
