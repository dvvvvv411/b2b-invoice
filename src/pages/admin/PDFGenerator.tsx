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
          <h1 className="text-3xl font-bold text-gray-900">PDF Generator</h1>
          <p className="text-gray-600">Erstellen Sie professionelle PDF-Dokumente</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <template.icon className="w-6 h-6 text-blue-600" />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Verwenden
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {template.name}
            </h3>
            <p className="text-gray-600 text-sm">
              {template.description}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Zuletzt generierte PDFs</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">BMW_X5_Bewertung.pdf</p>
                <p className="text-sm text-gray-500">vor 2 Stunden erstellt</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Insolvenz_Bericht_Müller.pdf</p>
                <p className="text-sm text-gray-500">vor 5 Stunden erstellt</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PDFGenerator;