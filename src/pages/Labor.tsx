import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users as UsersIcon, DollarSign } from 'lucide-react';
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
import { formatCurrency, formatDate, getToday, getMonthStart, getMonthEnd, Employee, LaborEntry } from '@/lib/db';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee, getActiveEmployees } from '@/lib/employees';
import { getLaborEntriesByDateRange, addLaborEntry, deleteLaborEntry, getTotalLaborCost } from '@/lib/labor';
import { getActiveActivities } from '@/lib/activities';
import { toast } from '@/hooks/use-toast';

export default function Labor() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);
  const [totalLabor, setTotalLabor] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [laborDialogOpen, setLaborDialogOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [deleteLaborId, setDeleteLaborId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Employee form
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empRate, setEmpRate] = useState('');
  const [empPhone, setEmpPhone] = useState('');

  // Labor entry form
  const [laborDate, setLaborDate] = useState(getToday());
  const [laborEmployeeId, setLaborEmployeeId] = useState('');
  const [laborActivityId, setLaborActivityId] = useState('');
  const [laborType, setLaborType] = useState<'direct' | 'shared'>('direct');
  const [laborHours, setLaborHours] = useState('8');
  const [laborAmount, setLaborAmount] = useState('');
  const [laborNotes, setLaborNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [emps, entries, acts, total] = await Promise.all([
        getAllEmployees(),
        getLaborEntriesByDateRange(getMonthStart(), getMonthEnd()),
        getActiveActivities(),
        getTotalLaborCost(getMonthStart(), getMonthEnd()),
      ]);
      setEmployees(emps);
      setLaborEntries(entries);
      setActivities(acts.map(a => ({ id: a.id, name: a.name })));
      setTotalLabor(total);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openEmployeeDialog(employee?: Employee) {
    if (employee) {
      setEditingEmployee(employee);
      setEmpName(employee.name);
      setEmpRole(employee.role);
      setEmpRate(employee.dailyRate.toString());
      setEmpPhone(employee.phone || '');
    } else {
      setEditingEmployee(null);
      setEmpName('');
      setEmpRole('');
      setEmpRate('');
      setEmpPhone('');
    }
    setEmployeeDialogOpen(true);
  }

  async function handleSaveEmployee() {
    if (!empName || !empRole || !empRate) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          name: empName,
          role: empRole,
          dailyRate: parseFloat(empRate),
          phone: empPhone || undefined,
        });
        toast({ title: 'Employee updated' });
      } else {
        await addEmployee({
          name: empName,
          role: empRole,
          dailyRate: parseFloat(empRate),
          phone: empPhone || undefined,
          status: 'active',
        });
        toast({ title: 'Employee added' });
      }
      setEmployeeDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save employee', variant: 'destructive' });
    }
  }

  async function handleDeleteEmployee() {
    if (!deleteEmployeeId) return;
    try {
      await deleteEmployee(deleteEmployeeId);
      toast({ title: 'Employee deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete employee', variant: 'destructive' });
    } finally {
      setDeleteEmployeeId(null);
    }
  }

  async function handleAddLabor() {
    if (!laborEmployeeId || !laborAmount) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      await addLaborEntry({
        date: laborDate,
        employeeId: laborEmployeeId,
        activityId: laborActivityId || undefined,
        laborType,
        hoursWorked: parseFloat(laborHours),
        amount: parseFloat(laborAmount),
        notes: laborNotes || undefined,
      });
      toast({ title: 'Labor entry added' });
      setLaborDialogOpen(false);
      setLaborEmployeeId('');
      setLaborActivityId('');
      setLaborAmount('');
      setLaborNotes('');
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to add labor entry', variant: 'destructive' });
    }
  }

  async function handleDeleteLabor() {
    if (!deleteLaborId) return;
    try {
      await deleteLaborEntry(deleteLaborId);
      toast({ title: 'Labor entry deleted' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to delete labor entry', variant: 'destructive' });
    } finally {
      setDeleteLaborId(null);
    }
  }

  // Auto-calculate amount based on employee rate
  useEffect(() => {
    if (laborEmployeeId && laborHours) {
      const emp = employees.find(e => e.id === laborEmployeeId);
      if (emp) {
        const hours = parseFloat(laborHours) || 0;
        const rate = emp.dailyRate / 8; // Hourly rate
        setLaborAmount((hours * rate).toFixed(2));
      }
    }
  }, [laborEmployeeId, laborHours, employees]);

  const activeEmployees = employees.filter(e => e.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Labor & Employees</h2>
          <p className="text-muted-foreground">Manage employees and track labor costs</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">MTD Labor Cost</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(totalLabor)}</p>
        </div>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Labor Entries</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setLaborDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Labor Entry
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No labor entries this month
                      </TableCell>
                    </TableRow>
                  ) : (
                    laborEntries.map((entry, i) => {
                      const emp = employees.find(e => e.id === entry.employeeId);
                      const act = activities.find(a => a.id === entry.activityId);
                      return (
                        <TableRow key={entry.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell className="font-medium">{emp?.name || 'Unknown'}</TableCell>
                          <TableCell>{act?.name || 'General'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              entry.laborType === 'direct' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-accent/10 text-accent'
                            }`}>
                              {entry.laborType === 'direct' ? 'Direct' : 'Shared'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{entry.hoursWorked}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteLaborId(entry.id)}
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

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openEmployeeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No employees yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp, i) => (
                      <TableRow key={emp.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.phone || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(emp.dailyRate)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            emp.status === 'active' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {emp.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openEmployeeDialog(emp)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteEmployeeId(emp.id)}
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
        </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="Employee name" />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input value={empRole} onChange={(e) => setEmpRole(e.target.value)} placeholder="e.g., Farm Worker, Supervisor" />
            </div>
            <div className="space-y-2">
              <Label>Daily Rate (KES) *</Label>
              <Input type="number" value={empRate} onChange={(e) => setEmpRate(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEmployee}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labor Entry Dialog */}
      <Dialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Labor Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={laborDate} onChange={(e) => setLaborDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={laborEmployeeId} onValueChange={setLaborEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select value={laborActivityId} onValueChange={setLaborActivityId}>
                <SelectTrigger><SelectValue placeholder="General (no specific activity)" /></SelectTrigger>
                <SelectContent>
                  {activities.map((act) => (
                    <SelectItem key={act.id} value={act.id}>{act.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Labor Type</Label>
              <Select value={laborType} onValueChange={(v) => setLaborType(v as 'direct' | 'shared')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Labor</SelectItem>
                  <SelectItem value="shared">Shared Labor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours Worked</Label>
                <Input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input type="number" value={laborAmount} onChange={(e) => setLaborAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={laborNotes} onChange={(e) => setLaborNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaborDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLabor}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteEmployeeId} onOpenChange={() => setDeleteEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLaborId} onOpenChange={() => setDeleteLaborId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Labor Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this labor entry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLabor} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
