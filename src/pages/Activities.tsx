import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Tractor, TrendingUp, TrendingDown } from 'lucide-react';
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
import { formatCurrency, formatDate, getToday, Activity, ActivityRecord } from '@/lib/db';
import { 
  getAllActivities, 
  addActivity, 
  updateActivity, 
  deleteActivity,
  getAllActivityRecords,
  addActivityRecord,
  deleteActivityRecord,
  getActivityProfitability,
} from '@/lib/activities';
import { toast } from '@/hooks/use-toast';

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [activityProfits, setActivityProfits] = useState<Map<string, { income: number; expenses: number; profit: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Activity form
  const [actName, setActName] = useState('');
  const [actType, setActType] = useState<Activity['type']>('crop');
  const [actStatus, setActStatus] = useState<Activity['status']>('active');
  const [actNotes, setActNotes] = useState('');

  // Record form
  const [recActivityId, setRecActivityId] = useState('');
  const [recDate, setRecDate] = useState(getToday());
  const [recQuantity, setRecQuantity] = useState('');
  const [recUnit, setRecUnit] = useState('');
  const [recLoss, setRecLoss] = useState('');
  const [recIncome, setRecIncome] = useState('');
  const [recExpense, setRecExpense] = useState('');
  const [recNotes, setRecNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [acts, recs] = await Promise.all([
        getAllActivities(),
        getAllActivityRecords(),
      ]);
      setActivities(acts);
      setRecords(recs);

      // Load profitability for each activity
      const profits = new Map();
      for (const act of acts) {
        const profit = await getActivityProfitability(act.id);
        profits.set(act.id, profit);
      }
      setActivityProfits(profits);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openActivityDialog(activity?: Activity) {
    if (activity) {
      setEditingActivity(activity);
      setActName(activity.name);
      setActType(activity.type);
      setActStatus(activity.status);
      setActNotes(activity.notes || '');
    } else {
      setEditingActivity(null);
      setActName('');
      setActType('crop');
      setActStatus('active');
      setActNotes('');
    }
    setActivityDialogOpen(true);
  }

  async function handleSaveActivity() {
    if (!actName) {
      toast({ title: 'Please enter an activity name', variant: 'destructive' });
      return;
    }

    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          name: actName,
          type: actType,
          status: actStatus,
          notes: actNotes || undefined,
        });
        toast({ title: 'Activity updated' });
      } else {
        await addActivity({
          name: actName,
          type: actType,
          status: actStatus,
          notes: actNotes || undefined,
        });
        toast({ title: 'Activity added' });
      }
      setActivityDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save activity', variant: 'destructive' });
    }
  }

  async function handleDeleteActivity() {
    if (!deleteActivityId) return;
    try {
      await deleteActivity(deleteActivityId);
      toast({ title: 'Activity deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete activity', variant: 'destructive' });
    } finally {
      setDeleteActivityId(null);
    }
  }

  async function handleAddRecord() {
    if (!recActivityId) {
      toast({ title: 'Please select an activity', variant: 'destructive' });
      return;
    }

    try {
      await addActivityRecord({
        activityId: recActivityId,
        date: recDate,
        quantity: recQuantity ? parseFloat(recQuantity) : undefined,
        unit: recUnit || undefined,
        loss: recLoss ? parseFloat(recLoss) : undefined,
        income: recIncome ? parseFloat(recIncome) : undefined,
        expense: recExpense ? parseFloat(recExpense) : undefined,
        notes: recNotes || undefined,
      });
      toast({ title: 'Record added' });
      setRecordDialogOpen(false);
      setRecActivityId('');
      setRecQuantity('');
      setRecUnit('');
      setRecLoss('');
      setRecIncome('');
      setRecExpense('');
      setRecNotes('');
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to add record', variant: 'destructive' });
    }
  }

  async function handleDeleteRecord() {
    if (!deleteRecordId) return;
    try {
      await deleteActivityRecord(deleteRecordId);
      toast({ title: 'Record deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete record', variant: 'destructive' });
    } finally {
      setDeleteRecordId(null);
    }
  }

  const typeLabels = {
    crop: 'Crop',
    livestock: 'Livestock',
    service: 'Service',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activities</h2>
          <p className="text-muted-foreground">Track farm activities and their performance</p>
        </div>
      </div>

      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openActivityDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No activities yet. Add your first activity to start tracking.
                </CardContent>
              </Card>
            ) : (
              activities.map((activity) => {
                const profit = activityProfits.get(activity.id) || { income: 0, expenses: 0, profit: 0 };
                return (
                  <Card key={activity.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Tractor className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{activity.name}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openActivityDialog(activity)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteActivityId(activity.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                          {typeLabels[activity.type]}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          activity.status === 'active' ? 'bg-success/10 text-success' :
                          activity.status === 'completed' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Income</span>
                          <span className="font-mono text-success">{formatCurrency(profit.income)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses</span>
                          <span className="font-mono text-destructive">{formatCurrency(profit.expenses)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-medium">Net</span>
                          <span className={`font-mono font-bold ${profit.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profit.profit >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                            {formatCurrency(profit.profit)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRecordDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Loss</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No records yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, i) => {
                      const activity = activities.find(a => a.id === record.activityId);
                      return (
                        <TableRow key={record.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell className="font-medium">{activity?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.quantity ? `${record.quantity} ${record.unit || ''}` : '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">
                            {record.loss || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-success">
                            {record.income ? formatCurrency(record.income) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            {record.expense ? formatCurrency(record.expense) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteRecordId(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={actName} onChange={(e) => setActName(e.target.value)} placeholder="e.g., Maize Farming" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={actType} onValueChange={(v) => setActType(v as Activity['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crop">Crop</SelectItem>
                  <SelectItem value="livestock">Livestock</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={actStatus} onValueChange={(v) => setActStatus(v as Activity['status'])}>
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
              <Input value={actNotes} onChange={(e) => setActNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveActivity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity *</Label>
              <Select value={recActivityId} onValueChange={setRecActivityId}>
                <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                <SelectContent>
                  {activities.filter(a => a.status === 'active').map((act) => (
                    <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={recDate} onChange={(e) => setRecDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={recQuantity} onChange={(e) => setRecQuantity(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={recUnit} onChange={(e) => setRecUnit(e.target.value)} placeholder="e.g., kg, bags" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Loss</Label>
              <Input type="number" value={recLoss} onChange={(e) => setRecLoss(e.target.value)} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Income (KES)</Label>
                <Input type="number" value={recIncome} onChange={(e) => setRecIncome(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Expense (KES)</Label>
                <Input type="number" value={recExpense} onChange={(e) => setRecExpense(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={recNotes} onChange={(e) => setRecNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteActivityId} onOpenChange={() => setDeleteActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? All associated records will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteActivity} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
