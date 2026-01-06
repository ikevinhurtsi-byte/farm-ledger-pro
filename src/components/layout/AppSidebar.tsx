import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Tractor, 
  Package, 
  Home,
  FileText, 
  Settings,
  ChevronLeft,
  Leaf
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navigationItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Daily Cashbook', url: '/cashbook', icon: BookOpen },
  { title: 'Labor & Employees', url: '/labor', icon: Users },
  { title: 'Activities', url: '/activities', icon: Tractor },
  { title: 'Assets', url: '/assets', icon: Package },
  { title: 'Rentals', url: '/rentals', icon: Home },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r-0"
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
            <Leaf className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Farm Accounts</span>
              <span className="text-xs text-sidebar-muted">Offline System</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== '/' && location.pathname.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-10 transition-colors",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarTrigger className="w-full justify-center h-9 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "rotate-180"
          )} />
          {!isCollapsed && <span className="ml-2 text-sm">Collapse</span>}
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
