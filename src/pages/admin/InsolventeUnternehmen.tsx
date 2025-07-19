import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const InsolventeUnternehmen = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insolvente Unternehmen</h1>
          <p className="text-gray-600">Verwalten Sie insolvente Unternehmen</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neues Unternehmen
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Unternehmen suchen..." 
              className="pl-10"
            />
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Noch keine insolventen Unternehmen hinzugefügt</p>
          <Button className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Erstes Unternehmen hinzufügen
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InsolventeUnternehmen;