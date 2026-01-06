import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema types
export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  activityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LaborEntry {
  id: string;
  date: string;
  employeeId: string;
  activityId?: string;
  laborType: 'direct' | 'shared';
  hoursWorked: number;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'crop' | 'livestock' | 'service' | 'other';
  status: 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  activityId: string;
  date: string;
  quantity?: number;
  unit?: string;
  loss?: number;
  income?: number;
  expense?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: 'equipment' | 'vehicle' | 'building' | 'land' | 'other';
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  depreciationMethod: 'straight-line' | 'declining-balance';
  usefulLife: number;
  notes?: string;
  status: 'active' | 'disposed' | 'sold';
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  assetId?: string;
  assetName: string;
  renterName?: string;
  startDate: string;
  endDate?: string;
  monthlyRate: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalPayment {
  id: string;
  rentalId: string;
  date: string;
  amount: number;
  period: string;
  notes?: string;
  createdAt: string;
}

export interface FarmSettings {
  id: string;
  farmName: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  fiscalYearStart: string;
  updatedAt: string;
}

interface FarmDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string; 'by-type': string; 'by-category': string };
  };
  employees: {
    key: string;
    value: Employee;
    indexes: { 'by-status': string };
  };
  laborEntries: {
    key: string;
    value: LaborEntry;
    indexes: { 'by-date': string; 'by-employee': string; 'by-activity': string };
  };
  activities: {
    key: string;
    value: Activity;
    indexes: { 'by-status': string; 'by-type': string };
  };
  activityRecords: {
    key: string;
    value: ActivityRecord;
    indexes: { 'by-date': string; 'by-activity': string };
  };
  assets: {
    key: string;
    value: Asset;
    indexes: { 'by-category': string; 'by-status': string };
  };
  rentals: {
    key: string;
    value: Rental;
    indexes: { 'by-status': string; 'by-asset': string };
  };
  rentalPayments: {
    key: string;
    value: RentalPayment;
    indexes: { 'by-rental': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: FarmSettings;
  };
}

let dbInstance: IDBPDatabase<FarmDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FarmDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FarmDB>('farm-accounting', 1, {
    upgrade(db) {
      // Transactions store
      const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
      txStore.createIndex('by-date', 'date');
      txStore.createIndex('by-type', 'type');
      txStore.createIndex('by-category', 'category');

      // Employees store
      const empStore = db.createObjectStore('employees', { keyPath: 'id' });
      empStore.createIndex('by-status', 'status');

      // Labor entries store
      const laborStore = db.createObjectStore('laborEntries', { keyPath: 'id' });
      laborStore.createIndex('by-date', 'date');
      laborStore.createIndex('by-employee', 'employeeId');
      laborStore.createIndex('by-activity', 'activityId');

      // Activities store
      const actStore = db.createObjectStore('activities', { keyPath: 'id' });
      actStore.createIndex('by-status', 'status');
      actStore.createIndex('by-type', 'type');

      // Activity records store
      const actRecStore = db.createObjectStore('activityRecords', { keyPath: 'id' });
      actRecStore.createIndex('by-date', 'date');
      actRecStore.createIndex('by-activity', 'activityId');

      // Assets store
      const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
      assetStore.createIndex('by-category', 'category');
      assetStore.createIndex('by-status', 'status');

      // Rentals store
      const rentalStore = db.createObjectStore('rentals', { keyPath: 'id' });
      rentalStore.createIndex('by-status', 'status');
      rentalStore.createIndex('by-asset', 'assetId');

      // Rental payments store
      const rentalPayStore = db.createObjectStore('rentalPayments', { keyPath: 'id' });
      rentalPayStore.createIndex('by-rental', 'rentalId');
      rentalPayStore.createIndex('by-date', 'date');

      // Settings store
      db.createObjectStore('settings', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount: number, currency = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

export function getMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
}
