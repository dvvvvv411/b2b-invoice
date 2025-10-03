import { useState, useEffect } from 'react';
import { FileText, FileType, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useKunden } from '@/hooks/useKunden';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useAutos } from '@/hooks/useAutos';
import { useGenerateRechnungPDF } from '@/hooks/useGenerateRechnungPDF';
import { useGenerateRechnungDOCX } from '@/hooks/useGenerateRechnungDOCX';
import { formatPrice } from '@/lib/formatters';

const DokumenteErstellen = () => {
  const [kanzlei, setKanzlei] = useState<string>('');
  const [kunde, setKunde] = useState<string>('');
  const [bankkonto, setBankkonto] = useState<string>('');
  const [insolventesUnternehmen, setInsolventesUnternehmen] = useState<string>('');
  const [autoIds, setAutoIds] = useState<string[]>([]);

  const { data: kanzleien = [] } = useKanzleien();
  const { data: kunden = [] } = useKunden();
  const { data: bankkonten = [] } = useBankkonten();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  const { data: autos = [] } = useAutos();

  const generatePDFMutation = useGenerateRechnungPDF();
  const generateDOCXMutation = useGenerateRechnungDOCX();

  // Calculate totals
  const selectedAutos = autos.filter(auto => autoIds.includes(auto.id));
  const nettopreis = selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const mwst = nettopreis * 0.19;
  const bruttopreis = nettopreis + mwst;

  const isValid = kanzlei && kunde && bankkonto && insolventesUnternehmen && autoIds.length > 0;

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
    
    generatePDFMutation.mutate({
      kanzlei_id: kanzlei,
      kunde_id: kunde,
      bankkonto_id: bankkonto,
      insolvente_unternehmen_id: insolventesUnternehmen,
      auto_ids: autoIds,
    });
  };

  const handleGenerateDOCX = () => {
    if (!isValid) return;
    
    generateDOCXMutation.mutate({
      kanzlei_id: kanzlei,
      kunde_id: kunde,
      bankkonto_id: bankkonto,
      insolvente_unternehmen_id: insolventesUnternehmen,
      auto_ids: autoIds,
    });
  };

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
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-gradient-primary">Dokumenttyp</CardTitle>
          <CardDescription>Wählen Sie den Typ des zu erstellenden Dokuments</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="gaming" className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            Rechnung erstellen
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-gradient-primary">Rechnungsdetails</CardTitle>
          <CardDescription>Geben Sie die Informationen für die Rechnung ein</CardDescription>
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
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Selection */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gradient-primary">Fahrzeuge auswählen</CardTitle>
              <CardDescription>
                {autoIds.length} von {autos.length} Fahrzeugen ausgewählt
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
            >
              {autoIds.length === autos.length ? 'Keine auswählen' : 'Alle auswählen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      {autoIds.length > 0 && (
        <Card className="glass border-secondary/20">
          <CardHeader>
            <CardTitle className="text-gradient-secondary">Rechnungssumme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nettopreis:</span>
              <span className="font-bold text-lg">{formatPrice(nettopreis)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MwSt (19%):</span>
              <span className="font-bold text-lg">{formatPrice(mwst)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Bruttopreis:</span>
              <span className="font-bold text-2xl text-gradient-primary">
                {formatPrice(bruttopreis)}
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
              disabled={!isValid || generateDOCXMutation.isPending || generatePDFMutation.isPending}
            >
              {generateDOCXMutation.isPending ? (
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
              disabled={!isValid || generatePDFMutation.isPending || generateDOCXMutation.isPending}
            >
              {generatePDFMutation.isPending ? (
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
    </div>
  );
};

export default DokumenteErstellen;
