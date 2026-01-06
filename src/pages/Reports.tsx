import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, Filter } from 'lucide-react';
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
import { formatCurrency, formatDate, getMonthStart, getMonthEnd } from '@/lib/db';
import { getTransactionsByDateRange } from '@/lib/transactions';
import { getTotalLaborCost } from '@/lib/labor';
import { getAllActivities, getActivityProfitability } from '@/lib/activities';
import { getTotalDepreciationThisMonth } from '@/lib/assets';
import { toast } from '@/hooks/use-toast';

type ReportType = 'profit-loss' | 'cash-summary' | 'activity-analysis';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('profit-loss');
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getMonthEnd());
  const [loading, setLoading] = useState(false);

  // Report data
  const [plData, setPLData] = useState<{
    income: { category: string; amount: number }[];
    expenses: { category: string; amount: number }[];
    totalIncome: number;
    totalExpenses: number;
    laborCost: number;
    depreciation: number;
    netProfit: number;
  } | null>(null);

  async function generateReport() {
    setLoading(true);
    try {
      if (reportType === 'profit-loss') {
        const [transactions, labor, depreciation] = await Promise.all([
          getTransactionsByDateRange(startDate, endDate),
          getTotalLaborCost(startDate, endDate),
          getTotalDepreciationThisMonth(),
        ]);

        // Group by category
        const incomeByCategory = new Map<string, number>();
        const expensesByCategory = new Map<string, number>();

        transactions.forEach(t => {
          if (t.type === 'income') {
            incomeByCategory.set(t.category, (incomeByCategory.get(t.category) || 0) + t.amount);
          } else {
            expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
          }
        });

        const income = Array.from(incomeByCategory.entries()).map(([category, amount]) => ({ category, amount }));
        const expenses = Array.from(expensesByCategory.entries()).map(([category, amount]) => ({ category, amount }));
        
        const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) + labor + depreciation;

        setPLData({
          income,
          expenses,
          totalIncome,
          totalExpenses,
          laborCost: labor,
          depreciation,
          netProfit: totalIncome - totalExpenses,
        });
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({ title: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate]);

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    if (!plData) return;
    
    const reportContent = {
      type: 'Profit & Loss Statement',
      period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      generatedAt: new Date().toISOString(),
      data: plData,
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${startDate}-to-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Report exported' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">Generate financial statements and summaries</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Report Selection */}
        <Card className="lg:col-span-1 no-print">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Report Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss Statement</SelectItem>
                  <SelectItem value="cash-summary" disabled>Cash Summary (Coming Soon)</SelectItem>
                  <SelectItem value="activity-analysis" disabled>Activity Analysis (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>

            <Button className="w-full" onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <div className="text-center">
              <h3 className="text-xl font-bold">Profit & Loss Statement</h3>
              <p className="text-muted-foreground">
                {formatDate(startDate)} — {formatDate(endDate)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="py-6">
            {plData ? (
              <div className="space-y-8">
                {/* Income Section */}
                <div>
                  <h4 className="text-lg font-semibold text-success mb-4 border-b pb-2">Income</h4>
                  <Table>
                    <TableBody>
                      {plData.income.length === 0 ? (
                        <TableRow>
                          <TableCell className="text-muted-foreground">No income recorded</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      ) : (
                        plData.income.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="pl-4">{item.category}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="font-semibold bg-success/5">
                        <TableCell>Total Income</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-success">
                          {formatCurrency(plData.totalIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="text-lg font-semibold text-destructive mb-4 border-b pb-2">Expenses</h4>
                  <Table>
                    <TableBody>
                      {plData.expenses.map((item) => (
                        <TableRow key={item.category}>
                          <TableCell className="pl-4">{item.category}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="pl-4">Labor Costs</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(plData.laborCost)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-4">Depreciation</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(plData.depreciation)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-semibold bg-destructive/5">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-destructive">
                          {formatCurrency(plData.totalExpenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Profit */}
                <div className="border-t-2 border-foreground pt-4">
                  <Table>
                    <TableBody>
                      <TableRow className="text-lg">
                        <TableCell className="font-bold">Net Profit / (Loss)</TableCell>
                        <TableCell className={`text-right font-mono font-bold tabular-nums text-xl ${
                          plData.netProfit >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {formatCurrency(plData.netProfit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Gross Margin</p>
                    <p className="text-lg font-bold tabular-nums">
                      {plData.totalIncome > 0 
                        ? ((plData.netProfit / plData.totalIncome) * 100).toFixed(1) 
                        : '0'}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Labor Ratio</p>
                    <p className="text-lg font-bold tabular-nums">
                      {plData.totalIncome > 0 
                        ? ((plData.laborCost / plData.totalIncome) * 100).toFixed(1) 
                        : '0'}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Expense Ratio</p>
                    <p className="text-lg font-bold tabular-nums">
                      {plData.totalIncome > 0 
                        ? ((plData.totalExpenses / plData.totalIncome) * 100).toFixed(1) 
                        : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select options and generate a report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
