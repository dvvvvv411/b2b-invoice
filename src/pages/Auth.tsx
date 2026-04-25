import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "Fehler",
          description: error.message || "Ein Fehler ist aufgetreten.",
          variant: "destructive",
        });
      } else if (!isLogin) {
        toast({
          title: "Registrierung erfolgreich",
          description: "Ihr Konto wurde erstellt. Sie können sich jetzt anmelden.",
        });
        setIsLogin(true);
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-20"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      <div className="w-full max-w-md">
        <Card className="p-8 shadow-elevated border-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-1.5 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-medium">B2B Panel</span>
            </div>

            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </h1>

            <p className="text-sm text-muted-foreground">
              {isLogin 
                ? 'Willkommen zurück! Melden Sie sich an, um fortzufahren.'
                : 'Erstellen Sie Ihr Konto und starten Sie durch.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre.email@beispiel.de"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                "Wird geladen..."
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  {isLogin ? 'Anmelden' : 'Registrieren'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? 'Noch kein Konto? Jetzt registrieren'
                : 'Bereits registriert? Hier anmelden'
              }
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;