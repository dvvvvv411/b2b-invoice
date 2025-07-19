import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Shield, 
  Gamepad2, 
  TrendingUp, 
  Users, 
  BarChart3,
  Sparkles,
  Target,
  Crown
} from "lucide-react";
import { useEffect, useState } from "react";

const GamingLanding = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Generate floating particles
    const generateParticles = () => {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Real-time business insights with AI-powered predictions",
      level: "Pro"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security", 
      description: "Bank-level encryption and compliance standards",
      level: "Max"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Management",
      description: "Seamless collaboration tools for distributed teams",
      level: "Elite"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Growth Engine",
      description: "Automated workflows that scale with your business",
      level: "Ultra"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-primary rounded-full particle opacity-60"
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-8">
            <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Level Up Your Business</span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight font-orbitron">
              <span className="text-gradient-primary">B2B</span>{" "}
              <span className="text-gradient-secondary">Panel</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Das ultimative Gaming-Dashboard für Unternehmen. Verwandeln Sie Ihre Business-Prozesse 
              in ein episches Erlebnis mit Echtzeit-Analytics, gamifizierten Workflows und KI-Power.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="gaming" size="lg" className="text-lg px-8 py-6">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Start Quest
              </Button>
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                <Zap className="w-5 h-5 mr-2" />
                Demo ansehen
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass p-6 hover:neon-glow-purple transition-all duration-300 transform hover:scale-105 border-border/20"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                    {feature.icon}
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                    {feature.level}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Main Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl"></div>
            <Card className="glass relative border-primary/20 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gradient-primary mb-2">
                      Command Center
                    </h2>
                    <p className="text-muted-foreground">
                      Ihr personalisiertes Business-Dashboard
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive pulse-glow"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 pulse-glow"></div>
                    <div className="w-3 h-3 rounded-full bg-primary pulse-glow"></div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass p-6 rounded-xl border-primary/10">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-primary">+127%</div>
                  </div>
                  
                  <div className="glass p-6 rounded-xl border-secondary/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-secondary" />
                      <span className="text-sm text-muted-foreground">Active Users</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-secondary">2.4k</div>
                  </div>
                  
                  <div className="glass p-6 rounded-xl border-neon-green/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-5 h-5 text-neon-green" />
                      <span className="text-sm text-muted-foreground">Goal Progress</span>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>89%</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="gaming" className="px-6">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Center
                  </Button>
                  <Button variant="hero" className="px-6">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics Hub
                  </Button>
                  <Button variant="gaming" className="px-6">
                    <Users className="w-4 h-4 mr-2" />
                    Team Portal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-4">
              Ready to <span className="text-gradient-primary">Level Up</span>?
            </h3>
            <p className="text-muted-foreground mb-6">
              Starten Sie Ihre kostenlose 14-Tage Testversion
            </p>
            <Button variant="gaming" size="lg" className="text-lg px-12 py-6">
              <Gamepad2 className="w-5 h-5 mr-2" />
              Jetzt starten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamingLanding;