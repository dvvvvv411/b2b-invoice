
import { Kanzlei } from '@/hooks/useKanzleien';
import { InsolventesUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { Kunde } from '@/hooks/useKunden';
import { Auto } from '@/hooks/useAutos';
import { Bankkonto } from '@/hooks/useBankkonten';
import { Spedition } from '@/hooks/useSpeditionen';

export interface TemplateData {
  kanzlei?: Kanzlei;
  insolventesUnternehmen?: InsolventesUnternehmen;
  kunde?: Kunde;
  auto?: Auto;
  bankkonto?: Bankkonto;
  spedition?: Spedition;
}

export function replaceTemplateData(htmlContent: string, data: TemplateData): string {
  let processedContent = htmlContent;

  // Replace current date
  const currentDate = new Date().toLocaleDateString('de-DE');
  processedContent = processedContent.replace(/\{\{\s*current_date\s*\}\}/g, currentDate);

  // Replace Kanzlei data
  if (data.kanzlei) {
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.name\s*\}\}/g, data.kanzlei.name || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.rechtsanwalt\s*\}\}/g, data.kanzlei.rechtsanwalt || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.strasse\s*\}\}/g, data.kanzlei.strasse || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.plz\s*\}\}/g, data.kanzlei.plz || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.stadt\s*\}\}/g, data.kanzlei.stadt || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.telefon\s*\}\}/g, data.kanzlei.telefon || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.email\s*\}\}/g, data.kanzlei.email || '');
    processedContent = processedContent.replace(/\{\{\s*kanzlei\.website\s*\}\}/g, data.kanzlei.website || '');
  }

  // Replace Insolventes Unternehmen data
  if (data.insolventesUnternehmen) {
    processedContent = processedContent.replace(/\{\{\s*unternehmen\.name\s*\}\}/g, data.insolventesUnternehmen.name || '');
    processedContent = processedContent.replace(/\{\{\s*unternehmen\.amtsgericht\s*\}\}/g, data.insolventesUnternehmen.amtsgericht || '');
    processedContent = processedContent.replace(/\{\{\s*unternehmen\.aktenzeichen\s*\}\}/g, data.insolventesUnternehmen.aktenzeichen || '');
    processedContent = processedContent.replace(/\{\{\s*unternehmen\.handelsregister\s*\}\}/g, data.insolventesUnternehmen.handelsregister || '');
    processedContent = processedContent.replace(/\{\{\s*unternehmen\.adresse\s*\}\}/g, data.insolventesUnternehmen.adresse || '');
  }

  // Replace Kunde data
  if (data.kunde) {
    processedContent = processedContent.replace(/\{\{\s*kunde\.name\s*\}\}/g, data.kunde.name || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.kundennummer\s*\}\}/g, data.kunde.kundennummer || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.geschaeftsfuehrer\s*\}\}/g, data.kunde.geschaeftsfuehrer || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.adresse\s*\}\}/g, data.kunde.adresse || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.plz\s*\}\}/g, data.kunde.plz || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.stadt\s*\}\}/g, data.kunde.stadt || '');
    processedContent = processedContent.replace(/\{\{\s*kunde\.aktenzeichen\s*\}\}/g, data.kunde.aktenzeichen || '');
  }

  // Replace Auto data
  if (data.auto) {
    processedContent = processedContent.replace(/\{\{\s*auto\.marke\s*\}\}/g, data.auto.marke || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.modell\s*\}\}/g, data.auto.modell || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.fahrgestell_nr\s*\}\}/g, data.auto.fahrgestell_nr || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.dekra_bericht_nr\s*\}\}/g, data.auto.dekra_bericht_nr || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.erstzulassung\s*\}\}/g, data.auto.erstzulassung || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.kilometer\s*\}\}/g, data.auto.kilometer?.toString() || '');
    processedContent = processedContent.replace(/\{\{\s*auto\.einzelpreis_netto\s*\}\}/g, data.auto.einzelpreis_netto?.toString() || '');
  }

  // Replace Bankkonto data
  if (data.bankkonto) {
    processedContent = processedContent.replace(/\{\{\s*bankkonto\.kontoname\s*\}\}/g, data.bankkonto.kontoname || '');
    processedContent = processedContent.replace(/\{\{\s*bankkonto\.kontoinhaber\s*\}\}/g, data.bankkonto.kontoinhaber || '');
    processedContent = processedContent.replace(/\{\{\s*bankkonto\.iban\s*\}\}/g, data.bankkonto.iban || '');
    processedContent = processedContent.replace(/\{\{\s*bankkonto\.bic\s*\}\}/g, data.bankkonto.bic || '');
  }

  // Replace Spedition data
  if (data.spedition) {
    processedContent = processedContent.replace(/\{\{\s*spedition\.name\s*\}\}/g, data.spedition.name || '');
    processedContent = processedContent.replace(/\{\{\s*spedition\.strasse\s*\}\}/g, data.spedition.strasse || '');
    processedContent = processedContent.replace(/\{\{\s*spedition\.plz\s*\}\}/g, data.spedition.plz || '');
    processedContent = processedContent.replace(/\{\{\s*spedition\.stadt\s*\}\}/g, data.spedition.stadt || '');
  }

  return processedContent;
}
