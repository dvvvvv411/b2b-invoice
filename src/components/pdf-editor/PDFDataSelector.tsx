
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  Car, 
  CreditCard, 
  Truck, 
  AlertTriangle,
  Database,
  Plus
} from 'lucide-react';
import { PDFData } from '@/lib/pdfGenerator';
import { useQuery } from '@tanstack/react-query';
import { useKunden } from '@/hooks/useKunden';
import { useAutos } from '@/hooks/useAutos';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';

interface PDFDataSelectorProps {
  currentData: PDFData | null;
  onChange: (data: PDFData) => void;
}

export function PDFDataSelector({ currentData, onChange }: PDFDataSelectorProps) {
  const [activeTab, setActiveTab] = useState('kunde');
  
  const { data: kunden } = useKunden();
  const { data: autos } = useAutos();
  const { data: kanzleien } = useKanzleien();
  const { data: bankkonten } = useBankkonten();
  const { data: speditionen } = useSpeditionen();
  const { data: insolventeUnternehmen } = useInsolventeUnternehmen();

  const updateData = (updates: Partial<PDFData>) => {
    const newData = { 
      type: currentData?.type || 'rechnung',
      ...currentData, 
      ...updates 
    };
    onChange(newData);
  };

  const selectEntity = (type: keyof PDFData, entity: any) => {
    updateData({ [type]: entity });
  };

  const dataTypes = [
    { 
      key: 'kunde', 
      label: 'Kunde', 
      icon: User, 
      data: kunden || [], 
      selected: currentData?.kunde 
    },
    { 
      key: 'auto', 
      label: 'Fahrzeug', 
      icon: Car, 
      data: autos || [], 
      selected: currentData?.auto 
    },
    { 
      key: 'kanzlei', 
      label: 'Kanzlei', 
      icon: Building2, 
      data: kanzleien || [], 
      selected: currentData?.kanzlei 
    },
    { 
      key: 'bankkonto', 
      label: 'Bankkonto', 
      icon: CreditCard, 
      data: bankkonten || [], 
      selected: currentData?.bankkonto 
    },
    { 
      key: 'spedition', 
      label: 'Spedition', 
      icon: Truck, 
      data: speditionen || [], 
      selected: currentData?.spedition 
    },
    { 
      key: 'insolventesUnternehmen', 
      label: 'Insolventes Unternehmen', 
      icon: AlertTriangle, 
      data: insolventeUnternehmen || [], 
      selected: currentData?.insolventesUnternehmen 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-muted/20 border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Datenauswahl für PDF-Generierung
        </h3>
        <p className="text-xs text-muted-foreground">
          Wählen Sie die Daten aus, die in Ihrem PDF-Dokument verwendet werden sollen.
        </p>
      </div>

      {/* Data Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {dataTypes.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger key={type.key} value={type.key} className="text-xs">
                <Icon className="w-3 h-3 mr-1" />
                {type.label}
                {type.selected && (
                  <Badge variant="outline" className="ml-1 text-xs px-1">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {dataTypes.map((type) => {
          const Icon = type.icon;
          return (
            <TabsContent key={type.key} value={type.key} className="mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-foreground flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {type.label} auswählen
                  </h4>
                  {type.selected && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ausgewählt: {type.selected.name || type.selected.kontoname || 'Unbenannt'}
                    </Badge>
                  )}
                </div>

                {type.data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine {type.label} gefunden</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      {type.label} hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {type.data.map((item: any) => (
                      <Card 
                        key={item.id}
                        className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                          type.selected?.id === item.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'bg-background'
                        }`}
                        onClick={() => selectEntity(type.key as keyof PDFData, item)}
                      >
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">
                            {item.name || item.kontoname || 'Unbenannt'}
                          </h5>
                          {item.adresse && (
                            <p className="text-xs text-muted-foreground">{item.adresse}</p>
                          )}
                          {item.marke && item.modell && (
                            <p className="text-xs text-muted-foreground">
                              {item.marke} {item.modell}
                            </p>
                          )}
                          {item.iban && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.iban}
                            </p>
                          )}
                          {type.selected?.id === item.id && (
                            <Badge variant="outline" className="text-xs">
                              Ausgewählt
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Custom Data */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">
          Zusätzliche Daten
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rechnung-nummer">Rechnungsnummer</Label>
            <Input
              id="rechnung-nummer"
              placeholder="IN-023939"
              value={currentData?.customData?.rechnungNummer || ''}
              onChange={(e) => updateData({
                customData: {
                  ...currentData?.customData,
                  rechnungNummer: e.target.value
                }
              })}
            />
          </div>
          <div>
            <Label htmlFor="rechnung-datum">Rechnungsdatum</Label>
            <Input
              id="rechnung-datum"
              type="date"
              value={currentData?.customData?.rechnungDatum || new Date().toISOString().split('T')[0]}
              onChange={(e) => updateData({
                customData: {
                  ...currentData?.customData,
                  rechnungDatum: e.target.value
                }
              })}
            />
          </div>
        </div>
      </Card>

      {/* Selected Data Summary */}
      {currentData && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-medium text-foreground mb-3">
            Ausgewählte Daten
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentData).map(([key, value]) => {
              if (!value || key === 'type' || key === 'customData') return null;
              return (
                <Badge key={key} variant="outline" className="text-green-700 border-green-300">
                  {key}: {value.name || value.kontoname || 'Ausgewählt'}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
