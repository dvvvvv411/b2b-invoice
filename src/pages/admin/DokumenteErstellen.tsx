import { useState } from 'react';
import { FileText, FileType, Download, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useKunden } from '@/hooks/useKunden';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useAutos } from '@/hooks/useAutos';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { useGenerateRechnungPDF } from '@/hooks/useGenerateRechnungPDF';
import { useGenerateRechnungDOCX } from '@/hooks/useGenerateRechnungDOCX';
import { useGenerateKaufvertragPDF } from '@/hooks/useGenerateKaufvertragPDF';
import { useGenerateKaufvertragDOCX } from '@/hooks/useGenerateKaufvertragDOCX';
import { formatPrice } from '@/lib/formatters';

const DokumenteErstellen = () => {
  const [documentType, setDocumentType] = useState<'rechnung' | 'kaufvertrag'>('rechnung');
  const [kanzlei, setKanzlei] = useState<string>('');
  const [kunde, setKunde] = useState<string>('');
  const [bankkonto, setBankkonto] = useState<string>('');
  const [insolventesUnternehmen, setInsolventesUnternehmen] = useState<string>('');
  const [spedition, setSpedition] = useState<string>('');
  const [autoIds, setAutoIds] = useState<string[]>([]);
  const [selectedAutoId, setSelectedAutoId] = useState<string>('');

  const { data: kanzleien = [] } = useKanzleien();
  const { data: kunden = [] } = useKunden();
  const { data: bankkonten = [] } = useBankkonten();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  const { data: speditionen = [] } = useSpeditionen();
  const { data: autos = [] } = useAutos();

  const generateRechnungPDFMutation = useGenerateRechnungPDF();
  const generateRechnungDOCXMutation = useGenerateRechnungDOCX();
  const generateKaufvertragPDFMutation = useGenerateKaufvertragPDF();
  const generateKaufvertragDOCXMutation = useGenerateKaufvertragDOCX();

  // Calculate totals for Rechnung
  const selectedAutos = autos.filter(auto => autoIds.includes(auto.id));
  const nettopreis = selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const mwst = nettopreis * 0.19;
  const bruttopreis = nettopreis + mwst;

  // Calculate totals for Kaufvertrag
  const selectedAuto = autos.find(auto => auto.id === selectedAutoId);
  const kaufvertragNettopreis = selectedAuto?.einzelpreis_netto || 0;
  const kaufvertragBruttopreis = kaufvertragNettopreis * 1.19;

  // Validation
  const isValidRechnung = kanzlei && kunde && bankkonto && insolventesUnternehmen && autoIds.length > 0;
  const isValidKaufvertrag = kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition && selectedAutoId;
  const isValid = documentType === 'rechnung' ? isValidRechnung : isValidKaufvertrag;

  const handleToggleAuto = (autoId: string) => {
    setAutoIds(prev =>
      prev.includes(autoId)
        ? prev.filter(id => id !== autoId)
        : [...prev, autoId]
    );
  };

  const handleToggleAll = () => {
    if (autoIds.length === autos.length) {
      setAutoIds([]);
    } else {
      setAutoIds(autos.map(auto => auto.id));
    }
  };

  const handleGeneratePDF = () => {
    if (!isValid) return;
    
    if (documentType === 'rechnung') {
      generateRechnungPDFMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        auto_ids: autoIds,
      });
    } else {
      generateKaufvertragPDFMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        spedition_id: spedition,
        auto_id: selectedAutoId,
      });
    }
  };

  const handleGenerateDOCX = () => {
    if (!isValid) return;
    
    if (documentType === 'rechnung') {
      generateRechnungDOCXMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        auto_ids: autoIds,
      });
    } else {
      generateKaufvertragDOCXMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        spedition_id: spedition,
        auto_id: selectedAutoId,
      });
    }
  };

  const isGenerating = 
    generateRechnungPDFMutation.isPending || 
    generateRechnungDOCXMutation.isPending ||
    generateKaufvertragPDFMutation.isPending ||
    generateKaufvertragDOCXMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20">
          <FileText className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">
            Dokumente erstellen
          </h1>
          <p className="text-muted-foreground">
            Erstellen Sie Rechnungen und andere Dokumente
          </p>
        </div>
      </div>

      {/* Document Type Selection */}
      <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as 'rechnung' | 'kaufvertrag')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rechnung">
            <FileText className="w-4 h-4 mr-2" />
            Rechnung erstellen
          </TabsTrigger>
          <TabsTrigger value="kaufvertrag">
            <Car className="w-4 h-4 mr-2" />
            Kaufvertrag 1 Fahrzeug (Privat)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={documentType} className="mt-6 space-y-6">
          {/* Invoice/Contract Details */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">
                {documentType === 'rechnung' ? 'Rechnungsdetails' : 'Kaufvertragsdetails'}
              </CardTitle>
              <CardDescription>
                {documentType === 'rechnung' 
                  ? 'Geben Sie die Informationen für die Rechnung ein'
                  : 'Geben Sie die Informationen für den Kaufvertrag ein'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kanzlei */}
                <div className="space-y-2">
                  <Label htmlFor="kanzlei">Kanzlei *</Label>
                  <Select value={kanzlei} onValueChange={setKanzlei}>
                    <SelectTrigger id="kanzlei">
                      <SelectValue placeholder="Kanzlei auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {kanzleien.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kunde */}
                <div className="space-y-2">
                  <Label htmlFor="kunde">Kunde *</Label>
                  <Select value={kunde} onValueChange={setKunde}>
                    <SelectTrigger id="kunde">
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {kunden.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bankkonto */}
                <div className="space-y-2">
                  <Label htmlFor="bankkonto">Bankkonto *</Label>
                  <Select value={bankkonto} onValueChange={setBankkonto}>
                    <SelectTrigger id="bankkonto">
                      <SelectValue placeholder="Bankkonto auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankkonten.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.kontoname || b.iban}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Insolventes Unternehmen */}
                <div className="space-y-2">
                  <Label htmlFor="insolventes-unternehmen">Insolventes Unternehmen *</Label>
                  <Select value={insolventesUnternehmen} onValueChange={setInsolventesUnternehmen}>
                    <SelectTrigger id="insolventes-unternehmen">
                      <SelectValue placeholder="Unternehmen auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {insolventeUnternehmen.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Spedition - nur bei Kaufvertrag */}
                {documentType === 'kaufvertrag' && (
                  <div className="space-y-2">
                    <Label htmlFor="spedition">Spedition *</Label>
                    <Select value={spedition} onValueChange={setSpedition}>
                      <SelectTrigger id="spedition">
                        <SelectValue placeholder="Spedition auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {speditionen.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Selection */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gradient-primary">
                    {documentType === 'rechnung' ? 'Fahrzeuge auswählen' : 'Fahrzeug auswählen'}
                  </CardTitle>
                  <CardDescription>
                    {documentType === 'rechnung' 
                      ? `${autoIds.length} von ${autos.length} Fahrzeugen ausgewählt`
                      : 'Wählen Sie ein Fahrzeug für den Kaufvertrag'}
                  </CardDescription>
                </div>
                {documentType === 'rechnung' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleAll}
                  >
                    {autoIds.length === autos.length ? 'Keine auswählen' : 'Alle auswählen'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {documentType === 'rechnung' ? (
                  <div className="space-y-3">
                    {autos.map((auto) => (
                      <div
                        key={auto.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <Checkbox
                          id={`auto-${auto.id}`}
                          checked={autoIds.includes(auto.id)}
                          onCheckedChange={() => handleToggleAuto(auto.id)}
                        />
                        <label
                          htmlFor={`auto-${auto.id}`}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {auto.marke} {auto.modell}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Fahrgestell-Nr.: {auto.fahrgestell_nr || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gradient-secondary">
                              {formatPrice(auto.einzelpreis_netto)}
                            </p>
                            <p className="text-xs text-muted-foreground">Netto</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RadioGroup value={selectedAutoId} onValueChange={setSelectedAutoId}>
                    <div className="space-y-3">
                      {autos.map((auto) => (
                        <div
                          key={auto.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          <RadioGroupItem value={auto.id} id={`auto-radio-${auto.id}`} />
                          <label
                            htmlFor={`auto-radio-${auto.id}`}
                            className="flex-1 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {auto.marke} {auto.modell}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Fahrgestell-Nr.: {auto.fahrgestell_nr || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gradient-secondary">
                                {formatPrice(auto.einzelpreis_netto)}
                              </p>
                              <p className="text-xs text-muted-foreground">Netto</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Summary */}
          {((documentType === 'rechnung' && autoIds.length > 0) || 
            (documentType === 'kaufvertrag' && selectedAutoId)) && (
            <Card className="glass border-secondary/20">
              <CardHeader>
                <CardTitle className="text-gradient-secondary">
                  {documentType === 'rechnung' ? 'Rechnungssumme' : 'Kaufpreissumme'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nettopreis:</span>
                  <span className="font-bold text-lg">
                    {formatPrice(documentType === 'rechnung' ? nettopreis : kaufvertragNettopreis)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MwSt (19%):</span>
                  <span className="font-bold text-lg">
                    {formatPrice(documentType === 'rechnung' ? mwst : kaufvertragNettopreis * 0.19)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Bruttopreis:</span>
                  <span className="font-bold text-2xl text-gradient-primary">
                    {formatPrice(documentType === 'rechnung' ? bruttopreis : kaufvertragBruttopreis)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="glass border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleGenerateDOCX}
                  disabled={!isValid || isGenerating}
                >
                  {(documentType === 'rechnung' ? generateRechnungDOCXMutation.isPending : generateKaufvertragDOCXMutation.isPending) ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-bounce" />
                      Generiere DOCX...
                    </>
                  ) : (
                    <>
                      <FileType className="w-4 h-4 mr-2" />
                      DOCX generieren
                    </>
                  )}
                </Button>
                <Button
                  variant="gaming"
                  size="lg"
                  onClick={handleGeneratePDF}
                  disabled={!isValid || isGenerating}
                >
                  {(documentType === 'rechnung' ? generateRechnungPDFMutation.isPending : generateKaufvertragPDFMutation.isPending) ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-bounce" />
                      Generiere PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF generieren
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Card - JSON Data */}
          {documentType === 'kaufvertrag' && generateKaufvertragPDFMutation.lastRequestData && (
            <Card className="glass border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-500 flex items-center gap-2">
                  🔍 Debug: JSON an Docmosis API
                </CardTitle>
                <CardDescription>
                  Diese Daten wurden an die Edge Function gesendet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs bg-black/50 p-4 rounded text-green-400 font-mono">
                    {JSON.stringify(generateKaufvertragPDFMutation.lastRequestData, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DokumenteErstellen;
