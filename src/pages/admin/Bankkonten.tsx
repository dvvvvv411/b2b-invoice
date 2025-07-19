import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Bankkonten = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Bankkonten</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Bankverbindungen</p>
        </div>
        <Button variant="gaming">
          <Plus className="w-4 h-4 mr-2" />
          Neues Bankkonto
        </Button>
      </div>

      <Card className="glass p-6 border-primary/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Bankkonten suchen..." 
              className="pl-10 bg-background/50 border-border/30"
            />
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Noch keine Bankkonten hinzugefügt</p>
          <Button variant="gaming" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Erstes Bankkonto hinzufügen
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Bankkonten;