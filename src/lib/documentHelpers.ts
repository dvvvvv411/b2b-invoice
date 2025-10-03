export const formatIban = (iban: string): string => {
  return iban.replace(/(.{4})/g, '$1 ').trim();
};

export const formatGermanDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('de-DE');
};

export const formatCurrency = (amount: number): string => {
  return amount.toFixed(2).replace('.', ',') + ' €';
};

export const calculatePrices = (nettopreis: number) => {
  const bruttopreis = nettopreis * 1.19;
  const mwst = bruttopreis - nettopreis; // Important: difference, not percentage calculation
  
  return {
    nettopreis,
    bruttopreis,
    mwst,
  };
};
