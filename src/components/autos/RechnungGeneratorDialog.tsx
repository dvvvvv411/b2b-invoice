import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useKunden } from '@/hooks/useKunden';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useAutos } from '@/hooks/useAutos';
import { useGenerateRechnungPDF } from '@/hooks/useGenerateRechnungPDF';
import { formatPrice } from '@/lib/formatters';

interface RechnungGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RechnungGeneratorDialog = ({ open, onOpenChange }: RechnungGeneratorDialogProps) => {
  const [selectedKanzlei, setSelectedKanzlei] = useState<string>('');
  const [selectedKunde, setSelectedKunde] = useState<string>('');
  const [selectedBankkonto, setSelectedBankkonto] = useState<string>('');
  const [selectedInsolventesUnternehmen, setSelectedInsolventesUnternehmen] = useState<string>('');
  const [selectedAutoIds, setSelectedAutoIds] = useState<string[]>([]);

  const { data: kanzleien = [], isLoading: loadingKanzleien } = useKanzleien();
  const { data: kunden = [], isLoading: loadingKunden } = useKunden();
  const { data: bankkonten = [], isLoading: loadingBankkonten } = useBankkonten();
  const { data: insolventeUnternehmen = [], isLoading: loadingInsolvent } = useInsolventeUnternehmen();
  const { data: autos = [], isLoading: loadingAutos } = useAutos();
  const generatePDF = useGenerateRechnungPDF();

  // Calculate sums
  const selectedAutos = autos.filter(a => selectedAutoIds.includes(a.id));
  const nettopreis = selectedAutos.reduce((sum, auto) => sum + (auto.einzelpreis_netto || 0), 0);
  const bruttopreis = nettopreis * 1.19;
  const mwst = bruttopreis - nettopreis;

  // Validation
  const isValid = 
    selectedKanzlei && 
    selectedKunde && 
    selectedBankkonto && 
    selectedInsolventesUnternehmen && 
    selectedAutoIds.length > 0;

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedKanzlei('');
      setSelectedKunde('');
      setSelectedBankkonto('');
      setSelectedInsolventesUnternehmen('');
      setSelectedAutoIds([]);
    }
  }, [open]);

  const handleToggleAuto = (autoId: string) => {
    setSelectedAutoIds(prev => 
      prev.includes(autoId) 
        ? prev.filter(id => id !== autoId)
        : [...prev, autoId]
    );
  };

  const handleToggleAll = () => {
    if (selectedAutoIds.length === autos.length) {
      setSelectedAutoIds([]);
    } else {
      setSelectedAutoIds(autos.map(a => a.id));
    }
  };

  const handleGenerate = () => {
    if (!isValid) return;

    generatePDF.mutate({
      kanzlei_id: selectedKanzlei,
      kunde_id: selectedKunde,
      bankkonto_id: selectedBankkonto,
      insolvente_unternehmen_id: selectedInsolventesUnternehmen,
      auto_ids: selectedAutoIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Rechnung erstellen</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rechnungsdetails */}
          <Card className="glass p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">📋 Rechnungsdetails</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kanzlei <span className="text-destructive">*</span>
                </label>
                <Select value={selectedKanzlei} onValueChange={setSelectedKanzlei}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kanzlei auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingKanzleien ? (
                      <SelectItem value="loading" disabled>Lädt...</SelectItem>
                    ) : kanzleien.length === 0 ? (
                      <SelectItem value="none" disabled>Keine Kanzleien vorhanden</SelectItem>
                    ) : (
                      kanzleien.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kunde <span className="text-destructive">*</span>
                </label>
                <Select value={selectedKunde} onValueChange={setSelectedKunde}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kunde auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingKunden ? (
                      <SelectItem value="loading" disabled>Lädt...</SelectItem>
                    ) : kunden.length === 0 ? (
                      <SelectItem value="none" disabled>Keine Kunden vorhanden</SelectItem>
                    ) : (
                      kunden.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Bankkonto <span className="text-destructive">*</span>
                </label>
                <Select value={selectedBankkonto} onValueChange={setSelectedBankkonto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bankkonto auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingBankkonten ? (
                      <SelectItem value="loading" disabled>Lädt...</SelectItem>
                    ) : bankkonten.length === 0 ? (
                      <SelectItem value="none" disabled>Keine Bankkonten vorhanden</SelectItem>
                    ) : (
                      bankkonten.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.kontoname || b.kontoinhaber || b.iban}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Insolventes Unternehmen <span className="text-destructive">*</span>
                </label>
                <Select value={selectedInsolventesUnternehmen} onValueChange={setSelectedInsolventesUnternehmen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Insolventes Unternehmen auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingInsolvent ? (
                      <SelectItem value="loading" disabled>Lädt...</SelectItem>
                    ) : insolventeUnternehmen.length === 0 ? (
                      <SelectItem value="none" disabled>Keine insolventen Unternehmen vorhanden</SelectItem>
                    ) : (
                      insolventeUnternehmen.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Fahrzeuge auswählen */}
          <Card className="glass p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">🚗 Fahrzeuge auswählen</h3>
              {autos.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggleAll}
                  type="button"
                >
                  {selectedAutoIds.length === autos.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              )}
            </div>

            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {loadingAutos ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : autos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Keine Autos vorhanden
                </div>
              ) : (
                <div className="space-y-3">
                  {autos.map((auto) => (
                    <div key={auto.id} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50">
                      <Checkbox
                        id={`auto-${auto.id}`}
                        checked={selectedAutoIds.includes(auto.id)}
                        onCheckedChange={() => handleToggleAuto(auto.id)}
                      />
                      <label
                        htmlFor={`auto-${auto.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">
                          {auto.marke} {auto.modell} - {formatPrice(auto.einzelpreis_netto)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fahrgestell-Nr: {auto.fahrgestell_nr || 'N/A'}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Rechnungssumme */}
          {selectedAutoIds.length > 0 && (
            <Card className="glass p-4 space-y-2 border-primary/20">
              <h3 className="font-semibold text-sm text-muted-foreground">💶 Rechnungssumme</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Nettopreis:</span>
                  <span className="font-medium">{formatPrice(nettopreis)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MwSt (19%):</span>
                  <span className="font-medium">{formatPrice(mwst)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Bruttopreis:</span>
                  <span className="text-gradient-primary">{formatPrice(bruttopreis)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={generatePDF.isPending}
          >
            Abbrechen
          </Button>
          <Button 
            variant="gaming" 
            onClick={handleGenerate}
            disabled={!isValid || generatePDF.isPending}
          >
            {generatePDF.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generiere PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                PDF generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
