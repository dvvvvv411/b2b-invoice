
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

// HTML to PDF conversion function
export const generateHTMLToPDF = async (htmlContent: string, filename?: string): Promise<void> => {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Create a temporary container for the HTML content
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    // Add CSS for proper PDF formatting including footer support
    const style = document.createElement('style');
    style.textContent = `
      /* PDF-specific styles */
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        
        /* Page break utilities */
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
        
        /* Footer styling */
        .pdf-footer {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          background: white;
        }
        
        /* Main content margin to avoid footer overlap */
        .pdf-content {
          margin-bottom: 80px;
        }
        
        /* Table styling for better PDF rendering */
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
        
        /* Prevent orphans and widows */
        p, div {
          orphans: 3;
          widows: 3;
        }
        
        /* Image handling */
        img {
          max-width: 100%;
          height: auto;
        }
      }
    `;
    
    element.appendChild(style);
    
    // Configure html2pdf options
    const options = {
      margin: [20, 15, 25, 15], // top, left, bottom, right in mm
      filename: filename || `document_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false
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
        after: '.page-break-after',
        avoid: '.page-break-inside-avoid'
      }
    };
    
    // Generate and download the PDF
    await html2pdf().set(options).from(element).save();
    
    console.log('PDF generated successfully');
    
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
