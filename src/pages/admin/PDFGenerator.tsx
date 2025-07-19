import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Plus } from 'lucide-react';

const PDFGenerator = () => {
  const templates = [
    {
      id: 1,
      name: 'Fahrzeug-Bewertung',
      description: 'Standard-Vorlage für Fahrzeugbewertungen',
      icon: FileText
    },
    {
      id: 2,
      name: 'Insolvenz-Bericht',
      description: 'Vorlage für Insolvenzverfahren',
      icon: FileText
    },
    {
      id: 3,
      name: 'Kanzlei-Bericht',
      description: 'Allgemeine Kanzlei-Dokumentation',
      icon: FileText
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">PDF Generator</h1>
          <p className="text-muted-foreground">Erstellen Sie professionelle PDF-Dokumente</p>
        </div>
        <Button variant="gaming">
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="glass p-6 hover:neon-glow-purple transition-all duration-300 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <template.icon className="w-6 h-6 text-primary" />
              </div>
              <Button variant="hero" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Verwenden
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {template.name}
            </h3>
            <p className="text-muted-foreground text-sm">
              {template.description}
            </p>
          </Card>
        ))}
      </div>

      <Card className="glass p-6 border-primary/20">
        <h2 className="text-xl font-semibold text-gradient-secondary mb-4">Zuletzt generierte PDFs</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="font-medium text-foreground">BMW_X5_Bewertung.pdf</p>
                <p className="text-sm text-muted-foreground">vor 2 Stunden erstellt</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:neon-glow-green">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="font-medium text-foreground">Insolvenz_Bericht_Müller.pdf</p>
                <p className="text-sm text-muted-foreground">vor 5 Stunden erstellt</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:neon-glow-green">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PDFGenerator;