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
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Kunden</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <Button variant="gaming">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      <Card className="glass p-6 border-primary/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Kunden suchen..." 
              className="pl-10 bg-background/50 border-border/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Adresse</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Geschäftsführer</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Aktenzeichen</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Kundennummer</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {kunden.map((kunde) => (
                <tr key={kunde.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{kunde.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {kunde.adresse}, {kunde.plz} {kunde.stadt}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{kunde.geschaeftsfuehrer}</td>
                  <td className="py-3 px-4 text-muted-foreground">{kunde.aktenzeichen}</td>
                  <td className="py-3 px-4 text-muted-foreground">{kunde.kundennummer}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="hover:neon-glow-green">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:neon-glow-purple">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:neon-glow-purple">
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