import { Kanzlei } from '@/hooks/useKanzleien';
import { InsolventesUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { Kunde } from '@/hooks/useKunden';
import { Auto } from '@/hooks/useAutos';
import { Bankkonto } from '@/hooks/useBankkonten';
import { Spedition } from '@/hooks/useSpeditionen';

export interface SelectedData {
  kanzlei?: Kanzlei;
  insolventes?: InsolventesUnternehmen;
  kunde?: Kunde;
  auto?: Auto;
  bankkonto?: Bankkonto;
  spedition?: Spedition;
}

// HELPER FUNCTIONS
const formatPrice = (amount: number | null | undefined): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('de-DE');
};

const formatKilometer = (km: number | null | undefined): string => {
  return new Intl.NumberFormat('de-DE').format(km || 0);
};

const formatErstzulassung = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const generateRechnungsnummer = (): string => {
  const randomNumber = Math.floor(Math.random() * 100000);
  return `IN-0${String(randomNumber).padStart(5, '0')}`;
};

const numberToWords = (num: number | null | undefined): string => {
  if (!num) return 'null';
  
  // Vereinfachte Version - nur für ganze Zahlen
  const ones = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  const teens = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  
  const integer = Math.floor(num);
  
  if (integer === 0) return 'null';
  if (integer < 10) return ones[integer];
  if (integer < 20) return teens[integer - 10];
  if (integer < 100) return tens[Math.floor(integer / 10)] + (integer % 10 ? ones[integer % 10] : '');
  if (integer < 1000) return ones[Math.floor(integer / 100)] + 'hundert' + (integer % 100 ? numberToWords(integer % 100) : '');
  
  return integer.toString(); // Fallback für komplexere Zahlen
};

