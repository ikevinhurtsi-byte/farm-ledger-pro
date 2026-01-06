import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getMonthStart, getMonthEnd } from '@/lib/db';
import { getCashBalance, getMonthToDateSummary, getTransactionsByDateRange } from '@/lib/transactions';
import { getTotalLaborCost } from '@/lib/labor';
import { getAllActivities, getActivityProfitability } from '@/lib/activities';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ActivityProfit {
  name: string;
  profit: number;
}

export default function Dashboard() {
  const [cashBalance, setCashBalance] = useState(0);
  const [monthSummary, setMonthSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [laborCost, setLaborCost] = useState(0);
  const [topActivities, setTopActivities] = useState<ActivityProfit[]>([]);
  const [worstActivity, setWorstActivity] = useState<ActivityProfit | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [balance, summary, labor, activities] = await Promise.all([
          getCashBalance(),
          getMonthToDateSummary(),
          getTotalLaborCost(getMonthStart(), getMonthEnd()),
          getAllActivities(),
        ]);

        setCashBalance(balance);
        setMonthSummary(summary);
        setLaborCost(labor);

        // Get activity profitability
        const profitData = await Promise.all(
          activities.map(async (a) => ({
            name: a.name,
            profit: (await getActivityProfitability(a.id)).profit,
          }))
        );

        const sorted = profitData.sort((a, b) => b.profit - a.profit);
        setTopActivities(sorted.slice(0, 3));
        setWorstActivity(sorted.length > 0 ? sorted[sorted.length - 1] : null);

        // Generate mock monthly trend data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setMonthlyData(months.map((month, i) => ({
          month,
          income: Math.random() * 100000 + 50000,
          expenses: Math.random() * 80000 + 30000,
          profit: Math.random() * 40000 - 10000,
        })));

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const laborPercent = monthSummary.income > 0 
    ? ((laborCost / monthSummary.income) * 100).toFixed(1) 
    : '0';

  const pieData = [
    { name: 'Income', value: monthSummary.income, color: 'hsl(var(--success))' },
    { name: 'Expenses', value: monthSummary.expenses, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Financial overview and key metrics</p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Cash Balance */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(cashBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current available cash</p>
          </CardContent>
        </Card>

        {/* Month-to-Date Profit */}
        <Card className={`border-l-4 ${monthSummary.profit >= 0 ? 'border-l-success' : 'border-l-destructive'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MTD Profit/Loss
            </CardTitle>
            {monthSummary.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${monthSummary.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(monthSummary.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month's net result</p>
          </CardContent>
        </Card>

        {/* Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MTD Income
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">
              {formatCurrency(monthSummary.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total income this month</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MTD Expenses
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">
              {formatCurrency(monthSummary.expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total expenses this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Top Profitable Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topActivities.length > 0 ? (
              <div className="space-y-3">
                {topActivities.map((activity, i) => (
                  <div key={activity.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs font-medium text-success">
                        {i + 1}
                      </span>
                      <span className="font-medium">{activity.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-success">
                      {formatCurrency(activity.profit)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No activity data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Worst Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {worstActivity && worstActivity.profit < 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">{worstActivity.name}</span>
                  <span className="font-semibold tabular-nums text-destructive">
                    {formatCurrency(worstActivity.profit)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This activity is currently operating at a loss. Consider reviewing costs or pricing.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">All activities are profitable</p>
            )}
          </CardContent>
        </Card>

        {/* Labor Cost Percentage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Labor Cost Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold tabular-nums">
                {laborPercent}%
              </div>
              <p className="text-sm text-muted-foreground">
                Labor costs as percentage of income
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Labor Cost</span>
                  <span className="tabular-nums">{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Income</span>
                  <span className="tabular-nums">{formatCurrency(monthSummary.income)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
