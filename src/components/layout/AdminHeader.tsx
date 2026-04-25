import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-soft">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-soft">
            <span className="text-primary-foreground font-semibold text-sm tracking-wide">PDF</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">PDF Generator Panel</h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{user?.email}</span>
        </div>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Abmelden
        </Button>
      </div>
    </header>
  );
}