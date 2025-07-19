
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface FooterConfig {
  enabled: boolean;
  showPageNumbers: boolean;
  showDate: boolean;
  customText: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  padding: number;
  borderTop: boolean;
}

interface FooterConfigurationProps {
  config: FooterConfig;
  onConfigChange: (config: FooterConfig) => void;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  enabled: true,
  showPageNumbers: true,
  showDate: true,
  customText: '',
  backgroundColor: '#f5f5f5',
  textColor: '#333333',
  fontSize: 10,
  padding: 10,
  borderTop: true,
};

export function FooterConfiguration({ config, onConfigChange }: FooterConfigurationProps) {
  const updateConfig = (updates: Partial<FooterConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Footer-Konfiguration</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="footer-enabled">Aktiviert</Label>
            <Switch
              id="footer-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
        </div>

        {config.enabled && (
          <>
            <Separator />
            
            {/* Content Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-page-numbers"
                  checked={config.showPageNumbers}
                  onCheckedChange={(showPageNumbers) => updateConfig({ showPageNumbers })}
                />
                <Label htmlFor="show-page-numbers">Seitenzahlen anzeigen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-date"
                  checked={config.showDate}
                  onCheckedChange={(showDate) => updateConfig({ showDate })}
                />
                <Label htmlFor="show-date">Datum anzeigen</Label>
              </div>
            </div>

            {/* Custom Text */}
            <div className="space-y-2">
              <Label htmlFor="custom-text">Benutzerdefinierter Text</Label>
              <Textarea
                id="custom-text"
                placeholder="Zusätzlicher Text für den Footer..."
                value={config.customText}
                onChange={(e) => updateConfig({ customText: e.target.value })}
                rows={2}
              />
            </div>

            <Separator />

            {/* Styling Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg-color">Hintergrundfarbe</Label>
                <Input
                  id="bg-color"
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="text-color">Textfarbe</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-size">Schriftgröße (px)</Label>
                <Input
                  id="font-size"
                  type="number"
                  min="8"
                  max="16"
                  value={config.fontSize}
                  onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) || 10 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="padding">Innenabstand (px)</Label>
                <Input
                  id="padding"
                  type="number"
                  min="5"
                  max="20"
                  value={config.padding}
                  onChange={(e) => updateConfig({ padding: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="border-top"
                checked={config.borderTop}
                onCheckedChange={(borderTop) => updateConfig({ borderTop })}
              />
              <Label htmlFor="border-top">Obere Umrandung</Label>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
