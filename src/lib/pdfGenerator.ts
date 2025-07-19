// PDF Type definitions
export type PDFType = 'rechnung' | 'kaufvertrag' | 'uebernahmebestaetigung';

export interface PDFData {
  type: PDFType;
  kunde?: any;
  kanzlei?: any;
  auto?: any;
  bankkonto?: any;
  spedition?: any;
  insolventesUnternehmen?: any;
  customData?: Record<string, any>;
}

// German-style PDF formatting
export const germanDateFormat = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const germanCurrencyFormat = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Enhanced HTML to PDF conversion function with footer support
export const generateHTMLToPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf and our HTML processor
    const html2pdf = (await import('html2pdf.js')).default;
    const { processHTMLWithFooters } = await import('./htmlProcessor');
    
    // Process the HTML content to add proper footers
    const { processedContent } = processHTMLWithFooters({
      content: htmlContent,
      pageHeight: 1123, // A4 height in pixels at 96 DPI
      pageWidth: 794     // A4 width in pixels at 96 DPI
    });
    
    // Create a temporary container for the processed HTML content
    const element = document.createElement('div');
    element.innerHTML = processedContent;
    
    // Configure html2pdf options with enhanced settings
    const options = {
      margin: [15, 10, 15, 10], // top, left, bottom, right in mm - reduced bottom margin since we handle footer
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        logging: false,
        removeContainer: true
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
    
    console.log('PDF generated successfully with enhanced footer support');
    
  } catch (error) {
    console.error('HTML to PDF conversion failed:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

// PDF Generation Helper (existing function)
export const generatePDF = async (data: PDFData): Promise<Blob> => {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    
    // Import the specific template based on PDF type
    if (data.type === 'rechnung') {
      const { RechnungPDF } = await import('./templates/RechnungPDF');
      return pdf(RechnungPDF({ data })).toBlob();
    }
    
    // Fallback for other types - create a simple text document
    throw new Error('Template not implemented yet');
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// PDF Download Helper (existing function)
export const downloadPDF = async (data: PDFData, filename?: string) => {
  try {
    const blob = await generatePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${data.type}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback to text file
    const content = `
PDF-Dokument: ${data.type.toUpperCase()}
Datum: ${germanDateFormat(new Date())}

${data.kanzlei ? `Kanzlei: ${data.kanzlei.name}` : ''}
${data.kunde ? `Kunde: ${data.kunde.name}` : ''}
${data.auto ? `Fahrzeug: ${data.auto.marke} ${data.auto.modell}` : ''}

Dieses PDF wurde am ${germanDateFormat(new Date())} generiert.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${data.type}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
