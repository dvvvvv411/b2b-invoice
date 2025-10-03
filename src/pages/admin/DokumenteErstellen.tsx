import { useState, useEffect } from 'react';
import { FileText, FileType, Download, Car, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useKunden } from '@/hooks/useKunden';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useAutos } from '@/hooks/useAutos';
import { useSpeditionen } from '@/hooks/useSpeditionen';
import { useGenerateRechnungPDF } from '@/hooks/useGenerateRechnungPDF';
import { useGenerateRechnungDOCX } from '@/hooks/useGenerateRechnungDOCX';
import { useGenerateKaufvertragPDF, useGenerateKaufvertragJSON } from '@/hooks/useGenerateKaufvertragPDF';
import { useGenerateKaufvertragDOCX } from '@/hooks/useGenerateKaufvertragDOCX';
import { formatPrice } from '@/lib/formatters';

type DocumentType = 
  | 'rechnung' 
  | 'kaufvertrag-1-p'
  | 'kaufvertrag-1-u'
  | 'kaufvertrag-m-p'
  | 'kaufvertrag-m-u';

const DokumenteErstellen = () => {
  const [documentType, setDocumentType] = useState<DocumentType>('rechnung');
  const [kanzlei, setKanzlei] = useState<string>('');
  const [kunde, setKunde] = useState<string>('');
  const [bankkonto, setBankkonto] = useState<string>('');
  const [insolventesUnternehmen, setInsolventesUnternehmen] = useState<string>('');
  const [spedition, setSpedition] = useState<string>('');
  const [autoIds, setAutoIds] = useState<string[]>([]);
  const [selectedAutoId, setSelectedAutoId] = useState<string>('');
  const [dekraInput, setDekraInput] = useState<string>('');

  const { toast } = useToast();

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
  const generateKaufvertragJSONMutation = useGenerateKaufvertragJSON();

  // Helper functions
  const getTemplateName = (docType: DocumentType): string => {
    const templateMap: Record<DocumentType, string> = {
      'rechnung': '',
      'kaufvertrag-1-p': 'Kaufvertrag-1-P.docx',
      'kaufvertrag-1-u': 'Kaufvertrag-1-U.docx',
      'kaufvertrag-m-p': 'Kaufvertrag-M-P.docx',
      'kaufvertrag-m-u': 'Kaufvertrag-M-U.docx',
    };
    return templateMap[docType];
  };

  const isKaufvertrag = documentType.startsWith('kaufvertrag-');
  const isSingleVehicleKaufvertrag = documentType.includes('-1-');
  const isMultipleVehicleKaufvertrag = documentType.includes('-m-');

  // Auto-select defaults when data loads
  useEffect(() => {
    // Auto-select default Kanzlei
    const defaultKanzlei = kanzleien.find(k => k.is_default);
    if (defaultKanzlei && !kanzlei) {
      setKanzlei(defaultKanzlei.id);
    }

    // Auto-select default Insolventes Unternehmen
    const defaultInsolventes = insolventeUnternehmen.find(u => u.is_default);
    if (defaultInsolventes && !insolventesUnternehmen) {
      setInsolventesUnternehmen(defaultInsolventes.id);
    }

    // Auto-select default Spedition (only for Kaufverträge)
    if (isKaufvertrag) {
      const defaultSpedition = speditionen.find(s => s.is_default);
      if (defaultSpedition && !spedition) {
        setSpedition(defaultSpedition.id);
      }
    }
  }, [kanzleien, insolventeUnternehmen, speditionen, isKaufvertrag, kanzlei, insolventesUnternehmen, spedition]);

  // Calculate totals for Rechnung
  const selectedAutos = autos.filter(auto => autoIds.includes(auto.id));
  const nettopreis = selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const mwst = nettopreis * 0.19;
  const bruttopreis = nettopreis + mwst;

  // Calculate totals for Kaufvertrag single vehicle
  const selectedAuto = autos.find(auto => auto.id === selectedAutoId);
  const kaufvertragNettopreis = selectedAuto?.einzelpreis_netto || 0;
  const kaufvertragBruttopreis = kaufvertragNettopreis * 1.19;

  // Calculate totals for Kaufvertrag multiple vehicles
  const kaufvertragMultipleNettopreis = isMultipleVehicleKaufvertrag
    ? selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0)
    : 0;
  const kaufvertragMultipleBruttopreis = kaufvertragMultipleNettopreis * 1.19;

  // Validation
  const isValidRechnung = kanzlei && kunde && bankkonto && insolventesUnternehmen && autoIds.length > 0;
  const isValidKaufvertragSingle = kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition && selectedAutoId;
  const isValidKaufvertragMultiple = kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition && autoIds.length > 0;
  
  const isValid = 
    documentType === 'rechnung' 
      ? isValidRechnung 
      : (isSingleVehicleKaufvertrag ? isValidKaufvertragSingle : isValidKaufvertragMultiple);

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

  const findAutoByDekra = (dekraNr: string) => {
    return autos.find(auto => 
      auto.dekra_bericht_nr?.toLowerCase().trim() === dekraNr.toLowerCase().trim()
    );
  };

  const handleAddByDekra = () => {
    const dekraNr = dekraInput.trim();
    if (!dekraNr) return;

    const foundAuto = findAutoByDekra(dekraNr);
    
    if (!foundAuto) {
      toast({
        title: 'Fahrzeug nicht gefunden',
        description: `Kein Fahrzeug mit DEKRA-Nr. "${dekraNr}" gefunden.`,
        variant: 'destructive',
      });
      return;
    }

    if (isSingleVehicleKaufvertrag) {
      setSelectedAutoId(foundAuto.id);
      toast({
        title: 'Fahrzeug ausgewählt',
        description: `${foundAuto.marke} ${foundAuto.modell} wurde ausgewählt.`,
      });
    } else {
      if (autoIds.includes(foundAuto.id)) {
        toast({
          title: 'Bereits ausgewählt',
          description: `${foundAuto.marke} ${foundAuto.modell} ist bereits in der Liste.`,
        });
      } else {
        setAutoIds(prev => [...prev, foundAuto.id]);
        toast({
          title: 'Fahrzeug hinzugefügt',
          description: `${foundAuto.marke} ${foundAuto.modell} zur Liste hinzugefügt.`,
        });
      }
    }

    setDekraInput('');
  };

  const handleRemoveAuto = (autoId: string) => {
    if (isSingleVehicleKaufvertrag) {
      setSelectedAutoId('');
    } else {
      setAutoIds(prev => prev.filter(id => id !== autoId));
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
        ...(isSingleVehicleKaufvertrag 
          ? { auto_id: selectedAutoId }
          : { auto_ids: autoIds }
        ),
        templateName: getTemplateName(documentType),
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
        ...(isSingleVehicleKaufvertrag 
          ? { auto_id: selectedAutoId }
          : { auto_ids: autoIds }
        ),
        templateName: getTemplateName(documentType),
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
      <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rechnung">
            <FileText className="w-4 h-4 mr-2" />
            Rechnung
          </TabsTrigger>
          <TabsTrigger value="kaufvertrag-1-p">
            <Car className="w-4 h-4 mr-2" />
            KV 1 Fzg (Privat)
          </TabsTrigger>
          <TabsTrigger value="kaufvertrag-1-u">
            <Car className="w-4 h-4 mr-2" />
            KV 1 Fzg (Unternehmen)
          </TabsTrigger>
          <TabsTrigger value="kaufvertrag-m-p">
            <Car className="w-4 h-4 mr-2" />
            KV Mehrere (Privat)
          </TabsTrigger>
          <TabsTrigger value="kaufvertrag-m-u">
            <Car className="w-4 h-4 mr-2" />
            KV Mehrere (Unternehmen)
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
                          {k.name} {k.is_default && '⭐'}
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
                          {u.name} {u.is_default && '⭐'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Spedition - nur bei Kaufvertrag */}
                {isKaufvertrag && (
                  <div className="space-y-2">
                    <Label htmlFor="spedition">Spedition *</Label>
                    <Select value={spedition} onValueChange={setSpedition}>
                      <SelectTrigger id="spedition">
                        <SelectValue placeholder="Spedition auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {speditionen.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.is_default && '⭐'}
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
              <CardTitle className="text-gradient-primary">
                {documentType === 'rechnung' || isMultipleVehicleKaufvertrag
                  ? 'Fahrzeuge auswählen (mehrere möglich)'
                  : 'Fahrzeug auswählen (nur eines)'}
              </CardTitle>
              <CardDescription>
                Geben Sie die DEKRA-Nummer ein, um Fahrzeuge schnell hinzuzufügen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* DEKRA Quick-Add Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="DEKRA-Nummer eingeben (z.B. 0993)"
                    value={dekraInput}
                    onChange={(e) => setDekraInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddByDekra();
                      }
                    }}
                    className="font-mono"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAddByDekra}
                  disabled={!dekraInput.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>

              {/* Selected Vehicles Display */}
              {((isSingleVehicleKaufvertrag && selectedAutoId) || 
                (!isSingleVehicleKaufvertrag && autoIds.length > 0)) && (
                <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gradient-primary">
                      Ausgewählte Fahrzeuge ({isSingleVehicleKaufvertrag ? 1 : autoIds.length})
                    </p>
                    {!isSingleVehicleKaufvertrag && autoIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoIds([])}
                      >
                        Alle entfernen
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {isSingleVehicleKaufvertrag ? (
                      selectedAuto && (
                        <div className="flex items-center justify-between p-3 bg-background rounded-md border border-border">
                          <div className="flex-1">
                            <p className="font-medium">{selectedAuto.marke} {selectedAuto.modell}</p>
                            <p className="text-xs text-muted-foreground">
                              DEKRA: {selectedAuto.dekra_bericht_nr} | FIN: {selectedAuto.fahrgestell_nr}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gradient-secondary">
                              {formatPrice(selectedAuto.einzelpreis_netto)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAuto(selectedAuto.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    ) : (
                      selectedAutos.map((auto) => (
                        <div 
                          key={auto.id}
                          className="flex items-center justify-between p-3 bg-background rounded-md border border-border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{auto.marke} {auto.modell}</p>
                            <p className="text-xs text-muted-foreground">
                              DEKRA: {auto.dekra_bericht_nr} | FIN: {auto.fahrgestell_nr}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gradient-secondary">
                              {formatPrice(auto.einzelpreis_netto)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAuto(auto.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Optional: Collapsible ScrollArea für manuelle Auswahl */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Oder manuell aus Liste auswählen ({autos.length} Fahrzeuge)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-[300px] pr-4">
                {(documentType === 'rechnung' || isMultipleVehicleKaufvertrag) ? (
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
                </CollapsibleContent>
              </Collapsible>

            </CardContent>
          </Card>

          {/* Summary */}
          {((documentType === 'rechnung' && autoIds.length > 0) || 
            (isSingleVehicleKaufvertrag && selectedAutoId) ||
            (isMultipleVehicleKaufvertrag && autoIds.length > 0)) && (
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
                    {formatPrice(
                      documentType === 'rechnung' 
                        ? nettopreis 
                        : (isSingleVehicleKaufvertrag ? kaufvertragNettopreis : kaufvertragMultipleNettopreis)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MwSt (19%):</span>
                  <span className="font-bold text-lg">
                    {formatPrice(
                      documentType === 'rechnung' 
                        ? mwst 
                        : (isSingleVehicleKaufvertrag ? kaufvertragNettopreis * 0.19 : kaufvertragMultipleNettopreis * 0.19)
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Bruttopreis:</span>
                  <span className="font-bold text-2xl text-gradient-primary">
                    {formatPrice(
                      documentType === 'rechnung' 
                        ? bruttopreis 
                        : (isSingleVehicleKaufvertrag ? kaufvertragBruttopreis : kaufvertragMultipleBruttopreis)
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="glass border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {isSingleVehicleKaufvertrag && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (selectedAutoId && kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition) {
                        generateKaufvertragJSONMutation.mutate({
                          kanzlei_id: kanzlei,
                          kunde_id: kunde,
                          bankkonto_id: bankkonto,
                          insolvente_unternehmen_id: insolventesUnternehmen,
                          spedition_id: spedition,
                          auto_id: selectedAutoId,
                        });
                      }
                    }}
                    disabled={!isValid || generateKaufvertragJSONMutation.isPending}
                  >
                    {generateKaufvertragJSONMutation.isPending ? (
                      <>
                        <Download className="w-4 h-4 mr-2 animate-spin" />
                        Lade JSON...
                      </>
                    ) : (
                      <>
                        🔍 JSON Debug anzeigen
                      </>
                    )}
                  </Button>
                )}
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

          {/* Debug Card - Complete JSON Data */}
          {isSingleVehicleKaufvertrag && generateKaufvertragJSONMutation.data && (
            <Card className="glass border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-500 flex items-center gap-2">
                  🔍 Debug: Vollständige JSON-Daten an Docmosis API
                </CardTitle>
                <CardDescription>
                  Diese kompletten Daten werden an Docmosis gesendet (inkl. formatierte Preise, Daten, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs bg-black/50 p-4 rounded text-green-400 font-mono">
                    {JSON.stringify(generateKaufvertragJSONMutation.data, null, 2)}
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
