import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate, getToday, Transaction } from '@/lib/db';
import { 
  getTodayTransactions, 
  addTransaction, 
  deleteTransaction, 
  getCashBalance,
  getTransactionsByDateRange
} from '@/lib/transactions';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = {
  income: ['Sales', 'Rental Income', 'Services', 'Grants', 'Other Income'],
  expense: ['Labor', 'Seeds/Inputs', 'Fertilizer', 'Fuel', 'Maintenance', 'Utilities', 'Transport', 'Other Expense'],
};

export default function Cashbook() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    try {
      const [txns, bal] = await Promise.all([
        getTransactionsByDateRange(selectedDate, selectedDate),
        getCashBalance(),
      ]);
      setTransactions(txns);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!category || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addTransaction({
        date: selectedDate,
        type,
        category,
        description,
        amount: parseFloat(amount),
      });

      // Reset form
      setCategory('');
      setDescription('');
      setAmount('');
      descriptionRef.current?.focus();

      await loadData();
      
      toast({
        title: 'Transaction Added',
        description: `${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(parseFloat(amount))} recorded`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    
    try {
      await deleteTransaction(deleteId);
      await loadData();
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  }

  const todayIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const todayExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Daily Cashbook</h2>
          <p className="text-muted-foreground">Record daily income and expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Running Balance</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Entry Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'outline'}
                    className={type === 'income' ? 'bg-success hover:bg-success/90' : ''}
                    onClick={() => { setType('income'); setCategory(''); }}
                  >
                    Income
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'expense' ? 'default' : 'outline'}
                    className={type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}
                    onClick={() => { setType('expense'); setCategory(''); }}
                  >
                    Expense
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[type].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-mono"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Today's Summary & Entries */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Entries for {formatDate(selectedDate)}
            </CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span>Income: <strong className="tabular-nums">{formatCurrency(todayIncome)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span>Expenses: <strong className="tabular-nums">{formatCurrency(todayExpenses)}</strong></span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[150px]">Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No entries for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx, i) => (
                      <TableRow key={tx.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            tx.type === 'income' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {tx.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{tx.category}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${
                          tx.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
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
