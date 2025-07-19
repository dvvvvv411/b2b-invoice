import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
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
      const filename = `${pdfData.type}_${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPDF(pdfData, filename);
      
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
          Überprüfen Sie die Daten und generieren Sie Ihr PDF-Dokument
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
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center space-x-2"
            disabled={true} // Preview not implemented yet
          >
            <Eye className="w-4 h-4" />
            <span>Vorschau anzeigen</span>
          </Button>
          
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
          Das PDF wird direkt in Ihren Downloads-Ordner gespeichert
        </p>
      </Card>
    </div>
  );
}