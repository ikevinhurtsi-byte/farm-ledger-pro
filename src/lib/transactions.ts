import { getDB, generateId, Transaction, getToday } from '@/lib/db';

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all.filter(t => t.date >= startDate && t.date <= endDate);
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-date', date);
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
  const db = await getDB();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('transactions', transaction);
  return transaction;
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | null> {
  const db = await getDB();
  const existing = await db.get('transactions', id);
  if (!existing) return null;
  
  const updated: Transaction = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('transactions', updated);
  return updated;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('transactions', id);
  return true;
}

export async function getCashBalance(): Promise<number> {
  const transactions = await getAllTransactions();
  return transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);
}

export async function getMonthToDateSummary(): Promise<{ income: number; expenses: number; profit: number }> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const transactions = await getTransactionsByDateRange(startOfMonth, endOfMonth);
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return { income, expenses, profit: income - expenses };
}

export async function getTodayTransactions(): Promise<Transaction[]> {
  return getTransactionsByDate(getToday());
}

export async function getRunningBalance(transactions: Transaction[]): Promise<number> {
  const allTransactions = await getAllTransactions();
  return allTransactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);
}
