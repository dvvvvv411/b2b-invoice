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

// PDF Generation Helper
export const generatePDF = async (data: PDFData): Promise<Blob> => {
  try {
    const { pdf } = await import('@react-pdf/renderer');
    
    // Import the specific template based on PDF type
    if (data.type === 'rechnung') {
      const { RechnungPDF } = await import('./templates/RechnungPDF');
      const { createElement } = await import('react');
      return pdf(createElement(RechnungPDF, { data })).toBlob();
    }
    
    // Fallback for other types - create a simple text document
    throw new Error('Template not implemented yet');
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// PDF Download Helper
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