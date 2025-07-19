import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Car, 
  Building2, 
  CreditCard, 
  Truck, 
  Factory,
  FileText,
  Plus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useDashboardStats();

  const statisticCards = [
    {
      title: 'Kunden',
      value: stats?.kunden || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'from-primary/20 to-primary/10',
      route: '/admin/kunden'
    },
    {
      title: 'Autos',
      value: stats?.autos || 0,
      icon: Car,
      color: 'text-secondary',
      bgColor: 'from-secondary/20 to-secondary/10',
      route: '/admin/autos'
    },
    {
      title: 'Kanzleien',
      value: stats?.kanzleien || 0,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'from-primary/20 to-primary/10',
      route: '/admin/kanzleien'
    },
    {
      title: 'Bankkonten',
      value: stats?.bankkonten || 0,
      icon: CreditCard,
      color: 'text-neon-green',
      bgColor: 'from-neon-green/20 to-neon-green/10',
      route: '/admin/bankkonten'
    },
    {
      title: 'Speditionen',
      value: stats?.speditionen || 0,
      icon: Truck,
      color: 'text-secondary',
      bgColor: 'from-secondary/20 to-secondary/10',
      route: '/admin/speditionen'
    },
    {
      title: 'Insolvente Unternehmen',
      value: stats?.insolventeUnternehmen || 0,
      icon: Factory,
      color: 'text-primary',
      bgColor: 'from-primary/20 to-primary/10',
      route: '/admin/insolvente-unternehmen'
    }
  ];

  const quickActions = [
    {
      title: 'PDF erstellen',
      description: 'Neues PDF-Dokument generieren',
      icon: FileText,
      variant: 'gaming' as const,
      size: 'large',
      route: '/admin/pdf-generator'
    },
    {
      title: 'Neuer Kunde',
      description: 'Kundendaten hinzufügen',
      icon: Users,
      variant: 'hero' as const,
      route: '/admin/kunden'
    },
    {
      title: 'Neues Auto',
      description: 'Fahrzeugdaten erfassen',
      icon: Car,
      variant: 'hero' as const,
      route: '/admin/autos'
    },
    {
      title: 'Neue Kanzlei',
      description: 'Kanzlei-Daten anlegen',
      icon: Building2,
      variant: 'hero' as const,
      route: '/admin/kanzleien'
    }
  ];

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Fehler beim Laden</h2>
          <p className="text-muted-foreground">
            Die Dashboard-Daten konnten nicht geladen werden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient-primary font-orbitron">
          Willkommen im PDF Generator Panel
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Verwalten Sie Ihre Daten und erstellen Sie professionelle PDF-Dokumente 
          für Ihre Geschäftsprozesse.
        </p>
      </div>

      {/* Statistics Grid */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-gradient-secondary">Statistiken</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statisticCards.map((stat, index) => (
            <Card 
              key={index} 
              className="glass p-6 hover:neon-glow-purple transition-all duration-300 cursor-pointer border-primary/20"
              onClick={() => navigate(stat.route)}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gradient-primary">
                      {stat.value}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-secondary" />
          <h2 className="text-2xl font-semibold text-gradient-primary">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const isLarge = action.size === 'large';
            return (
              <Card 
                key={index} 
                className={`glass p-6 hover:neon-glow-green transition-all duration-300 cursor-pointer border-secondary/20 ${
                  isLarge ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
                onClick={() => navigate(action.route)}
              >
                <div className="text-center space-y-4">
                  <div className={`mx-auto p-4 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20 ${
                    isLarge ? 'w-16 h-16' : 'w-12 h-12'
                  } flex items-center justify-center`}>
                    <action.icon className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} text-secondary`} />
                  </div>
                  
                  <div>
                    <h3 className={`${isLarge ? 'text-xl' : 'text-lg'} font-semibold text-foreground mb-2`}>
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {action.description}
                    </p>
                    
                    <Button 
                      variant={action.variant} 
                      size={isLarge ? 'lg' : 'sm'}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isLarge ? 'Jetzt erstellen' : 'Hinzufügen'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Additional Info */}
      <Card className="glass p-6 border-primary/20">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gradient-secondary">
            Bereit für Ihre nächste PDF-Generierung?
          </h3>
          <p className="text-muted-foreground">
            Wählen Sie eine der Quick Actions oben oder navigieren Sie über das Menü zu den gewünschten Bereichen.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;