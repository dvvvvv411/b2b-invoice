import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Shield, Zap, Building2 } from 'lucide-react';

const GamingLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: 'Dokumente generieren',
      description: 'Rechnungen, Kaufverträge und Treuhandverträge automatisch erstellen.',
    },
    {
      icon: Shield,
      title: 'Sicher & DSGVO-konform',
      description: 'Ihre Daten werden sicher und gemäß deutscher Standards verarbeitet.',
    },
    {
      icon: Zap,
      title: 'Schnell & effizient',
      description: 'Sparen Sie Zeit durch automatisierte Workflows und Templates.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">PDF Generator</span>
          </div>
          <Button variant="default" onClick={() => navigate('/auth')}>
            Anmelden
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-1.5 mb-6">
          <span className="text-xs font-medium">Professional B2B Panel</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold text-foreground mb-6 max-w-3xl mx-auto leading-tight">
          Dokumente erstellen.
          <br />
          <span className="text-primary">Effizient & professionell.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Verwalten Sie Kunden, Bestellungen und Vertragsdokumente in einer modernen,
          übersichtlichen Plattform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Zum Admin-Panel
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 shadow-soft hover:shadow-elevated transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GamingLanding;
