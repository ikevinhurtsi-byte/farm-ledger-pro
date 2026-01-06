import { useState, useEffect } from 'react';
import { Calendar, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, getToday } from '@/lib/db';

interface AppHeaderProps {
  farmName: string;
}

export function AppHeader({ farmName }: AppHeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const today = getToday();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-14 border-b bg-card px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-foreground">{farmName}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(today)}</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Local Storage</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
