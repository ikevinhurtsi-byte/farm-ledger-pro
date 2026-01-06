import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Home, DollarSign, Calendar } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, getToday, Rental, RentalPayment } from '@/lib/db';
import { 
  getAllRentals, 
  addRental, 
  updateRental, 
  deleteRental,
  getRentalPayments,
  addRentalPayment,
  deleteRentalPayment,
  getMonthlyRentalIncome,
  getTotalRentalIncomeThisMonth,
} from '@/lib/rentals';
import { getActiveAssets } from '@/lib/assets';
import { toast } from '@/hooks/use-toast';

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [assets, setAssets] = useState<{ id: string; name: string }[]>([]);
  const [expectedMonthly, setExpectedMonthly] = useState(0);
  const [receivedThisMonth, setReceivedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteRentalId, setDeleteRentalId] = useState<string | null>(null);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [selectedRentalForPayment, setSelectedRentalForPayment] = useState<Rental | null>(null);

  // Rental form
  const [renAssetId, setRenAssetId] = useState('');
  const [renAssetName, setRenAssetName] = useState('');
  const [renRenterName, setRenRenterName] = useState('');
  const [renStartDate, setRenStartDate] = useState(getToday());
  const [renEndDate, setRenEndDate] = useState('');
  const [renMonthlyRate, setRenMonthlyRate] = useState('');
  const [renStatus, setRenStatus] = useState<Rental['status']>('active');
  const [renNotes, setRenNotes] = useState('');

  // Payment form
  const [payDate, setPayDate] = useState(getToday());
  const [payAmount, setPayAmount] = useState('');
  const [payPeriod, setPayPeriod] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rentalList, assetList, expected, received] = await Promise.all([
        getAllRentals(),
        getActiveAssets(),
        getMonthlyRentalIncome(),
        getTotalRentalIncomeThisMonth(),
      ]);
      setRentals(rentalList);
      setAssets(assetList.map(a => ({ id: a.id, name: a.name })));
      setExpectedMonthly(expected);
      setReceivedThisMonth(received);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openRentalDialog(rental?: Rental) {
    if (rental) {
      setEditingRental(rental);
      setRenAssetId(rental.assetId || '');
      setRenAssetName(rental.assetName);
      setRenRenterName(rental.renterName || '');
      setRenStartDate(rental.startDate);
      setRenEndDate(rental.endDate || '');
      setRenMonthlyRate(rental.monthlyRate.toString());
      setRenStatus(rental.status);
      setRenNotes(rental.notes || '');
    } else {
      setEditingRental(null);
      setRenAssetId('');
      setRenAssetName('');
      setRenRenterName('');
      setRenStartDate(getToday());
      setRenEndDate('');
      setRenMonthlyRate('');
      setRenStatus('active');
      setRenNotes('');
    }
    setRentalDialogOpen(true);
  }

  function openPaymentDialog(rental: Rental) {
    setSelectedRentalForPayment(rental);
    setPayDate(getToday());
    setPayAmount(rental.monthlyRate.toString());
    setPayPeriod(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    setPayNotes('');
    setPaymentDialogOpen(true);
  }

  async function handleSaveRental() {
    if (!renAssetName || !renMonthlyRate) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        assetId: renAssetId || undefined,
        assetName: renAssetName,
        renterName: renRenterName || undefined,
        startDate: renStartDate,
        endDate: renEndDate || undefined,
        monthlyRate: parseFloat(renMonthlyRate),
        status: renStatus,
        notes: renNotes || undefined,
      };

      if (editingRental) {
        await updateRental(editingRental.id, data);
        toast({ title: 'Rental updated' });
      } else {
        await addRental(data);
        toast({ title: 'Rental added' });
      }
      setRentalDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save rental', variant: 'destructive' });
    }
  }

  async function handleDeleteRental() {
    if (!deleteRentalId) return;
    try {
      await deleteRental(deleteRentalId);
      toast({ title: 'Rental deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete rental', variant: 'destructive' });
    } finally {
      setDeleteRentalId(null);
    }
  }

  async function handleAddPayment() {
    if (!selectedRentalForPayment || !payAmount || !payPeriod) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      await addRentalPayment({
        rentalId: selectedRentalForPayment.id,
        date: payDate,
        amount: parseFloat(payAmount),
        period: payPeriod,
        notes: payNotes || undefined,
      });
      toast({ title: 'Payment recorded' });
      setPaymentDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    }
  }

  // Update asset name when selecting from dropdown
  useEffect(() => {
    if (renAssetId) {
      const asset = assets.find(a => a.id === renAssetId);
      if (asset) setRenAssetName(asset.name);
    }
  }, [renAssetId, assets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rentals</h2>
          <p className="text-muted-foreground">Track rental income from assets</p>
        </div>
        <Button onClick={() => openRentalDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rental
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expected Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(expectedMonthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">From active rentals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Received This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">{formatCurrency(receivedThisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.filter(r => r.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently earning</p>
          </CardContent>
        </Card>
      </div>

      {/* Rentals Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Asset</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Monthly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No rentals yet. Add your first rental to start tracking income.
                  </TableCell>
                </TableRow>
              ) : (
                rentals.map((rental, i) => (
                  <TableRow key={rental.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        {rental.assetName}
                      </div>
                    </TableCell>
                    <TableCell>{rental.renterName || '-'}</TableCell>
                    <TableCell>{formatDate(rental.startDate)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(rental.monthlyRate)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        rental.status === 'active' ? 'bg-success/10 text-success' :
                        rental.status === 'completed' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {rental.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPaymentDialog(rental)}
                          disabled={rental.status !== 'active'}
                        >
                          Record Payment
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRentalDialog(rental)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteRentalId(rental.id)}
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

      {/* Rental Dialog */}
      <Dialog open={rentalDialogOpen} onOpenChange={setRentalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRental ? 'Edit Rental' : 'Add Rental'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={renAssetId} onValueChange={setRenAssetId}>
                <SelectTrigger><SelectValue placeholder="Select from assets (optional)" /></SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asset/Property Name *</Label>
              <Input value={renAssetName} onChange={(e) => setRenAssetName(e.target.value)} placeholder="e.g., Warehouse, Land Plot A" />
            </div>
            <div className="space-y-2">
              <Label>Renter Name</Label>
              <Input value={renRenterName} onChange={(e) => setRenRenterName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={renStartDate} onChange={(e) => setRenStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={renEndDate} onChange={(e) => setRenEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (KES) *</Label>
              <Input type="number" value={renMonthlyRate} onChange={(e) => setRenMonthlyRate(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={renStatus} onValueChange={(v) => setRenStatus(v as Rental['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={renNotes} onChange={(e) => setRenNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRentalDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRental}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Recording payment for:</p>
              <p className="font-medium">{selectedRentalForPayment?.assetName}</p>
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (KES) *</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Period *</Label>
              <Input value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} placeholder="e.g., January 2025" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRentalId} onOpenChange={() => setDeleteRentalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rental</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rental? All payment records will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRental} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
