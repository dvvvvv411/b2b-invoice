import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FileText as FileContract, 
  FileCheck, 
  ChevronRight, 
  ChevronLeft,
  Download,
  Eye
} from 'lucide-react';
import { PDFTypeSelection } from '@/components/pdf-generator/PDFTypeSelection';
import { PDFDataSelection } from '@/components/pdf-generator/PDFDataSelection';
import { PDFPreview } from '@/components/pdf-generator/PDFPreview';
import { PDFType, PDFData } from '@/lib/pdfGenerator';

const PDFGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<PDFType | null>(null);
  const [pdfData, setPdfData] = useState<PDFData | null>(null);

  const steps = [
    { id: 1, title: 'PDF-Typ wählen', description: 'Wählen Sie den gewünschten Dokumenttyp' },
    { id: 2, title: 'Daten auswählen', description: 'Wählen Sie die relevanten Daten aus' },
    { id: 3, title: 'Vorschau & Generieren', description: 'Überprüfen und PDF generieren' },
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeSelect = (type: PDFType) => {
    setSelectedType(type);
    setPdfData({ type, customData: {} });
  };

  const handleDataUpdate = (data: PDFData) => {
    setPdfData(data);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedType !== null;
      case 2:
        return pdfData !== null;
      case 3:
        return pdfData !== null;
      default:
        return false;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary font-orbitron mb-2">
          PDF Generator
        </h1>
        <p className="text-muted-foreground">
          Erstellen Sie professionelle PDF-Dokumente in wenigen Schritten
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="glass border-primary/20 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Fortschritt
            </h2>
            <Badge variant="outline" className="text-primary border-primary/50">
              Schritt {currentStep} von {steps.length}
            </Badge>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all ${
                  step.id === currentStep
                    ? 'border-primary bg-primary/10'
                    : step.id < currentStep
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.id === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <h3 className="font-medium text-sm text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground ml-8">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Step Content */}
      <Card className="glass border-primary/20 p-6 min-h-[500px]">
        {currentStep === 1 && (
          <PDFTypeSelection
            selectedType={selectedType}
            onTypeSelect={handleTypeSelect}
          />
        )}

        {currentStep === 2 && selectedType && (
          <PDFDataSelection
            pdfType={selectedType}
            currentData={pdfData}
            onDataUpdate={handleDataUpdate}
          />
        )}

        {currentStep === 3 && pdfData && (
          <PDFPreview pdfData={pdfData} />
        )}
      </Card>

      {/* Navigation */}
      <Card className="glass border-primary/20 p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Button>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <Button
                variant="gaming"
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center space-x-2"
              >
                <span>Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  disabled={!pdfData}
                >
                  <Eye className="w-4 h-4" />
                  <span>Vorschau</span>
                </Button>
                <Button
                  variant="gaming"
                  className="flex items-center space-x-2"
                  disabled={!pdfData}
                >
                  <Download className="w-4 h-4" />
                  <span>PDF Generieren</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PDFGenerator;