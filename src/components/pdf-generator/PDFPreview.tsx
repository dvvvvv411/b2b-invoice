import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Building2, 
  User, 
  Car, 
  CreditCard, 
  Truck, 
  AlertTriangle 
} from 'lucide-react';
import { PDFData, downloadPDF } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { PDFPreviewDialog } from './PDFPreviewDialog';

interface PDFPreviewProps {
  pdfData: PDFData;
}

export function PDFPreview({ pdfData }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'rechnung':
        return 'Rechnung';
      case 'kaufvertrag':
        return 'Kaufvertrag';
      case 'uebernahmebestaetigung':
        return 'Übernahmebestätigung';
      default:
        return 'Unbekannter Typ';
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Import the enhanced HTML to PDF generator
      const { generateHTMLToPDF } = await import('@/lib/pdfGenerator');
      
      // Create a simple HTML template for the PDF preview
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #333;
                }
                .section {
                    margin: 20px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    background-color: #f9f9f9;
                }
                .section h3 {
                    margin-top: 0;
                    color: #333;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                .data-item {
                    margin: 8px 0;
                }
                .label {
                    font-weight: bold;
                    color: #555;
                }
            </style>
        </head>
        <body>
            <div class="pdf-content">
                <div class="header">
                    <div class="title">${getTypeTitle(pdfData.type)}</div>
                    <p>Erstellt am {{ AKTUELLES_DATUM }}</p>
                </div>
                
                ${pdfData.kanzlei ? `
                <div class="section">
                    <h3>Anwaltskanzlei</h3>
                    <div class="data-item"><span class="label">Name:</span> ${pdfData.kanzlei.name}</div>
                    <div class="data-item"><span class="label">Adresse:</span> ${pdfData.kanzlei.strasse}</div>
                    <div class="data-item"><span class="label">Ort:</span> ${pdfData.kanzlei.plz} ${pdfData.kanzlei.stadt}</div>
                    ${pdfData.kanzlei.email ? `<div class="data-item"><span class="label">E-Mail:</span> ${pdfData.kanzlei.email}</div>` : ''}
                    ${pdfData.kanzlei.telefon ? `<div class="data-item"><span class="label">Telefon:</span> ${pdfData.kanzlei.telefon}</div>` : ''}
                </div>
                ` : ''}
                
                ${pdfData.kunde ? `
                <div class="section">
                    <h3>Kunde</h3>
                    <div class="data-item"><span class="label">Name:</span> ${pdfData.kunde.name}</div>
                    <div class="data-item"><span class="label">Adresse:</span> ${pdfData.kunde.adresse}</div>
                    <div class="data-item"><span class="label">Ort:</span> ${pdfData.kunde.plz} ${pdfData.kunde.stadt}</div>
                    ${pdfData.kunde.geschaeftsfuehrer ? `<div class="data-item"><span class="label">Geschäftsführer:</span> ${pdfData.kunde.geschaeftsfuehrer}</div>` : ''}
                </div>
                ` : ''}
                
                ${pdfData.auto ? `
                <div class="section">
                    <h3>Fahrzeug</h3>
                    <div class="data-item"><span class="label">Fahrzeug:</span> ${pdfData.auto.marke} ${pdfData.auto.modell}</div>
                    ${pdfData.auto.fahrgestell_nr ? `<div class="data-item"><span class="label">Fahrgestellnummer:</span> ${pdfData.auto.fahrgestell_nr}</div>` : ''}
                    ${pdfData.auto.kilometer ? `<div class="data-item"><span class="label">Kilometer:</span> ${pdfData.auto.kilometer.toLocaleString('de-DE')} km</div>` : ''}
                    ${pdfData.auto.erstzulassung ? `<div class="data-item"><span class="label">Erstzulassung:</span> ${new Date(pdfData.auto.erstzulassung).toLocaleDateString('de-DE')}</div>` : ''}
                </div>
                ` : ''}
                
                ${pdfData.bankkonto ? `
                <div class="section">
                    <h3>Bankkonto</h3>
                    <div class="data-item"><span class="label">Kontoname:</span> ${pdfData.bankkonto.kontoname}</div>
                    <div class="data-item"><span class="label">Kontoinhaber:</span> ${pdfData.bankkonto.kontoinhaber}</div>
                    <div class="data-item"><span class="label">IBAN:</span> ${pdfData.bankkonto.iban}</div>
                    <div class="data-item"><span class="label">BIC:</span> ${pdfData.bankkonto.bic}</div>
                </div>
                ` : ''}
                
                ${pdfData.spedition ? `
                <div class="section">
                    <h3>Spedition</h3>
                    <div class="data-item"><span class="label">Name:</span> ${pdfData.spedition.name}</div>
                    <div class="data-item"><span class="label">Adresse:</span> ${pdfData.spedition.strasse}</div>
                    <div class="data-item"><span class="label">Ort:</span> ${pdfData.spedition.plz} ${pdfData.spedition.stadt}</div>
                </div>
                ` : ''}
                
                ${pdfData.insolventesUnternehmen ? `
                <div class="section">
                    <h3>Insolventes Unternehmen</h3>
                    <div class="data-item"><span class="label">Name:</span> ${pdfData.insolventesUnternehmen.name}</div>
                    ${pdfData.insolventesUnternehmen.adresse ? `<div class="data-item"><span class="label">Adresse:</span> ${pdfData.insolventesUnternehmen.adresse}</div>` : ''}
                    <div class="data-item"><span class="label">Amtsgericht:</span> ${pdfData.insolventesUnternehmen.amtsgericht}</div>
                    <div class="data-item"><span class="label">Aktenzeichen:</span> ${pdfData.insolventesUnternehmen.aktenzeichen}</div>
                </div>
                ` : ''}
            </div>
            
            <!-- Enhanced footer that will be processed -->
            <div class="pdf-footer">
                PDF erstellt am {{ AKTUELLES_DATUM }} | Dokumenttyp: ${getTypeTitle(pdfData.type)}
                ${pdfData.kanzlei ? ` | ${pdfData.kanzlei.name}` : ''}
            </div>
        </body>
        </html>
      `;
      
      const filename = `${pdfData.type}_${new Date().toISOString().split('T')[0]}.pdf`;
      await generateHTMLToPDF(htmlContent, filename);
      
      toast({
        title: 'PDF erstellt',
        description: 'Das PDF wurde erfolgreich generiert und heruntergeladen.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Generieren des PDFs. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const dataItems = [
    {
      key: 'kanzlei',
      title: 'Anwaltskanzlei',
      icon: Building2,
      data: pdfData.kanzlei,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.strasse}</p>
          <p className="text-sm text-muted-foreground">{data.plz} {data.stadt}</p>
          {data.email && <p className="text-sm text-muted-foreground">{data.email}</p>}
        </div>
      )
    },
    {
      key: 'kunde',
      title: 'Kunde',
      icon: User,
      data: pdfData.kunde,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.adresse}</p>
          <p className="text-sm text-muted-foreground">{data.plz} {data.stadt}</p>
          {data.geschaeftsfuehrer && (
            <p className="text-sm text-muted-foreground">GF: {data.geschaeftsfuehrer}</p>
          )}
        </div>
      )
    },
    {
      key: 'auto',
      title: 'Fahrzeug',
      icon: Car,
      data: pdfData.auto,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.marke} {data.modell}</p>
          {data.fahrgestell_nr && (
            <p className="text-sm text-muted-foreground">FIN: {data.fahrgestell_nr}</p>
          )}
          {data.kilometer && (
            <p className="text-sm text-muted-foreground">
              {data.kilometer.toLocaleString('de-DE')} km
            </p>
          )}
          {data.erstzulassung && (
            <p className="text-sm text-muted-foreground">
              Erstzulassung: {new Date(data.erstzulassung).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'bankkonto',
      title: 'Bankkonto',
      icon: CreditCard,
      data: pdfData.bankkonto,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.kontoname}</p>
          <p className="text-sm text-muted-foreground">{data.kontoinhaber}</p>
          <p className="text-sm text-muted-foreground font-mono">
            {data.iban.replace(/(.{4})/g, '$1 ').trim()}
          </p>
          <p className="text-sm text-muted-foreground font-mono">{data.bic}</p>
        </div>
      )
    },
    {
      key: 'spedition',
      title: 'Spedition',
      icon: Truck,
      data: pdfData.spedition,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.strasse}</p>
          <p className="text-sm text-muted-foreground">{data.plz} {data.stadt}</p>
        </div>
      )
    },
    {
      key: 'insolventesUnternehmen',
      title: 'Insolventes Unternehmen',
      icon: AlertTriangle,
      data: pdfData.insolventesUnternehmen,
      render: (data: any) => (
        <div>
          <p className="font-medium">{data.name}</p>
          {data.adresse && (
            <p className="text-sm text-muted-foreground">{data.adresse}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {data.amtsgericht}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {data.aktenzeichen}
          </p>
        </div>
      )
    }
  ];

  const includedData = dataItems.filter(item => item.data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient-primary font-orbitron mb-2">
          PDF Vorschau & Generierung
        </h2>
        <p className="text-muted-foreground">
          Überprüfen Sie die Daten und generieren Sie Ihr PDF-Dokument mit verbesserter Fußzeile
        </p>
      </div>

      {/* Document Type */}
      <Card className="glass border-primary/20 p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Dokumenttyp</h3>
            <p className="text-sm text-muted-foreground">
              {getTypeTitle(pdfData.type)}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="text-primary border-primary/50">
              {getTypeTitle(pdfData.type)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Data Overview */}
      <Card className="glass border-primary/20 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Enthaltene Daten
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {includedData.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <div key={item.key}>
                <Card className="p-4 bg-muted/20 border-border/30">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded border border-primary/20 mt-1">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-2">
                        {item.title}
                      </h4>
                      {item.render(item.data)}
                    </div>
                  </div>
                </Card>
                
                {index < includedData.length - 1 && index % 2 === 1 && (
                  <Separator className="col-span-2 my-4" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Generation Info */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>PDF-Information:</strong> Das generierte PDF wird im A4-Format erstellt und 
          enthält alle ausgewählten Daten in einem professionellen Layout. 
          Das Dokument wird automatisch mit dem aktuellen Datum versehen.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card className="glass border-primary/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <PDFPreviewDialog pdfData={pdfData} disabled={!pdfData} />
          
          <Button
            variant="gaming"
            size="lg"
            className="flex-1 flex items-center justify-center space-x-2"
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            <Download className="w-4 h-4" />
            <span>
              {isGenerating ? 'Generiere PDF...' : 'PDF herunterladen'}
            </span>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          Das PDF wird mit verbesserter Fußzeilen-Unterstützung erstellt
        </p>
      </Card>
    </div>
  );
}
