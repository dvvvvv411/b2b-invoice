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