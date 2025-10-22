import { useState, useEffect } from 'react';
import { FileText, FileType, Download, Car, Plus, X, ChevronDown, Check, ChevronsUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
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
import { useGenerateTreuhandvertragPDF } from '@/hooks/useGenerateTreuhandvertragPDF';
import { useGenerateTreuhandvertragDOCX } from '@/hooks/useGenerateTreuhandvertragDOCX';
import { formatPrice } from '@/lib/formatters';
import { KundenForm } from '@/components/kunden/KundenForm';
import { BankkontenForm } from '@/components/bankkonten/BankkontenForm';

type DocumentType = 'rechnung' | 'kaufvertrag' | 'treuhandvertrag';

const DokumenteErstellen = () => {
  const [documentType, setDocumentType] = useState<DocumentType>('rechnung');
  const [kaufvertragType, setKaufvertragType] = useState<string>('kaufvertrag-1-p');
  const [treuhandvertragGender, setTreuhandvertragGender] = useState<'M' | 'W'>('M');
  const [kanzlei, setKanzlei] = useState<string>('');
  const [kunde, setKunde] = useState<string>('');
  const [bankkonto, setBankkonto] = useState<string>('');
  const [insolventesUnternehmen, setInsolventesUnternehmen] = useState<string>('');
  const [spedition, setSpedition] = useState<string>('');
  const [autoIds, setAutoIds] = useState<string[]>([]);
  const [selectedAutoId, setSelectedAutoId] = useState<string>('');
  const [dekraInput, setDekraInput] = useState<string>('');
  const [bulkDekraInput, setBulkDekraInput] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [applyDiscount, setApplyDiscount] = useState<boolean>(false);
  const [isKundenFormOpen, setIsKundenFormOpen] = useState<boolean>(false);
  const [isBankkontenFormOpen, setIsBankkontenFormOpen] = useState<boolean>(false);
  const [autoSearchQuery, setAutoSearchQuery] = useState<string>('');
  const [kundeComboboxOpen, setKundeComboboxOpen] = useState<boolean>(false);

  const { toast } = useToast();

  const { data: kanzleien = [] } = useKanzleien();
  const { data: kunden = [] } = useKunden();
  const { data: bankkonten = [] } = useBankkonten();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  const { data: speditionen = [] } = useSpeditionen();
  const { data: autos = [] } = useAutos();

  const [includeRechnung, setIncludeRechnung] = useState<boolean>(false);
  const [includeTreuhandvertrag, setIncludeTreuhandvertrag] = useState<boolean>(false);

  const generateRechnungPDFMutation = useGenerateRechnungPDF();
  const generateRechnungDOCXMutation = useGenerateRechnungDOCX();
  const generateKaufvertragPDFMutation = useGenerateKaufvertragPDF();
  const generateKaufvertragDOCXMutation = useGenerateKaufvertragDOCX();
  const generateKaufvertragJSONMutation = useGenerateKaufvertragJSON();
  const generateTreuhandvertragPDFMutation = useGenerateTreuhandvertragPDF();
  const generateTreuhandvertragDOCXMutation = useGenerateTreuhandvertragDOCX();

  // Helper functions
  const getKaufvertragLabel = (type: string) => {
    switch(type) {
      case 'kaufvertrag-1-p': return '1 Fahrzeug (Privat)';
      case 'kaufvertrag-1-u': return '1 Fahrzeug (Unternehmen)';
      case 'kaufvertrag-m-p': return 'Mehrere Fahrzeuge (Privat)';
      case 'kaufvertrag-m-u': return 'Mehrere Fahrzeuge (Unternehmen)';
      default: return 'Kaufvertrag-Art auswählen';
    }
  };

  const getTemplateName = (kvType?: string): string => {
    const type = kvType || kaufvertragType;
    const templateMap: Record<string, string> = {
      'kaufvertrag-1-p': 'Kaufvertrag-1-P.docx',
      'kaufvertrag-1-u': 'Kaufvertrag-1-U.docx',
      'kaufvertrag-m-p': 'Kaufvertrag-M-P.docx',
      'kaufvertrag-m-u': 'Kaufvertrag-M-U.docx',
    };
    return templateMap[type] || '';
  };

  const isKaufvertrag = documentType === 'kaufvertrag';
  const isSingleVehicleKaufvertrag = isKaufvertrag && kaufvertragType.includes('-1-');
  const isMultipleVehicleKaufvertrag = isKaufvertrag && kaufvertragType.includes('-m-');

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

  // Discount calculation helper
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!applyDiscount || !discountPercentage || parseFloat(discountPercentage) === 0) {
      return originalPrice;
    }
    const discount = parseFloat(discountPercentage) / 100;
    return originalPrice * (1 - discount);
  };

  // Calculate totals for Rechnung
  const selectedAutos = autos.filter(auto => autoIds.includes(auto.id));
  const nettopreis = selectedAutos.reduce((sum, auto) => sum + calculateDiscountedPrice(auto.einzelpreis_netto || 0), 0);
  const mwst = nettopreis * 0.19;
  const bruttopreis = nettopreis + mwst;

  // Calculate totals for Kaufvertrag single vehicle
  const selectedAuto = autos.find(auto => auto.id === selectedAutoId);
  const kaufvertragNettopreis = selectedAuto ? calculateDiscountedPrice(selectedAuto.einzelpreis_netto || 0) : 0;
  const kaufvertragBruttopreis = kaufvertragNettopreis * 1.19;

  // Calculate totals for Kaufvertrag multiple vehicles
  const kaufvertragMultipleNettopreis = isMultipleVehicleKaufvertrag
    ? selectedAutos.reduce((sum, auto) => sum + calculateDiscountedPrice(auto.einzelpreis_netto || 0), 0)
    : 0;
  const kaufvertragMultipleBruttopreis = kaufvertragMultipleNettopreis * 1.19;

  // Filter autos based on search query
  const filteredAutos = autos.filter(auto => {
    if (!autoSearchQuery.trim()) return true;
    
    const query = autoSearchQuery.toLowerCase();
    return (
      auto.marke?.toLowerCase().includes(query) ||
      auto.modell?.toLowerCase().includes(query) ||
      auto.fahrgestell_nr?.toLowerCase().includes(query) ||
      auto.dekra_bericht_nr?.toLowerCase().includes(query)
    );
  });

  // Validation
  const isValidRechnung = kanzlei && kunde && bankkonto && insolventesUnternehmen && autoIds.length > 0;
  const isValidKaufvertragSingle = kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition && selectedAutoId;
  const isValidKaufvertragMultiple = kanzlei && kunde && bankkonto && insolventesUnternehmen && spedition && autoIds.length > 0;
  const isValidTreuhandvertrag = kanzlei && kunde && bankkonto && insolventesUnternehmen;
  
  const isValid = 
    documentType === 'rechnung' 
      ? isValidRechnung 
      : documentType === 'treuhandvertrag'
        ? isValidTreuhandvertrag
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

  const handleBulkAddByDekra = () => {
    const dekraNumbers = bulkDekraInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (dekraNumbers.length === 0) {
      toast({
        title: 'Keine DEKRA-Nummern',
        description: 'Bitte geben Sie mindestens eine DEKRA-Nummer ein.',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let alreadySelectedCount = 0;
    const notFoundNumbers: string[] = [];

    dekraNumbers.forEach(dekraNr => {
      const foundAuto = findAutoByDekra(dekraNr);
      
      if (!foundAuto) {
        notFoundNumbers.push(dekraNr);
        return;
      }

      if (isSingleVehicleKaufvertrag) {
        setSelectedAutoId(foundAuto.id);
        successCount = 1;
      } else {
        if (autoIds.includes(foundAuto.id)) {
          alreadySelectedCount++;
        } else {
          setAutoIds(prev => [...prev, foundAuto.id]);
          successCount++;
        }
      }
    });

    if (successCount > 0) {
      toast({
        title: 'Fahrzeuge hinzugefügt',
        description: `${successCount} Fahrzeug(e) erfolgreich hinzugefügt.`,
      });
    }

    if (alreadySelectedCount > 0) {
      toast({
        title: 'Bereits ausgewählt',
        description: `${alreadySelectedCount} Fahrzeug(e) waren bereits ausgewählt.`,
      });
    }

    if (notFoundNumbers.length > 0) {
      toast({
        title: 'Nicht gefunden',
        description: `Folgende DEKRA-Nummern wurden nicht gefunden: ${notFoundNumbers.join(', ')}`,
        variant: 'destructive',
      });
    }

    setBulkDekraInput('');
  };

  const handleGeneratePDF = () => {
    if (!isValid) return;
    
    if (documentType === 'rechnung') {
      const autosWithDiscount = selectedAutos.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

      generateRechnungPDFMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        auto_ids: autoIds,
        discounted_autos: autosWithDiscount,
      });
    } else if (documentType === 'treuhandvertrag') {
      generateTreuhandvertragPDFMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        gender: treuhandvertragGender,
      });
    } else {
      const autosForKaufvertrag = isSingleVehicleKaufvertrag 
        ? (selectedAuto ? [selectedAuto] : [])
        : selectedAutos;
      
      const autosWithDiscount = autosForKaufvertrag.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

      // Prepare Rechnung data in case includeRechnung is true
      const autosForRechnung = isSingleVehicleKaufvertrag ? autosForKaufvertrag : selectedAutos;
      const rechnungAutoIds = autosForRechnung.map(a => a.id);
      const rechnungAutosWithDiscount = autosForRechnung.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

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
        templateName: getTemplateName(kaufvertragType),
        discounted_autos: autosWithDiscount,
      }, {
        onSuccess: () => {
          if (includeRechnung) {
            generateRechnungPDFMutation.mutate({
              kanzlei_id: kanzlei,
              kunde_id: kunde,
              bankkonto_id: bankkonto,
              insolvente_unternehmen_id: insolventesUnternehmen,
              auto_ids: rechnungAutoIds,
              discounted_autos: rechnungAutosWithDiscount,
            });
          }
          if (includeTreuhandvertrag) {
            generateTreuhandvertragPDFMutation.mutate({
              kanzlei_id: kanzlei,
              kunde_id: kunde,
              bankkonto_id: bankkonto,
              insolvente_unternehmen_id: insolventesUnternehmen,
              gender: treuhandvertragGender,
            });
          }
        }
      });
    }
  };

  const handleGenerateDOCX = () => {
    if (!isValid) return;
    
    if (documentType === 'rechnung') {
      const autosWithDiscount = selectedAutos.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

      generateRechnungDOCXMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        auto_ids: autoIds,
        discounted_autos: autosWithDiscount,
      });
    } else if (documentType === 'treuhandvertrag') {
      generateTreuhandvertragDOCXMutation.mutate({
        kanzlei_id: kanzlei,
        kunde_id: kunde,
        bankkonto_id: bankkonto,
        insolvente_unternehmen_id: insolventesUnternehmen,
        gender: treuhandvertragGender,
      });
    } else {
      const autosForKaufvertrag = isSingleVehicleKaufvertrag 
        ? (selectedAuto ? [selectedAuto] : [])
        : selectedAutos;
      
      const autosWithDiscount = autosForKaufvertrag.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

      // Prepare Rechnung data in case includeRechnung is true
      const autosForRechnung = isSingleVehicleKaufvertrag ? autosForKaufvertrag : selectedAutos;
      const rechnungAutoIds = autosForRechnung.map(a => a.id);
      const rechnungAutosWithDiscount = autosForRechnung.map(auto => ({
        ...auto,
        einzelpreis_netto: calculateDiscountedPrice(auto.einzelpreis_netto || 0)
      }));

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
        templateName: getTemplateName(kaufvertragType),
        discounted_autos: autosWithDiscount,
      }, {
        onSuccess: () => {
          if (includeRechnung) {
            generateRechnungDOCXMutation.mutate({
              kanzlei_id: kanzlei,
              kunde_id: kunde,
              bankkonto_id: bankkonto,
              insolvente_unternehmen_id: insolventesUnternehmen,
              auto_ids: rechnungAutoIds,
              discounted_autos: rechnungAutosWithDiscount,
            });
          }
          if (includeTreuhandvertrag) {
            generateTreuhandvertragDOCXMutation.mutate({
              kanzlei_id: kanzlei,
              kunde_id: kunde,
              bankkonto_id: bankkonto,
              insolvente_unternehmen_id: insolventesUnternehmen,
              gender: treuhandvertragGender,
            });
          }
        }
      });
    }
  };

  const isGenerating = 
    generateRechnungPDFMutation.isPending || 
    generateRechnungDOCXMutation.isPending ||
    generateKaufvertragPDFMutation.isPending ||
    generateKaufvertragDOCXMutation.isPending ||
    generateTreuhandvertragPDFMutation.isPending ||
    generateTreuhandvertragDOCXMutation.isPending;

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
        <div className="flex items-center gap-4">
          <TabsList className="inline-flex gap-2">
            <TabsTrigger value="rechnung">
              <FileText className="w-4 h-4 mr-2" />
              Rechnung
            </TabsTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={documentType === 'kaufvertrag' ? 'default' : 'ghost'}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Car className="w-4 h-4 mr-2" />
                  {documentType === 'kaufvertrag' ? getKaufvertragLabel(kaufvertragType) : 'Kaufvertrag'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('kaufvertrag');
                    setKaufvertragType('kaufvertrag-1-p');
                  }}
                >
                  1 Fahrzeug (Privat)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('kaufvertrag');
                    setKaufvertragType('kaufvertrag-1-u');
                  }}
                >
                  1 Fahrzeug (Unternehmen)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('kaufvertrag');
                    setKaufvertragType('kaufvertrag-m-p');
                  }}
                >
                  Mehrere Fahrzeuge (Privat)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('kaufvertrag');
                    setKaufvertragType('kaufvertrag-m-u');
                  }}
                >
                  Mehrere Fahrzeuge (Unternehmen)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={documentType === 'treuhandvertrag' ? 'default' : 'ghost'}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <FileType className="w-4 h-4 mr-2" />
                  {documentType === 'treuhandvertrag' ? `Treuhandvertrag (${treuhandvertragGender === 'M' ? 'Männlich' : 'Weiblich'})` : 'Treuhandvertrag'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('treuhandvertrag');
                    setTreuhandvertragGender('M');
                  }}
                >
                  Männlich
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setDocumentType('treuhandvertrag');
                    setTreuhandvertragGender('W');
                  }}
                >
                  Weiblich
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>
          
          {documentType === 'kaufvertrag' && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="include-rechnung"
                  checked={includeRechnung}
                  onCheckedChange={setIncludeRechnung}
                />
                <Label htmlFor="include-rechnung" className="text-sm font-medium cursor-pointer">
                  inkl. Rechnung
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="include-treuhandvertrag"
                  checked={includeTreuhandvertrag}
                  onCheckedChange={setIncludeTreuhandvertrag}
                />
                <Label htmlFor="include-treuhandvertrag" className="text-sm font-medium cursor-pointer">
                  inkl. Treuhandvertrag
                </Label>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="rechnung" className="mt-6 space-y-6">
          {/* Invoice/Contract Details */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Rechnungsdetails</CardTitle>
              <CardDescription>
                Geben Sie die Informationen für die Rechnung ein
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
                  <div className="flex gap-2">
                    <Popover open={kundeComboboxOpen} onOpenChange={setKundeComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={kundeComboboxOpen}
                          className="flex-1 justify-between"
                        >
                          {kunde
                            ? kunden.find((k) => k.id === kunde)?.name
                            : "Kunde auswählen"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Kunde suchen..." />
                          <CommandList>
                            <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                            <CommandGroup>
                              {(kunden || []).map((k) => (
                                <CommandItem
                                  key={k.id}
                                  value={k.name}
                                  onSelect={() => {
                                    setKunde(k.id);
                                    setKundeComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      kunde === k.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {k.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsKundenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bankkonto */}
                <div className="space-y-2">
                  <Label htmlFor="bankkonto">Bankkonto *</Label>
                  <div className="flex gap-2">
                    <Select value={bankkonto} onValueChange={setBankkonto}>
                      <SelectTrigger id="bankkonto" className="flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsBankkontenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
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
              
              <div className="flex gap-4">
                {/* Links: Input-Bereiche untereinander */}
                <div className="space-y-3">
                  {/* Single DEKRA Input */}
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="0993"
                      value={dekraInput}
                      onChange={(e) => setDekraInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddByDekra();
                        }
                      }}
                      maxLength={10}
                      className="font-mono text-2xl font-bold w-32 h-16 text-center"
                    />
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleAddByDekra}
                      disabled={!dekraInput.trim()}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>

                  {/* Bulk DEKRA Textarea */}
                  <div className="flex gap-2 items-start">
                    <Textarea
                      placeholder="0993&#10;0212&#10;1135&#10;2519"
                      value={bulkDekraInput}
                      onChange={(e) => setBulkDekraInput(e.target.value)}
                      className="font-mono text-2xl font-bold w-32 h-40 text-center resize-none"
                    />
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleBulkAddByDekra}
                      disabled={!bulkDekraInput.trim()}
                      className="h-40"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>

                {/* Rechts: Ausgewählte Fahrzeuge Liste */}
                {((isSingleVehicleKaufvertrag && selectedAutoId) || 
                  (!isSingleVehicleKaufvertrag && autoIds.length > 0)) && (
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">Ausgewählte Fahrzeuge</Label>
                      {!isSingleVehicleKaufvertrag && autoIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoIds([])}
                          className="h-7 text-xs"
                        >
                          Alle entfernen
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[220px] pr-3">
                      <div className="space-y-2">
                        {isSingleVehicleKaufvertrag ? (
                          selectedAuto && (
                            <div className="flex items-center space-x-3 p-3 rounded-lg border border-primary/50 bg-primary/5">
                              <Checkbox checked disabled />
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {selectedAuto.marke} {selectedAuto.modell}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Fahrgestell-Nr.: {selectedAuto.fahrgestell_nr || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    DEKRA-Nr.: {selectedAuto.dekra_bericht_nr || 'N/A'}
                                  </p>
                                 </div>
                                 <div className="text-right">
                                   {applyDiscount && discountPercentage && parseFloat(discountPercentage) > 0 ? (
                                     <>
                                       <p className="text-xs text-muted-foreground line-through">
                                         {formatPrice(selectedAuto.einzelpreis_netto)}
                                       </p>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(calculateDiscountedPrice(selectedAuto.einzelpreis_netto || 0))}
                                       </p>
                                       <p className="text-xs text-green-600 font-semibold">
                                         -{discountPercentage}% Rabatt
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(selectedAuto.einzelpreis_netto)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">Netto</p>
                                     </>
                                   )}
                                 </div>
                               </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveAuto(selectedAuto.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        ) : (
                          selectedAutos.map((auto) => (
                            <div
                              key={auto.id}
                              className="flex items-center space-x-3 p-3 rounded-lg border border-primary/50 bg-primary/5"
                            >
                              <Checkbox checked disabled />
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {auto.marke} {auto.modell}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Fahrgestell-Nr.: {auto.fahrgestell_nr || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    DEKRA-Nr.: {auto.dekra_bericht_nr || 'N/A'}
                                  </p>
                                 </div>
                                 <div className="text-right">
                                   {applyDiscount && discountPercentage && parseFloat(discountPercentage) > 0 ? (
                                     <>
                                       <p className="text-xs text-muted-foreground line-through">
                                         {formatPrice(auto.einzelpreis_netto)}
                                       </p>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(calculateDiscountedPrice(auto.einzelpreis_netto || 0))}
                                       </p>
                                       <p className="text-xs text-green-600 font-semibold">
                                         -{discountPercentage}% Rabatt
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(auto.einzelpreis_netto)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">Netto</p>
                                     </>
                                   )}
                                 </div>
                               </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveAuto(auto.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Manual Selection Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Oder manuell aus Liste auswählen ({autos.length} Fahrzeuge)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {/* Search Field */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Suchen nach Marke, Modell, Fahrgestell-Nr. oder DEKRA-Nr..."
                      value={autoSearchQuery}
                      onChange={(e) => setAutoSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    {autoSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAutoSearchQuery('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* List */}
                  <ScrollArea className="h-[300px] pr-4">
                {filteredAutos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Fahrzeuge gefunden.
                  </div>
                ) : (documentType === 'rechnung' || isMultipleVehicleKaufvertrag) ? (
                  <div className="space-y-3">
                    {filteredAutos.map((auto) => (
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
                      {filteredAutos.map((auto) => (
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
                )
                }
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
              <div className="flex justify-between items-center gap-4">
                {/* Links: NUR das Label "Bruttopreis:" */}
                <span className="text-lg font-semibold">Bruttopreis:</span>

                {/* Rechts: Rabatt-Controls + Grüner Preis zusammen */}
                <div className="flex items-center gap-3">
                  {/* Rabatt-Eingabe */}
                  <Input
                    type="number"
                    placeholder="0"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    className="w-20 h-10 text-center"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={!applyDiscount}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Checkbox
                    checked={applyDiscount}
                    onCheckedChange={(checked) => setApplyDiscount(checked as boolean)}
                    id="apply-discount"
                  />
                  <Label 
                    htmlFor="apply-discount" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Rabatt anwenden
                  </Label>

                  {/* Grüner Bruttopreis direkt daneben */}
                  <span className="font-bold text-2xl text-gradient-primary ml-4">
                    {formatPrice(
                      documentType === 'rechnung' 
                        ? bruttopreis 
                        : (isSingleVehicleKaufvertrag ? kaufvertragBruttopreis : kaufvertragMultipleBruttopreis)
                    )}
                  </span>
                </div>
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

        <TabsContent value="kaufvertrag" className="mt-6 space-y-6">
          {/* Contract Details */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Kaufvertragsdetails</CardTitle>
              <CardDescription>
                Geben Sie die Informationen für den Kaufvertrag ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kanzlei */}
                <div className="space-y-2">
                  <Label htmlFor="kanzlei-kv">Kanzlei *</Label>
                  <Select value={kanzlei} onValueChange={setKanzlei}>
                    <SelectTrigger id="kanzlei-kv">
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
                  <Label htmlFor="kunde-kv">Kunde *</Label>
                  <div className="flex gap-2">
                    <Popover open={kundeComboboxOpen} onOpenChange={setKundeComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={kundeComboboxOpen}
                          className="flex-1 justify-between"
                        >
                          {kunde
                            ? kunden.find((k) => k.id === kunde)?.name
                            : "Kunde auswählen"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Kunde suchen..." />
                          <CommandList>
                            <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                            <CommandGroup>
                              {(kunden || []).map((k) => (
                                <CommandItem
                                  key={k.id}
                                  value={k.name}
                                  onSelect={() => {
                                    setKunde(k.id);
                                    setKundeComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      kunde === k.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {k.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsKundenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bankkonto */}
                <div className="space-y-2">
                  <Label htmlFor="bankkonto-kv">Bankkonto *</Label>
                  <div className="flex gap-2">
                    <Select value={bankkonto} onValueChange={setBankkonto}>
                      <SelectTrigger id="bankkonto-kv" className="flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsBankkontenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Insolventes Unternehmen */}
                <div className="space-y-2">
                  <Label htmlFor="insolventes-unternehmen-kv">Insolventes Unternehmen *</Label>
                  <Select value={insolventesUnternehmen} onValueChange={setInsolventesUnternehmen}>
                    <SelectTrigger id="insolventes-unternehmen-kv">
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

                {/* Spedition */}
                <div className="space-y-2">
                  <Label htmlFor="spedition-kv">Spedition *</Label>
                  <Select value={spedition} onValueChange={setSpedition}>
                    <SelectTrigger id="spedition-kv">
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
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Selection - Copy from Rechnung tab */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">
                {isMultipleVehicleKaufvertrag
                  ? 'Fahrzeuge auswählen (mehrere möglich)'
                  : 'Fahrzeug auswählen (nur eines)'}
              </CardTitle>
              <CardDescription>
                Geben Sie die DEKRA-Nummer ein, um Fahrzeuge schnell hinzuzufügen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex gap-4">
                {/* Links: Input-Bereiche untereinander */}
                <div className="space-y-3">
                  {/* Single DEKRA Input */}
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="0993"
                      value={dekraInput}
                      onChange={(e) => setDekraInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddByDekra();
                        }
                      }}
                      maxLength={5}
                      className="font-mono text-2xl font-bold w-32 h-16 text-center"
                    />
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleAddByDekra}
                      disabled={!dekraInput.trim()}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>

                  {/* Bulk DEKRA Textarea */}
                  <div className="flex gap-2 items-start">
                    <Textarea
                      placeholder="0993&#10;0212&#10;1135&#10;2519"
                      value={bulkDekraInput}
                      onChange={(e) => setBulkDekraInput(e.target.value)}
                      className="font-mono text-2xl font-bold w-32 h-40 text-center resize-none"
                    />
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleBulkAddByDekra}
                      disabled={!bulkDekraInput.trim()}
                      className="h-40"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>

                {/* Rechts: Ausgewählte Fahrzeuge Liste */}
                {((isSingleVehicleKaufvertrag && selectedAutoId) || 
                  (isMultipleVehicleKaufvertrag && autoIds.length > 0)) && (
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">Ausgewählte Fahrzeuge</Label>
                      {isMultipleVehicleKaufvertrag && autoIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoIds([])}
                          className="h-7 text-xs"
                        >
                          Alle entfernen
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[220px] pr-3">
                      <div className="space-y-2">
                        {isSingleVehicleKaufvertrag ? (
                          selectedAuto && (
                            <div className="flex items-center space-x-3 p-3 rounded-lg border border-primary/50 bg-primary/5">
                              <Checkbox checked disabled />
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {selectedAuto.marke} {selectedAuto.modell}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Fahrgestell-Nr.: {selectedAuto.fahrgestell_nr || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    DEKRA-Nr.: {selectedAuto.dekra_bericht_nr || 'N/A'}
                                  </p>
                                 </div>
                                 <div className="text-right">
                                   {applyDiscount && discountPercentage && parseFloat(discountPercentage) > 0 ? (
                                     <>
                                       <p className="text-xs text-muted-foreground line-through">
                                         {formatPrice(selectedAuto.einzelpreis_netto)}
                                       </p>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(calculateDiscountedPrice(selectedAuto.einzelpreis_netto || 0))}
                                       </p>
                                       <p className="text-xs text-green-600 font-semibold">
                                         -{discountPercentage}% Rabatt
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(selectedAuto.einzelpreis_netto)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">Netto</p>
                                     </>
                                   )}
                                 </div>
                               </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveAuto(selectedAuto.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        ) : (
                          selectedAutos.map((auto) => (
                            <div
                              key={auto.id}
                              className="flex items-center space-x-3 p-3 rounded-lg border border-primary/50 bg-primary/5"
                            >
                              <Checkbox checked disabled />
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {auto.marke} {auto.modell}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Fahrgestell-Nr.: {auto.fahrgestell_nr || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    DEKRA-Nr.: {auto.dekra_bericht_nr || 'N/A'}
                                  </p>
                                 </div>
                                 <div className="text-right">
                                   {applyDiscount && discountPercentage && parseFloat(discountPercentage) > 0 ? (
                                     <>
                                       <p className="text-xs text-muted-foreground line-through">
                                         {formatPrice(auto.einzelpreis_netto)}
                                       </p>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(calculateDiscountedPrice(auto.einzelpreis_netto || 0))}
                                       </p>
                                       <p className="text-xs text-green-600 font-semibold">
                                         -{discountPercentage}% Rabatt
                                       </p>
                                     </>
                                   ) : (
                                     <>
                                       <p className="font-bold text-gradient-secondary">
                                         {formatPrice(auto.einzelpreis_netto)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">Netto</p>
                                     </>
                                   )}
                                 </div>
                               </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveAuto(auto.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Manual Selection Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Oder manuell aus Liste auswählen ({autos.length} Fahrzeuge)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {/* Search Field */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Suchen nach Marke, Modell, Fahrgestell-Nr. oder DEKRA-Nr..."
                      value={autoSearchQuery}
                      onChange={(e) => setAutoSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    {autoSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAutoSearchQuery('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* List */}
                  <ScrollArea className="h-[300px] pr-4">
                {filteredAutos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Fahrzeuge gefunden.
                  </div>
                ) : isMultipleVehicleKaufvertrag ? (
                  <div className="space-y-3">
                    {filteredAutos.map((auto) => (
                      <div
                        key={auto.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                      >
                        <Checkbox
                          id={`auto-kv-${auto.id}`}
                          checked={autoIds.includes(auto.id)}
                          onCheckedChange={() => handleToggleAuto(auto.id)}
                        />
                        <label
                          htmlFor={`auto-kv-${auto.id}`}
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
                      {filteredAutos.map((auto) => (
                        <div
                          key={auto.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          <RadioGroupItem value={auto.id} id={`auto-radio-kv-${auto.id}`} />
                          <label
                            htmlFor={`auto-radio-kv-${auto.id}`}
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
                )
                }
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

            </CardContent>
          </Card>

          {/* Summary */}
          {((isSingleVehicleKaufvertrag && selectedAutoId) ||
            (isMultipleVehicleKaufvertrag && autoIds.length > 0)) && (
            <Card className="glass border-secondary/20">
              <CardHeader>
                <CardTitle className="text-gradient-secondary">
                  Zusammenfassung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Discount Toggle */}
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
                  <Checkbox
                    id="apply-discount-kv"
                    checked={applyDiscount}
                    onCheckedChange={(checked) => setApplyDiscount(!!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="apply-discount-kv" className="cursor-pointer font-medium">
                      Rabatt anwenden
                    </Label>
                  </div>
                  {applyDiscount && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        className="w-20 text-right"
                        min="0"
                        max="100"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Nettopreis:</span>
                    <span className="font-bold">
                      {isSingleVehicleKaufvertrag
                        ? formatPrice(kaufvertragNettopreis)
                        : formatPrice(kaufvertragMultipleNettopreis)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>MwSt. (19%):</span>
                    <span className="font-bold">
                      {isSingleVehicleKaufvertrag
                        ? formatPrice(kaufvertragNettopreis * 0.19)
                        : formatPrice(kaufvertragMultipleNettopreis * 0.19)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-2xl font-bold text-gradient-secondary">
                    <span>Bruttopreis:</span>
                    <span>
                      {isSingleVehicleKaufvertrag
                        ? formatPrice(kaufvertragBruttopreis)
                        : formatPrice(kaufvertragMultipleBruttopreis)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kaufvertrag Template Selection */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Kaufvertrag-Art auswählen *</CardTitle>
              <CardDescription>
                Wählen Sie die Art des Kaufvertrags aus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={kaufvertragType}
                onValueChange={setKaufvertragType}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="kaufvertrag-1-p" id="kv-1-p" />
                  <Label htmlFor="kv-1-p" className="cursor-pointer flex-1">
                    1 Fahrzeug (Privat)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="kaufvertrag-1-u" id="kv-1-u" />
                  <Label htmlFor="kv-1-u" className="cursor-pointer flex-1">
                    1 Fahrzeug (Unternehmen)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="kaufvertrag-m-p" id="kv-m-p" />
                  <Label htmlFor="kv-m-p" className="cursor-pointer flex-1">
                    Mehrere Fahrzeuge (Privat)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="kaufvertrag-m-u" id="kv-m-u" />
                  <Label htmlFor="kv-m-u" className="cursor-pointer flex-1">
                    Mehrere Fahrzeuge (Unternehmen)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Treuhandvertrag Gender Selection - nur wenn Toggle aktiv */}
          {includeTreuhandvertrag && (
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="text-gradient-primary">Geschlecht für Treuhandvertrag *</CardTitle>
                <CardDescription>
                  Wählen Sie das Geschlecht für das Treuhandvertrag-Template aus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={treuhandvertragGender}
                  onValueChange={(value: 'M' | 'W') => setTreuhandvertragGender(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="M" id="gender-m-kv" />
                    <Label htmlFor="gender-m-kv" className="cursor-pointer">
                      Männlich
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="W" id="gender-w-kv" />
                    <Label htmlFor="gender-w-kv" className="cursor-pointer">
                      Weiblich
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Generate Buttons */}
          <Card className="glass border-accent/20">
            <CardHeader>
              <CardTitle className="text-gradient-accent">Kaufvertrag generieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {isSingleVehicleKaufvertrag && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => generateKaufvertragJSONMutation.mutate({
                      kanzlei_id: kanzlei,
                      kunde_id: kunde,
                      bankkonto_id: bankkonto,
                      insolvente_unternehmen_id: insolventesUnternehmen,
                      spedition_id: spedition,
                      auto_id: selectedAutoId,
                      templateName: getTemplateName(),
                      discounted_autos: selectedAuto ? [{
                        ...selectedAuto,
                        einzelpreis_netto: calculateDiscountedPrice(selectedAuto.einzelpreis_netto || 0)
                      }] : [],
                    })}
                    disabled={!isValid || isGenerating || generateKaufvertragJSONMutation.isPending}
                  >
                    {generateKaufvertragJSONMutation.isPending ? (
                      <>
                        <Download className="w-4 h-4 mr-2 animate-bounce" />
                        Lade Debug-Daten...
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
                  {generateKaufvertragDOCXMutation.isPending ? (
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
                  {generateKaufvertragPDFMutation.isPending ? (
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

          {/* Debug Card */}
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

        <TabsContent value="treuhandvertrag" className="mt-6 space-y-6">
          {/* Treuhandvertrag Details */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Treuhandvertragsdetails</CardTitle>
              <CardDescription>
                Geben Sie die Informationen für den Treuhandvertrag ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kanzlei */}
                <div className="space-y-2">
                  <Label htmlFor="kanzlei-tv">Kanzlei *</Label>
                  <Select value={kanzlei} onValueChange={setKanzlei}>
                    <SelectTrigger id="kanzlei-tv">
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
                  <Label htmlFor="kunde-tv">Kunde *</Label>
                  <div className="flex gap-2">
                    <Popover open={kundeComboboxOpen} onOpenChange={setKundeComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={kundeComboboxOpen}
                          className="flex-1 justify-between"
                        >
                          {kunde
                            ? kunden.find((k) => k.id === kunde)?.name
                            : "Kunde auswählen"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Kunde suchen..." />
                          <CommandList>
                            <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                            <CommandGroup>
                              {(kunden || []).map((k) => (
                                <CommandItem
                                  key={k.id}
                                  value={k.name}
                                  onSelect={() => {
                                    setKunde(k.id);
                                    setKundeComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      kunde === k.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {k.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsKundenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bankkonto */}
                <div className="space-y-2">
                  <Label htmlFor="bankkonto-tv">Bankkonto *</Label>
                  <div className="flex gap-2">
                    <Select value={bankkonto} onValueChange={setBankkonto}>
                      <SelectTrigger id="bankkonto-tv" className="flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsBankkontenFormOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Insolventes Unternehmen */}
                <div className="space-y-2">
                  <Label htmlFor="insolventes-unternehmen-tv">Insolventes Unternehmen *</Label>
                  <Select value={insolventesUnternehmen} onValueChange={setInsolventesUnternehmen}>
                    <SelectTrigger id="insolventes-unternehmen-tv">
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
              </div>

              {/* Gender Selection */}
              <div className="space-y-2 pt-4">
                <Label>Geschlecht für Template *</Label>
                <RadioGroup
                  value={treuhandvertragGender}
                  onValueChange={(value: 'M' | 'W') => setTreuhandvertragGender(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="M" id="gender-m" />
                    <Label htmlFor="gender-m" className="cursor-pointer">
                      Männlich
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="W" id="gender-w" />
                    <Label htmlFor="gender-w" className="cursor-pointer">
                      Weiblich
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

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
                  {generateTreuhandvertragDOCXMutation.isPending ? (
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
                  {generateTreuhandvertragPDFMutation.isPending ? (
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
        </TabsContent>
      </Tabs>

      {/* Kunden Form Dialog */}
      <KundenForm
        open={isKundenFormOpen}
        onOpenChange={setIsKundenFormOpen}
        onSuccess={(newKunde) => {
          setKunde(newKunde.id);
          setIsKundenFormOpen(false);
        }}
      />

      {/* Bankkonten Form Dialog */}
      <BankkontenForm
        open={isBankkontenFormOpen}
        onOpenChange={setIsBankkontenFormOpen}
        onSuccess={(newBankkonto) => {
          setBankkonto(newBankkonto.id);
          setIsBankkontenFormOpen(false);
        }}
      />
    </div>
  );
};

export default DokumenteErstellen;
