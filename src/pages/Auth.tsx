import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Gamepad2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-20"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-6">
        <Card className="glass p-8 border-primary/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">B2B Panel</span>
            </div>
            
            <h1 className="text-3xl font-bold font-orbitron mb-2">
              <span className="text-gradient-primary">
                {isLogin ? 'Anmelden' : 'Registrieren'}
              </span>
            </h1>
            
            <p className="text-muted-foreground">
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
              variant="gaming"
              className="w-full text-lg py-6"
              disabled={loading}
            >
              {loading ? (
                "Wird geladen..."
              ) : (
                <>
                  <User className="w-5 h-5 mr-2" />
                  {isLogin ? 'Anmelden' : 'Registrieren'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary-glow transition-colors"
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