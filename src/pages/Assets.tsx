import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { formatCurrency, formatDate, getToday, Asset } from '@/lib/db';
import { 
  getAllAssets, 
  addAsset, 
  updateAsset, 
  deleteAsset,
  calculateDepreciation,
  getMonthlyDepreciation,
  getTotalAssetValue,
  getTotalDepreciationThisMonth,
} from '@/lib/assets';
import { toast } from '@/hooks/use-toast';

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [monthlyDep, setMonthlyDep] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Asset['category']>('equipment');
  const [purchaseDate, setPurchaseDate] = useState(getToday());
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [depRate, setDepRate] = useState('10');
  const [depMethod, setDepMethod] = useState<Asset['depreciationMethod']>('straight-line');
  const [usefulLife, setUsefulLife] = useState('10');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Asset['status']>('active');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [assetList, total, dep] = await Promise.all([
        getAllAssets(),
        getTotalAssetValue(),
        getTotalDepreciationThisMonth(),
      ]);
      setAssets(assetList);
      setTotalValue(total);
      setMonthlyDep(dep);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDialog(asset?: Asset) {
    if (asset) {
      setEditingAsset(asset);
      setName(asset.name);
      setCategory(asset.category);
      setPurchaseDate(asset.purchaseDate);
      setPurchasePrice(asset.purchasePrice.toString());
      setCurrentValue(asset.currentValue.toString());
      setDepRate(asset.depreciationRate.toString());
      setDepMethod(asset.depreciationMethod);
      setUsefulLife(asset.usefulLife.toString());
      setNotes(asset.notes || '');
      setStatus(asset.status);
    } else {
      setEditingAsset(null);
      setName('');
      setCategory('equipment');
      setPurchaseDate(getToday());
      setPurchasePrice('');
      setCurrentValue('');
      setDepRate('10');
      setDepMethod('straight-line');
      setUsefulLife('10');
      setNotes('');
      setStatus('active');
    }
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name || !purchasePrice || !currentValue) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        name,
        category,
        purchaseDate,
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(currentValue),
        depreciationRate: parseFloat(depRate),
        depreciationMethod: depMethod,
        usefulLife: parseInt(usefulLife),
        notes: notes || undefined,
        status,
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, data);
        toast({ title: 'Asset updated' });
      } else {
        await addAsset(data);
        toast({ title: 'Asset added' });
      }
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save asset', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteAsset(deleteId);
      toast({ title: 'Asset deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete asset', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  }

  const categoryLabels = {
    equipment: 'Equipment',
    vehicle: 'Vehicle',
    building: 'Building',
    land: 'Land',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assets</h2>
          <p className="text-muted-foreground">Track farm assets and depreciation</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Asset Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current book value of all assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Monthly Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-warning">{formatCurrency(monthlyDep)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month's depreciation expense</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.filter(a => a.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Monthly Dep.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No assets yet. Add your first asset to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset, i) => (
                  <TableRow key={asset.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {asset.name}
                      </div>
                    </TableCell>
                    <TableCell>{categoryLabels[asset.category]}</TableCell>
                    <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(asset.purchasePrice)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(asset.currentValue)}</TableCell>
                    <TableCell className="text-right font-mono text-warning">{formatCurrency(getMonthlyDepreciation(asset))}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        asset.status === 'active' ? 'bg-success/10 text-success' :
                        asset.status === 'sold' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(asset)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Asset Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Asset Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tractor, Water Pump" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Asset['category'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Asset['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price (KES) *</Label>
                <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Current Value (KES) *</Label>
                <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Depreciation Method</Label>
              <Select value={depMethod} onValueChange={(v) => setDepMethod(v as Asset['depreciationMethod'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight-line">Straight Line</SelectItem>
                  <SelectItem value="declining-balance">Declining Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Depreciation Rate (%)</Label>
                <Input type="number" value={depRate} onChange={(e) => setDepRate(e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Useful Life (years)</Label>
                <Input type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} placeholder="10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
