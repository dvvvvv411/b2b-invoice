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
  { title: 'Kunden', url: '/admin/kunden', icon: Users },
  { title: 'Autos', url: '/admin/autos', icon: Car },
  { title: 'Kanzleien', url: '/admin/kanzleien', icon: Building2 },
  { title: 'Bankkonten', url: '/admin/bankkonten', icon: CreditCard },
  { title: 'Speditionen', url: '/admin/speditionen', icon: Truck },
  { title: 'Insolvente Unternehmen', url: '/admin/insolvente-unternehmen', icon: Factory },
  { title: 'PDF Generator', url: '/admin/pdf-generator', icon: FileText },
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
      ? 'bg-primary text-primary-foreground font-medium' 
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground';

  return (
    <Sidebar className="border-r border-border bg-gray-800">
      <SidebarContent className="bg-gray-800">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-300 font-semibold text-lg mb-4">
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
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${getNavClass(item.url)}`}
                    >
                      <item.icon className="w-5 h-5 mr-3 text-white" />
                      {!collapsed && (
                        <span className="text-white font-medium">{item.title}</span>
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