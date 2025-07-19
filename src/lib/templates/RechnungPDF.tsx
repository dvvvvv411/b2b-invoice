import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PDFData } from '../pdfGenerator';

// Conversion: 1mm = 2.83465 points (PDF units)
const mm = (millimeters: number) => millimeters * 2.83465;

// Exact styles based on specifications
const rechnungStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  // Header left (5mm from left, 15mm from top)
  headerLeft: {
    position: 'absolute',
    top: mm(15),
    left: mm(5),
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.2,
  },
  // Register data left (5mm from left, 50mm from top)
  registerData: {
    position: 'absolute',
    top: mm(50),
    left: mm(5),
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Right top logo area (140mm from left, 15mm from top)
  logoArea: {
    position: 'absolute',
    top: mm(15),
    left: mm(140),
    width: mm(40),
    height: mm(25),
    border: '1pt solid #CCCCCC', // Placeholder border
  },
  logoText: {
    position: 'absolute',
    top: mm(42),
    left: mm(140),
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Lawyer box (140mm from left, 50mm from top)
  lawyerBox: {
    position: 'absolute',
    top: mm(50),
    left: mm(140),
    width: mm(60),
    border: '1pt solid #000000',
    padding: mm(3),
    fontSize: 10,
  },
  // Recipient address (5mm from left, 90mm from top)
  recipientAddress: {
    position: 'absolute',
    top: mm(90),
    left: mm(5),
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  // Date right (140mm from left, 100mm from top)
  dateRight: {
    position: 'absolute',
    top: mm(100),
    left: mm(140),
    fontSize: 11,
  },
  // Case number box (140mm from left, 110mm from top)
  caseNumberBox: {
    position: 'absolute',
    top: mm(110),
    left: mm(140),
    border: '2pt solid #000000',
    padding: mm(3),
    textAlign: 'center',
  },
  caseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  caseNumberNote: {
    fontSize: 8,
    marginTop: mm(1),
  },
  // Customer number (140mm from left, 125mm from top)
  customerNumber: {
    position: 'absolute',
    top: mm(125),
    left: mm(140),
    fontSize: 11,
  },
  // Subject (5mm from left, 140mm from top)
  subject: {
    position: 'absolute',
    top: mm(140),
    left: mm(5),
    fontSize: 11,
    fontWeight: 'bold',
    width: mm(130),
  },
  // Greeting (5mm from left, 170mm from top)
  greeting: {
    position: 'absolute',
    top: mm(170),
    left: mm(5),
    fontSize: 11,
  },
  // Invoice text (5mm from left, 180mm from top)
  invoiceText: {
    position: 'absolute',
    top: mm(180),
    left: mm(5),
    fontSize: 11,
    width: mm(130),
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: mm(3),
    marginBottom: mm(3),
  },
  // Vehicle table (5mm from left, 220mm from top)
  vehicleTable: {
    position: 'absolute',
    top: mm(220),
    left: mm(5),
    width: mm(180),
    border: '1pt solid #000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderBottom: '1pt solid #000000',
    padding: mm(2),
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000000',
    padding: mm(2),
    minHeight: mm(8),
  },
  tableColVehicle: {
    width: '50%',
    paddingRight: mm(2),
    fontSize: 10,
  },
  tableColDetails: {
    width: '30%',
    paddingRight: mm(2),
    fontSize: 10,
  },
  tableColPrice: {
    width: '20%',
    textAlign: 'right',
    fontSize: 10,
  },
  // Totals (130mm from left, 240mm from top)
  totalsArea: {
    position: 'absolute',
    top: mm(240),
    left: mm(130),
    width: mm(50),
    fontSize: 11,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mm(1),
  },
  totalSeparator: {
    borderBottom: '1pt solid #000000',
    marginVertical: mm(2),
    width: mm(40),
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

interface RechnungPDFProps {
  data: PDFData;
}

export const RechnungPDF = ({ data }: RechnungPDFProps) => {
  const today = new Date().toLocaleDateString('de-DE');
  
  return (
    <Document>
      <Page size="A4" style={rechnungStyles.page}>
        {/* Header Left */}
        <View style={rechnungStyles.headerLeft}>
          <Text>Heß & Partner Rechtsanwälte PartG</Text>
          <Text>Marienstr. 19/20</Text>
          <Text>10117 Berlin</Text>
          <Text>USt-IdNr.: DE155627174</Text>
          <Text>Tel.: 030 75420496</Text>
          <Text>E-Mail: info@hess-anwaltskanzlei.de</Text>
          <Text>Web: www.hess-anwaltskanzlei.de</Text>
        </View>

        {/* Register Data Left */}
        <View style={rechnungStyles.registerData}>
          <Text>Registergericht:</Text>
          <Text>Amtsgericht Charlottenburg (Berlin)</Text>
          <Text>Reg.-Nr.: PR 1505 B</Text>
          <Text>UST-ID: DE155627174</Text>
        </View>

        {/* Logo Area Placeholder */}
        <View style={rechnungStyles.logoArea}>
          <Text style={{ fontSize: 8, textAlign: 'center', marginTop: mm(8) }}>
            LOGO
          </Text>
        </View>

        {/* Logo Text */}
        <View style={rechnungStyles.logoText}>
          <Text>Anwaltskanzlei</Text>
        </View>

        {/* Lawyer Box */}
        <View style={rechnungStyles.lawyerBox}>
          <Text style={{ fontWeight: 'bold' }}>Rechtsanwalt</Text>
          <Text>Dr. Kai Henrik Heß</Text>
          <Text>Marienstr. 19/20</Text>
          <Text>10117 Berlin</Text>
          <Text>{data.kanzlei?.telefon || 'Tel.: 030 75420496'}</Text>
          <Text>{data.kanzlei?.email || 'info@hess-anwaltskanzlei.de'}</Text>
        </View>

        {/* Recipient Address */}
        <View style={rechnungStyles.recipientAddress}>
          <Text style={{ fontWeight: 'bold' }}>
            {data.kunde?.name?.toUpperCase() || 'MUSTER GMBH'}
          </Text>
          <Text>{data.kunde?.adresse || 'Musterweg 9'}</Text>
          <Text>
            {data.kunde?.plz && data.kunde?.stadt 
              ? `${data.kunde.plz} ${data.kunde.stadt}` 
              : '12345 Musterstadt'}
          </Text>
        </View>

        {/* Date Right */}
        <View style={rechnungStyles.dateRight}>
          <Text>{today}</Text>
        </View>

        {/* Case Number Box */}
        <View style={rechnungStyles.caseNumberBox}>
          <Text style={rechnungStyles.caseNumber}>
            {data.kunde?.aktenzeichen || 'AZ/0305/XXX'}
          </Text>
          <Text style={rechnungStyles.caseNumberNote}>
            (bitte stets angeben)
          </Text>
        </View>

        {/* Customer Number */}
        <View style={rechnungStyles.customerNumber}>
          <Text>{data.kunde?.kundennummer || 'XXX/0745/IN'}</Text>
        </View>

        {/* Subject */}
        <View style={rechnungStyles.subject}>
          <Text>
            Insolvenzverfahren über das Vermögen der {data.insolventesUnternehmen?.name || 'artis GmbH'}
          </Text>
          <Text>
            {data.insolventesUnternehmen?.amtsgericht || 'Amtsgericht Münster (Westfalen)'}, {data.insolventesUnternehmen?.aktenzeichen || 'Az. 71 IN 1011/24'}
          </Text>
          <Text>
            Handelsregister: {data.insolventesUnternehmen?.handelsregister || 'Amtsgericht Steinfurt, HRB 11802'}
          </Text>
          <Text>
            {data.insolventesUnternehmen?.adresse || 'Bessemerstraße 82, 1 Süd, D-12103 Berlin'}
          </Text>
        </View>

        {/* Greeting */}
        <View style={rechnungStyles.greeting}>
          <Text>Sehr geehrte Damen und Herren,</Text>
        </View>

        {/* Invoice Text */}
        <View style={rechnungStyles.invoiceText}>
          <Text>
            im Rahmen der Verwertung der Insolvenzmasse übermitteln wir Ihnen nachfolgend die
          </Text>
          <Text>Rechnung zu dem vereinbarten Verkaufsvorgang:</Text>
          <Text style={rechnungStyles.invoiceNumber}>
            Rechnung Nr. IN-023939
          </Text>
          <Text>
            Das Lieferdatum liegt spätestens innerhalb von sieben Kalendertagen nach vollständigem
          </Text>
          <Text>Zahlungseingang.</Text>
          <Text>Das Rechnungsdatum entspricht dem heutigen Ausstellungsdatum.</Text>
        </View>

        {/* Vehicle Table */}
        <View style={rechnungStyles.vehicleTable}>
          {/* Table Header */}
          <View style={rechnungStyles.tableHeader}>
            <Text style={rechnungStyles.tableColVehicle}>Fahrzeug</Text>
            <Text style={rechnungStyles.tableColDetails}>Details</Text>
            <Text style={rechnungStyles.tableColPrice}>Preis</Text>
          </View>
          
          {/* Table Row */}
          <View style={rechnungStyles.tableRow}>
            <Text style={rechnungStyles.tableColVehicle}>
              {data.auto ? `${data.auto.marke} ${data.auto.modell}` : 'VW T6 California Beach'} {data.auto?.fahrgestell_nr || 'W5488468458458'} ({data.auto?.dekra_bericht_nr || 'Dekra Bericht-Nr.: 0230'})
            </Text>
            <Text style={rechnungStyles.tableColDetails}>
              EZ ({data.auto?.erstzulassung ? new Date(data.auto.erstzulassung).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' }) : '08/2020'}) {data.auto?.kilometer?.toLocaleString('de-DE') || '16.780'} km (Anzahl 1 à {data.auto?.einzelpreis_netto?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '5.678,00 €'})
            </Text>
            <Text style={rechnungStyles.tableColPrice}>
              {data.auto?.einzelpreis_netto?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '5.678,00 €'}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={rechnungStyles.totalsArea}>
          <View style={rechnungStyles.totalLine}>
            <Text>Zwischensumme netto</Text>
            <Text>{data.auto?.einzelpreis_netto?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '5.678,00 €'}</Text>
          </View>
          <View style={rechnungStyles.totalLine}>
            <Text>19 % Mehrwertsteuer</Text>
            <Text>{data.auto?.einzelpreis_netto ? (data.auto.einzelpreis_netto * 0.19).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '1.078,82 €'}</Text>
          </View>
          <View style={rechnungStyles.totalSeparator} />
          <View style={rechnungStyles.totalFinal}>
            <Text>zu zahlender Betrag</Text>
            <Text>{data.auto?.einzelpreis_netto ? (data.auto.einzelpreis_netto * 1.19).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '6.756,82 €'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};