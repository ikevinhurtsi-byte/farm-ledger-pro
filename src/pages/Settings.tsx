import { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { FarmSettings } from '@/lib/db';
import { getSettings, updateSettings, exportData, importData } from '@/lib/settings';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('KES');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const s = await getSettings();
      setSettings(s);
      setFarmName(s.farmName);
      setOwnerName(s.ownerName || '');
      setAddress(s.address || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setCurrency(s.currency);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        farmName,
        ownerName: ownerName || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        currency,
      });
      toast({ title: 'Settings saved' });
    } catch (error) {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farm-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup downloaded', description: 'Keep this file safe!' });
    } catch (error) {
      toast({ title: 'Backup failed', variant: 'destructive' });
    }
  }

  async function handleRestore() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importData(text);
      if (success) {
        toast({ title: 'Data restored successfully' });
        await loadSettings();
      } else {
        toast({ title: 'Restore failed', description: 'Invalid backup file', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Restore failed', variant: 'destructive' });
    } finally {
      setRestoreDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage farm information and data backups</p>
      </div>

      {/* Farm Information */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Information</CardTitle>
          <CardDescription>Basic details about your farm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name *</Label>
              <Input 
                id="farmName"
                value={farmName} 
                onChange={(e) => setFarmName(e.target.value)} 
                placeholder="My Farm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input 
                id="ownerName"
                value={ownerName} 
                onChange={(e) => setOwnerName(e.target.value)} 
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address"
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Farm location"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="farm@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input 
              id="currency"
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)} 
              placeholder="KES"
              className="w-32"
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup and restore your farm data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Create Backup</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your data as a JSON file. Store it safely.
              </p>
            </div>
            <Button variant="outline" onClick={handleBackup}>
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
          </div>

          <Separator />

          {/* Restore */}
          <div className="flex items-start justify-between p-4 border rounded-lg border-warning/50 bg-warning/5">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Restore from Backup
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                This will replace ALL current data with the backup file. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Backup File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setRestoreDialogOpen(true);
                }
              }}
            />
          </div>

          {/* Storage Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Local Storage Active
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              All data is stored locally in your browser using IndexedDB. 
              No internet connection is required for normal operation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Restore Data from Backup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all current data and replace it with the data from your backup file.
              <br /><br />
              <strong>This action cannot be undone.</strong>
              <br /><br />
              Make sure you have a current backup before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Yes, Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
