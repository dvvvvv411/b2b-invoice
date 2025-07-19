import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileText as FileContract, FileCheck } from 'lucide-react';
import { PDFType } from '@/lib/pdfGenerator';

interface PDFTypeSelectionProps {
  selectedType: PDFType | null;
  onTypeSelect: (type: PDFType) => void;
}

export function PDFTypeSelection({ selectedType, onTypeSelect }: PDFTypeSelectionProps) {
  const pdfTypes = [
    {
      id: 'rechnung' as PDFType,
      title: 'Rechnung',
      description: 'Erstellen Sie professionelle Rechnungen für Ihre Dienstleistungen',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      features: ['Automatische Berechnung', 'Steuerausweis', 'Zahlungsbedingungen']
    },
    {
      id: 'kaufvertrag' as PDFType,
      title: 'Kaufvertrag',
      description: 'Generieren Sie rechtssichere Kaufverträge für Fahrzeuge',
      icon: FileContract,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      features: ['Fahrzeugdaten', 'Käufer/Verkäufer', 'Rechtliche Klauseln']
    },
    {
      id: 'uebernahmebestaetigung' as PDFType,
      title: 'Übernahmebestätigung',
      description: 'Dokumentieren Sie die Übernahme von Fahrzeugen und Vermögenswerten',
      icon: FileCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      features: ['Übernahmedetails', 'Zustandsprotokoll', 'Haftungsausschluss']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient-primary font-orbitron mb-2">
          PDF-Typ auswählen
        </h2>
        <p className="text-muted-foreground">
          Wählen Sie den Dokumenttyp, den Sie generieren möchten
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pdfTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <Card
              key={type.id}
              className={`
                cursor-pointer transition-all duration-300 hover:scale-105 p-6
                ${isSelected 
                  ? `border-primary bg-primary/5 shadow-lg shadow-primary/20` 
                  : `glass border-primary/20 hover:border-primary/40`
                }
              `}
              onClick={() => onTypeSelect(type.id)}
            >
              <div className="space-y-4">
                {/* Icon and Title */}
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${type.bgColor} ${type.borderColor} border`}>
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {type.title}
                    </h3>
                    {isSelected && (
                      <Badge variant="outline" className="text-primary border-primary/50 mt-1">
                        Ausgewählt
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {type.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Funktionen:</h4>
                  <ul className="space-y-1">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="pt-2 border-t border-primary/20">
                    <div className="flex items-center space-x-2 text-primary">
                      <FileCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Typ ausgewählt</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <Card className="glass border-primary/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Dokumenttyp ausgewählt
              </p>
              <p className="text-xs text-muted-foreground">
                Sie können nun mit der Datenauswahl fortfahren
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}