export const replacePlaceholdersWithRealData = (htmlContent: string, selectedData: SelectedData): string => {
  if (!selectedData) return htmlContent;
  
  let processedHtml = htmlContent;
  
  // KANZLEI DATEN
  if (selectedData.kanzlei) {
    processedHtml = processedHtml.replace(/\{\{KANZLEI_NAME\}\}/g, selectedData.kanzlei.name || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_STRASSE\}\}/g, selectedData.kanzlei.strasse || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_PLZ\}\}/g, selectedData.kanzlei.plz || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_STADT\}\}/g, selectedData.kanzlei.stadt || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_TELEFON\}\}/g, selectedData.kanzlei.telefon || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_FAX\}\}/g, selectedData.kanzlei.fax || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_EMAIL\}\}/g, selectedData.kanzlei.email || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_WEBSITE\}\}/g, selectedData.kanzlei.website || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_UST_ID\}\}/g, selectedData.kanzlei.ust_id || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_REGISTERGERICHT\}\}/g, selectedData.kanzlei.registergericht || '');
    processedHtml = processedHtml.replace(/\{\{KANZLEI_REGISTER_NR\}\}/g, selectedData.kanzlei.register_nr || '');
    processedHtml = processedHtml.replace(/\{\{RECHTSANWALT_NAME\}\}/g, selectedData.kanzlei.rechtsanwalt || '');
  }
  
  // INSOLVENTES UNTERNEHMEN DATEN
  if (selectedData.insolventes) {
    processedHtml = processedHtml.replace(/\{\{INSOLVENTES_UNTERNEHMEN_NAME\}\}/g, selectedData.insolventes.name || '');
    processedHtml = processedHtml.replace(/\{\{INSOLVENTES_UNTERNEHMEN_AMTSGERICHT\}\}/g, selectedData.insolventes.amtsgericht || '');
    processedHtml = processedHtml.replace(/\{\{INSOLVENTES_UNTERNEHMEN_AKTENZEICHEN\}\}/g, selectedData.insolventes.aktenzeichen || '');
    processedHtml = processedHtml.replace(/\{\{INSOLVENTES_UNTERNEHMEN_HANDELSREGISTER\}\}/g, selectedData.insolventes.handelsregister || '');
    processedHtml = processedHtml.replace(/\{\{INSOLVENTES_UNTERNEHMEN_ADRESSE\}\}/g, selectedData.insolventes.adresse || '');
  }
  
  // KUNDEN DATEN
  if (selectedData.kunde) {
    processedHtml = processedHtml.replace(/\{\{KUNDE_NAME\}\}/g, selectedData.kunde.name || '');
    processedHtml = processedHtml.replace(/\{\{KUNDE_ADRESSE\}\}/g, selectedData.kunde.adresse || '');
    processedHtml = processedHtml.replace(/\{\{KUNDE_PLZ\}\}/g, selectedData.kunde.plz || '');
    processedHtml = processedHtml.replace(/\{\{KUNDE_STADT\}\}/g, selectedData.kunde.stadt || '');
    processedHtml = processedHtml.replace(/\{\{KUNDE_GESCHAEFTSFUEHRER\}\}/g, selectedData.kunde.geschaeftsfuehrer || '');
  }
  
  // AUTO DATEN
  if (selectedData.auto) {
    processedHtml = processedHtml.replace(/\{\{AUTO_MARKE\}\}/g, selectedData.auto.marke || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_MODELL\}\}/g, selectedData.auto.modell || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_FAHRGESTELL\}\}/g, selectedData.auto.fahrgestell_nr || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_DEKRA\}\}/g, selectedData.auto.dekra_bericht_nr || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_ERSTZULASSUNG\}\}/g, formatErstzulassung(selectedData.auto.erstzulassung) || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_KILOMETER\}\}/g, formatKilometer(selectedData.auto.kilometer) || '');
    processedHtml = processedHtml.replace(/\{\{AUTO_PREIS_NETTO\}\}/g, formatPrice(selectedData.auto.einzelpreis_netto) || '');
    
    // AUTOMATISCHE BERECHNUNGEN
    const netto = selectedData.auto.einzelpreis_netto || 0;
    const mwst = netto * 0.19;
    const brutto = netto * 1.19;
    const skonto = brutto * 0.97;
    
    processedHtml = processedHtml.replace(/\{\{SUMME_NETTO\}\}/g, formatPrice(netto));
    processedHtml = processedHtml.replace(/\{\{SUMME_MWST\}\}/g, formatPrice(mwst));
    processedHtml = processedHtml.replace(/\{\{SUMME_BRUTTO\}\}/g, formatPrice(brutto));
    processedHtml = processedHtml.replace(/\{\{SKONTO_BETRAG\}\}/g, formatPrice(skonto));
    processedHtml = processedHtml.replace(/\{\{SUMME_NETTO_WORTEN\}\}/g, numberToWords(netto));
  }
  
  // BANKKONTO DATEN
  if (selectedData.bankkonto) {
    processedHtml = processedHtml.replace(/\{\{BANKKONTO_NAME\}\}/g, selectedData.bankkonto.kontoname || '');
    processedHtml = processedHtml.replace(/\{\{BANKKONTO_IBAN\}\}/g, selectedData.bankkonto.iban || '');
    processedHtml = processedHtml.replace(/\{\{BANKKONTO_BIC\}\}/g, selectedData.bankkonto.bic || '');
  }
  
  // SPEDITION DATEN
  if (selectedData.spedition) {
    processedHtml = processedHtml.replace(/\{\{SPEDITION_NAME\}\}/g, selectedData.spedition.name || '');
    processedHtml = processedHtml.replace(/\{\{SPEDITION_STRASSE\}\}/g, selectedData.spedition.strasse || '');
    
    // PLZ und Stadt aus dem kombinierten Feld extrahieren (Format: "12345 Berlin")
    const plzStadtMatch = selectedData.spedition.plz_stadt?.match(/^(\d{5})\s+(.+)$/);
    const plz = plzStadtMatch ? plzStadtMatch[1] : '';
    const stadt = plzStadtMatch ? plzStadtMatch[2] : selectedData.spedition.plz_stadt || '';
    
    processedHtml = processedHtml.replace(/\{\{SPEDITION_PLZ\}\}/g, plz);
    processedHtml = processedHtml.replace(/\{\{SPEDITION_STADT\}\}/g, stadt);
  }
  
  // AUTOMATISCHE DATEN
  const heute = new Date();
  const rechnungsNr = generateRechnungsnummer();
  
  processedHtml = processedHtml.replace(/\{\{AKTUELLES_DATUM\}\}/g, formatDate(heute));
  processedHtml = processedHtml.replace(/\{\{RECHNUNGSNUMMER\}\}/g, rechnungsNr);
  processedHtml = processedHtml.replace(/\{\{VERWENDUNGSZWECK\}\}/g, rechnungsNr.replace('IN-0', ''));
  processedHtml = processedHtml.replace(/\{\{LIEFERDATUM\}\}/g, formatDate(new Date(heute.getTime() + 7 * 24 * 60 * 60 * 1000)));
  processedHtml = processedHtml.replace(/\{\{RECHNUNGSDATUM\}\}/g, formatDate(heute));
  
  if (selectedData.kunde) {
    processedHtml = processedHtml.replace(/\{\{LIEFERADRESSE\}\}/g, `${selectedData.kunde.adresse}, ${selectedData.kunde.plz} ${selectedData.kunde.stadt}`);
  }
  
  return processedHtml;
};