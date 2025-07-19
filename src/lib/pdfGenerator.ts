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

// PDF Download Helper - simplified for now
export const downloadPDF = async (data: PDFData, filename?: string) => {
  // For now, create a simple text-based download
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
};