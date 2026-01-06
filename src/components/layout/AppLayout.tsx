import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getSettings } from '@/lib/settings';

export function AppLayout() {
  const [farmName, setFarmName] = useState('My Farm');
  const location = useLocation();

  useEffect(() => {
    getSettings().then(settings => {
      setFarmName(settings.farmName);
    });
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader farmName={farmName} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
