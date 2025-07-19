
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useKanzleien } from '@/hooks/useKanzleien';
import { useInsolventeUnternehmen } from '@/hooks/useInsolventeUnternehmen';
import { useKunden } from '@/hooks/useKunden';
import { useAutos } from '@/hooks/useAutos';
import { useBankkonten } from '@/hooks/useBankkonten';
import { useSpeditionen } from '@/hooks/useSpeditionen';

export interface SelectedData {
  kanzlei: string;
  insolventesUnternehmen: string;
  kunde: string;
  auto: string;
  bankkonto: string;
  spedition: string;
  useRealData: boolean;
}

interface DataSelectionCardProps {
  selectedData: SelectedData;
  onDataChange: (data: SelectedData) => void;
}

export default function DataSelectionCard({ selectedData, onDataChange }: DataSelectionCardProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('dataSelectionCardOpen');
    return saved ? JSON.parse(saved) : true;
  });

  const { data: kanzleien = [] } = useKanzleien();
  const { data: insolventeUnternehmen = [] } = useInsolventeUnternehmen();
  const { data: kunden = [] } = useKunden();
  const { data: autos = [] } = useAutos();
  const { data: bankkonten = [] } = useBankkonten();
  const { data: speditionen = [] } = useSpeditionen();

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('dataSelectionCardOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  // Save selected data to localStorage
  useEffect(() => {
    localStorage.setItem('pdfTemplateSelectedData', JSON.stringify(selectedData));
  }, [selectedData]);

  const handleDataChange = (field: keyof SelectedData, value: string | boolean) => {
    const newData = { ...selectedData, [field]: value };
    onDataChange(newData);
  };

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                📊 Daten für Live Preview auswählen
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Live Preview mit echten Daten</span>
                  <Switch
                    checked={selectedData.useRealData}
                    onCheckedChange={(checked) => handleDataChange('useRealData', checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Kanzlei Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">🏢 Kanzlei auswählen</label>
              <Select
                value={selectedData.kanzlei}
                onValueChange={(value) => handleDataChange('kanzlei', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Kanzlei wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {kanzleien.map((kanzlei) => (
                    <SelectItem key={kanzlei.id} value={kanzlei.id}>
                      {kanzlei.name} - {kanzlei.stadt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Insolventes Unternehmen Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">🏭 Insolventes Unternehmen</label>
              <Select
                value={selectedData.insolventesUnternehmen}
                onValueChange={(value) => handleDataChange('insolventesUnternehmen', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Unternehmen wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {insolventeUnternehmen.map((unternehmen) => (
                    <SelectItem key={unternehmen.id} value={unternehmen.id}>
                      {unternehmen.name} - {unternehmen.aktenzeichen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kunde Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">👥 Kunde auswählen</label>
              <Select
                value={selectedData.kunde}
                onValueChange={(value) => handleDataChange('kunde', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Kunde wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {kunden.map((kunde) => (
                    <SelectItem key={kunde.id} value={kunde.id}>
                      {kunde.name} - {kunde.kundennummer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">🚗 Auto auswählen</label>
              <Select
                value={selectedData.auto}
                onValueChange={(value) => handleDataChange('auto', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Auto wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {autos.map((auto) => (
                    <SelectItem key={auto.id} value={auto.id}>
                      {auto.marke} {auto.modell} - {auto.fahrgestell_nr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bankkonto Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">💳 Bankkonto auswählen</label>
              <Select
                value={selectedData.bankkonto}
                onValueChange={(value) => handleDataChange('bankkonto', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Bankkonto wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {bankkonten.map((bankkonto) => (
                    <SelectItem key={bankkonto.id} value={bankkonto.id}>
                      {bankkonto.kontoname} - {bankkonto.iban}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spedition Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">🚚 Spedition auswählen</label>
              <Select
                value={selectedData.spedition}
                onValueChange={(value) => handleDataChange('spedition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Spedition wählen --" />
                </SelectTrigger>
                <SelectContent>
                  {speditionen.map((spedition) => (
                    <SelectItem key={spedition.id} value={spedition.id}>
                      {spedition.name} - {spedition.stadt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
