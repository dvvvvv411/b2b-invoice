import { useState } from 'react';
import { ChevronRight, ChevronLeft, FileOutput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useKunden } from '@/hooks/useKunden';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { useAutos } from '@/hooks/useAutos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculatePrices, formatCurrency } from '@/lib/documentHelpers';

const GenerateDocument = () => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedKanzlei, setSelectedKanzlei] = useState<string>('');
  const [selectedInsoUnternehmen, setSelectedInsoUnternehmen] = useState<string>('');
  const [selectedBankkonto, setSelectedBankkonto] = useState<string>('');
  const [selectedKunde, setSelectedKunde] = useState<string>('');
  const [selectedSpedition, setSelectedSpedition] = useState<string>('');
  const [selectedAutos, setSelectedAutos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const { data: templates } = useDocumentTemplates();
  const { data: kanzleien } = useKanzleien();
  const { data: insolventeUnternehmen } = useInsolventeUnternehmen();
  const { data: bankkonten } = useBankkonten();
  const { data: kunden } = useKunden();
  const { data: speditionen } = useSpeditionen();
  const { data: autos } = useAutos();

  const activeTemplates = templates?.filter(t => t.is_active) || [];

  const selectedAutosData = autos?.filter(a => selectedAutos.includes(a.id)) || [];
  const nettopreis = selectedAutosData.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const { bruttopreis, mwst } = calculatePrices(nettopreis);

  const canProceedToStep2 = selectedTemplate !== '';
  const canProceedToStep3 = selectedKanzlei && selectedInsoUnternehmen && selectedBankkonto && selectedKunde && selectedSpedition;
  const canProceedToStep4 = selectedAutos.length > 0;

  const handleToggleAuto = (autoId: string) => {
    setSelectedAutos(prev =>
      prev.includes(autoId)
        ? prev.filter(id => id !== autoId)
        : [...prev, autoId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          templateId: selectedTemplate,
          kanzleiId: selectedKanzlei,
          insoUnternehmenId: selectedInsoUnternehmen,
          bankkontoId: selectedBankkonto,
          kundeId: selectedKunde,
          speditionId: selectedSpedition,
          autoIds: selectedAutos,
        },
      });

      if (error) throw error;

      // Download the generated document
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dokument_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Erfolg',
        description: 'Dokument wurde erfolgreich generiert',
      });

      // Reset form
      setStep(1);
      setSelectedTemplate('');
      setSelectedKanzlei('');
      setSelectedInsoUnternehmen('');
      setSelectedBankkonto('');
      setSelectedKunde('');
      setSelectedSpedition('');
      setSelectedAutos([]);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: `Fehler beim Generieren: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dokument erstellen</h1>
        <p className="text-muted-foreground mt-2">
          Generieren Sie ein Dokument aus einer Vorlage
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 4 && <ChevronRight className="w-6 h-6 mx-2 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Schritt 1: Vorlage auswählen'}
            {step === 2 && 'Schritt 2: Hauptdaten auswählen'}
            {step === 3 && 'Schritt 3: Autos auswählen'}
            {step === 4 && 'Schritt 4: Vorschau & Generierung'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Wählen Sie eine aktive Vorlage aus'}
            {step === 2 && 'Wählen Sie alle erforderlichen Datensätze aus'}
            {step === 3 && 'Wählen Sie die Fahrzeuge für dieses Dokument'}
            {step === 4 && 'Überprüfen Sie Ihre Auswahl und generieren Sie das Dokument'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vorlage *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vorlage auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.template_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kanzlei *</Label>
                <Select value={selectedKanzlei} onValueChange={setSelectedKanzlei}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kanzlei auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kanzleien?.map((kanzlei) => (
                      <SelectItem key={kanzlei.id} value={kanzlei.id}>
                        {kanzlei.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Insolventes Unternehmen *</Label>
                <Select value={selectedInsoUnternehmen} onValueChange={setSelectedInsoUnternehmen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unternehmen auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {insolventeUnternehmen?.map((unternehmen) => (
                      <SelectItem key={unternehmen.id} value={unternehmen.id}>
                        {unternehmen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bankkonto *</Label>
                <Select value={selectedBankkonto} onValueChange={setSelectedBankkonto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bankkonto auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankkonten?.map((konto) => (
                      <SelectItem key={konto.id} value={konto.id}>
                        {konto.kontoname} ({konto.bankname})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kunde *</Label>
                <Select value={selectedKunde} onValueChange={setSelectedKunde}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kunden?.map((kunde) => (
                      <SelectItem key={kunde.id} value={kunde.id}>
                        {kunde.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Spedition *</Label>
                <Select value={selectedSpedition} onValueChange={setSelectedSpedition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Spedition auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {speditionen?.map((spedition) => (
                      <SelectItem key={spedition.id} value={spedition.id}>
                        {spedition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Marke</TableHead>
                      <TableHead>Modell</TableHead>
                      <TableHead>Fahrgestell-Nr.</TableHead>
                      <TableHead>Preis (netto)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autos?.map((auto) => (
                      <TableRow key={auto.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAutos.includes(auto.id)}
                            onCheckedChange={() => handleToggleAuto(auto.id)}
                          />
                        </TableCell>
                        <TableCell>{auto.marke}</TableCell>
                        <TableCell>{auto.modell}</TableCell>
                        <TableCell className="font-mono text-sm">{auto.fahrgestell_nr}</TableCell>
                        <TableCell>{formatCurrency(auto.einzelpreis_netto || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">
                  Ausgewählt: {selectedAutos.length} Fahrzeug(e) | Gesamtsumme (netto): {formatCurrency(nettopreis)}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Zusammenfassung</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vorlage:</p>
                    <p className="font-medium">{templates?.find(t => t.id === selectedTemplate)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kanzlei:</p>
                    <p className="font-medium">{kanzleien?.find(k => k.id === selectedKanzlei)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Insolventes Unternehmen:</p>
                    <p className="font-medium">{insolventeUnternehmen?.find(u => u.id === selectedInsoUnternehmen)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kunde:</p>
                    <p className="font-medium">{kunden?.find(k => k.id === selectedKunde)?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Anzahl Fahrzeuge:</p>
                    <p className="font-medium">{selectedAutos.length}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">Preisübersicht</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nettopreis:</span>
                      <span className="font-medium">{formatCurrency(nettopreis)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MwSt (19%):</span>
                      <span className="font-medium">{formatCurrency(mwst)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Bruttopreis:</span>
                      <span>{formatCurrency(bruttopreis)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                <FileOutput className="w-5 h-5 mr-2" />
                {isGenerating ? 'Wird generiert...' : 'Dokument jetzt generieren'}
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3) ||
                  (step === 3 && !canProceedToStep4)
                }
              >
                Weiter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateDocument;
