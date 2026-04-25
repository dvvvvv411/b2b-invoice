import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Car,
  Building2,
  CreditCard,
  Truck,
  Factory,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: BarChart3 },
  { title: 'Dokumente erstellen', url: '/admin/dokumente-erstellen', icon: FileText },
  { title: 'Bestellungen', url: '/admin/bestellungen', icon: ShoppingCart },
  { title: 'Kunden', url: '/admin/kunden', icon: Users },
  { title: 'Autos', url: '/admin/autos', icon: Car },
  { title: 'Kanzleien', url: '/admin/kanzleien', icon: Building2 },
  { title: 'Bankkonten', url: '/admin/bankkonten', icon: CreditCard },
  { title: 'Speditionen', url: '/admin/speditionen', icon: Truck },
  { title: 'Insolvente Unternehmen', url: '/admin/insolvente-unternehmen', icon: Factory },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) =>
    isActive(path)
      ? 'bg-accent text-accent-foreground font-medium border-l-2 border-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent';

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-2 px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(item.url)}`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}