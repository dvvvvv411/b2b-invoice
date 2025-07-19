import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  User, 
  Car, 
  CreditCard, 
  Truck, 
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';
import { PDFType, PDFData } from '@/lib/pdfGenerator';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useKunden } from '@/hooks/useKunden';
import { useAutos } from '@/hooks/useAutos';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';

interface PDFDataSelectionProps {
  pdfType: PDFType;
  currentData: PDFData | null;
  onDataUpdate: (data: PDFData) => void;
}

export function PDFDataSelection({ pdfType, currentData, onDataUpdate }: PDFDataSelectionProps) {
  const [selectedData, setSelectedData] = useState<PDFData>(
    currentData || { type: pdfType, customData: {} }
  );

  // Data hooks
  const { data: kanzleien = [], isLoading: loadingKanzleien } = useKanzleien();
  const { data: kunden = [], isLoading: loadingKunden } = useKunden();
  const { data: autos = [], isLoading: loadingAutos } = useAutos();
  const { data: bankkonten = [], isLoading: loadingBankkonten } = useBankkonten();
  const { data: speditionen = [], isLoading: loadingSpeditionen } = useSpeditionen();
  const { data: insolventeUnternehmen = [], isLoading: loadingInsolvente } = useInsolventeUnternehmen();

  const getTypeTitle = (type: PDFType) => {
    switch (type) {
      case 'rechnung':
        return 'Rechnung';
      case 'kaufvertrag':
        return 'Kaufvertrag';
      case 'uebernahmebestaetigung':
        return 'Übernahmebestätigung';
    }
  };

  const getRequiredFields = (type: PDFType) => {
    switch (type) {
      case 'rechnung':
        return ['kanzlei', 'kunde', 'bankkonto'];
      case 'kaufvertrag':
        return ['kanzlei', 'kunde', 'auto'];
      case 'uebernahmebestaetigung':
        return ['kanzlei', 'insolventesUnternehmen', 'auto', 'spedition'];
      default:
        return [];
    }
  };

  const getOptionalFields = (type: PDFType) => {
    switch (type) {
      case 'rechnung':
        return ['auto', 'spedition'];
      case 'kaufvertrag':
        return ['bankkonto', 'spedition'];
      case 'uebernahmebestaetigung':
        return ['kunde', 'bankkonto'];
      default:
        return [];
    }
  };

  const requiredFields = getRequiredFields(pdfType);
  const optionalFields = getOptionalFields(pdfType);
  const allFields = [...requiredFields, ...optionalFields];

  const dataCategories = [
    {
      key: 'kanzlei',
      title: 'Anwaltskanzlei',
      icon: Building2,
      data: kanzleien,
      loading: loadingKanzleien,
      getValue: (item: any) => item.name,
      getSubtext: (item: any) => `${item.stadt} • ${item.email || 'Keine E-Mail'}`
    },
    {
      key: 'kunde',
      title: 'Kunde',
      icon: User,
      data: kunden,
      loading: loadingKunden,
      getValue: (item: any) => item.name,
      getSubtext: (item: any) => `${item.stadt} • ${item.geschaeftsfuehrer}`
    },
    {
      key: 'auto',
      title: 'Fahrzeug',
      icon: Car,
      data: autos,
      loading: loadingAutos,
      getValue: (item: any) => `${item.marke} ${item.modell}`,
      getSubtext: (item: any) => `${item.kilometer?.toLocaleString() || 'N/A'} km • ${item.erstzulassung ? new Date(item.erstzulassung).getFullYear() : 'N/A'}`
    },
    {
      key: 'bankkonto',
      title: 'Bankkonto',
      icon: CreditCard,
      data: bankkonten,
      loading: loadingBankkonten,
      getValue: (item: any) => item.kontoname,
      getSubtext: (item: any) => `${item.kontoinhaber} • ${item.iban.slice(-4)}`
    },
    {
      key: 'spedition',
      title: 'Spedition',
      icon: Truck,
      data: speditionen,
      loading: loadingSpeditionen,
      getValue: (item: any) => item.name,
      getSubtext: (item: any) => `${item.stadt} • ${item.strasse}`
    },
    {
      key: 'insolventesUnternehmen',
      title: 'Insolventes Unternehmen',
      icon: AlertTriangle,
      data: insolventeUnternehmen,
      loading: loadingInsolvente,
      getValue: (item: any) => item.name,
      getSubtext: (item: any) => `${item.amtsgericht} • ${item.aktenzeichen}`
    }
  ];

  const handleSelectionChange = (key: string, value: string) => {
    const category = dataCategories.find(cat => cat.key === key);
    if (!category) return;

    const selectedItem = category.data.find((item: any) => item.id === value);
    
    const updatedData = {
      ...selectedData,
      [key]: selectedItem
    };

    setSelectedData(updatedData);
    onDataUpdate(updatedData);
  };

  const isDataComplete = () => {
    return requiredFields.every(field => selectedData[field as keyof PDFData]);
  };

  const getCompletionPercentage = () => {
    const totalRequired = requiredFields.length;
    const completed = requiredFields.filter(field => selectedData[field as keyof PDFData]).length;
    return Math.round((completed / totalRequired) * 100);
  };

  useEffect(() => {
    onDataUpdate(selectedData);
  }, [selectedData, onDataUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient-primary font-orbitron mb-2">
          Daten für {getTypeTitle(pdfType)} auswählen
        </h2>
        <p className="text-muted-foreground">
          Wählen Sie die relevanten Daten für Ihr PDF-Dokument aus
        </p>
      </div>

      {/* Progress */}
      <Card className="glass border-primary/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Fortschritt</span>
          <Badge variant={isDataComplete() ? "default" : "secondary"}>
            {getCompletionPercentage()}% vollständig
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </Card>

      {/* Data Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataCategories
          .filter(category => allFields.includes(category.key))
          .map((category) => {
            const Icon = category.icon;
            const isRequired = requiredFields.includes(category.key);
            const isSelected = selectedData[category.key as keyof PDFData];

            return (
              <Card 
                key={category.key}
                className={`glass p-4 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-primary/20'
                }`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <Label className="text-sm font-medium">
                        {category.title}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Erforderlich
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Selection */}
                  <Select
                    value={isSelected ? (isSelected as any).id : ""}
                    onValueChange={(value) => handleSelectionChange(category.key, value)}
                    disabled={category.loading}
                  >
                    <SelectTrigger className="w-full">
                      {category.loading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Lädt...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={`${category.title} auswählen`} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {category.data.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {category.getValue(item)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {category.getSubtext(item)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* No data warning */}
                  {!category.loading && category.data.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Keine {category.title.toLowerCase()} gefunden. 
                        Bitte erstellen Sie zuerst einen Eintrag.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </Card>
            );
          })}
      </div>

      {/* Completion Status */}
      {!isDataComplete() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bitte wählen Sie alle erforderlichen Daten aus, um fortzufahren.
            Noch fehlend: {requiredFields
              .filter(field => !selectedData[field as keyof PDFData])
              .map(field => dataCategories.find(cat => cat.key === field)?.title)
              .join(', ')
            }
          </AlertDescription>
        </Alert>
      )}

      {isDataComplete() && (
        <Card className="glass border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Alle erforderlichen Daten ausgewählt
              </p>
              <p className="text-xs text-muted-foreground">
                Sie können nun zur Vorschau fortfahren
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}