import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

const Admin = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-orbitron text-gradient-primary">
              Admin Panel
            </h1>
            <p className="text-muted-foreground text-sm">
              Willkommen, {user.email}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Einstellungen
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Gray placeholder */}
      <main className="p-6">
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-muted-foreground mb-4">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground/70 text-lg">
            Hier wird das Admin Panel entwickelt...
          </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;