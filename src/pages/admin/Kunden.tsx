import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Kunden = () => {
  const kunden = [
    {
      id: 1,
      name: 'Müller GmbH',
      adresse: 'Hauptstraße 123',
      plz: '10115',
      stadt: 'Berlin',
      geschaeftsfuehrer: 'Hans Müller',
      aktenzeichen: 'AZ/0305/001',
      kundennummer: 'MUE/0745/IN'
    },
    {
      id: 2,
      name: 'Schmidt & Partner',
      adresse: 'Wilhelmstraße 45',
      plz: '20354',
      stadt: 'Hamburg',
      geschaeftsfuehrer: 'Maria Schmidt',
      aktenzeichen: 'AZ/0305/002',
      kundennummer: 'SCH/0745/IN'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Kunden suchen..." 
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Adresse</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Geschäftsführer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Aktenzeichen</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Kundennummer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {kunden.map((kunde) => (
                <tr key={kunde.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{kunde.name}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {kunde.adresse}, {kunde.plz} {kunde.stadt}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{kunde.geschaeftsfuehrer}</td>
                  <td className="py-3 px-4 text-gray-600">{kunde.aktenzeichen}</td>
                  <td className="py-3 px-4 text-gray-600">{kunde.kundennummer}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Kunden;