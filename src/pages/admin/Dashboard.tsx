import { Card } from '@/components/ui/card';
import { BarChart3, Users, Car, Building2 } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Kunden',
      value: '24',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Autos',
      value: '156',
      icon: Car,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Kanzleien',
      value: '8',
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'PDFs generiert',
      value: '342',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary font-orbitron">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über Ihr PDF Generator Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass p-6 hover:neon-glow-purple transition-all duration-300">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20`}>
                <stat.icon className={`w-6 h-6 text-primary`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-gradient-primary">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass p-6 border-primary/20">
        <h2 className="text-xl font-semibold text-gradient-secondary mb-4">Letzte Aktivitäten</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div>
              <p className="font-medium text-foreground">Neuer Kunde hinzugefügt</p>
              <p className="text-sm text-muted-foreground">vor 2 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full border border-primary/30">
              Neu
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div>
              <p className="font-medium text-foreground">PDF für Auto BMW X5 generiert</p>
              <p className="text-sm text-muted-foreground">vor 4 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-secondary/20 text-secondary rounded-full border border-secondary/30">
              PDF
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Kanzlei-Daten aktualisiert</p>
              <p className="text-sm text-muted-foreground">vor 6 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-neon-green/20 text-neon-green rounded-full border border-neon-green/30">
              Update
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;