// Utility functions for number and date formatting

export const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return '0,00 €';
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatKilometer = (km: number | null): string => {
  if (km === null || km === undefined) return '0';
  
  return new Intl.NumberFormat('de-DE').format(km);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${year}`;
};

export const parseFormattedNumber = (value: string): number | null => {
  if (!value || value.trim() === '') return null;
  
  // Remove all non-numeric characters except decimal separator
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? null : parsed;
};

/**
 * Formatiert eine IBAN mit Leerzeichen alle 4 Zeichen
 * Input: "DE89370400440532013001"
 * Output: "DE89 3704 0044 0532 0130 01"
 */
export const formatIBAN = (iban: string): string => {
  if (!iban) return '';
  
  // Entfernt alle Leerzeichen und konvertiert zu Großbuchstaben
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  
  // Fügt Leerzeichen alle 4 Zeichen ein
  return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN;
};

/**
 * Entfernt Formatierung aus IBAN (für Validierung/Speicherung)
 * Input: "DE89 3704 0044 0532 0130 01"
 * Output: "DE89370400440532013001"
 */
export const unformatIBAN = (iban: string): string => {
  if (!iban) return '';
  return iban.replace(/\s/g, '').toUpperCase();
};