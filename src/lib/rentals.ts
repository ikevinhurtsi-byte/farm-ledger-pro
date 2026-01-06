import { getDB, generateId, Rental, RentalPayment } from '@/lib/db';

export async function getAllRentals(): Promise<Rental[]> {
  const db = await getDB();
  return db.getAll('rentals');
}

export async function getActiveRentals(): Promise<Rental[]> {
  const db = await getDB();
  return db.getAllFromIndex('rentals', 'by-status', 'active');
}

export async function getRental(id: string): Promise<Rental | undefined> {
  const db = await getDB();
  return db.get('rentals', id);
}

export async function addRental(data: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rental> {
  const db = await getDB();
  const now = new Date().toISOString();
  const rental: Rental = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('rentals', rental);
  return rental;
}

export async function updateRental(id: string, data: Partial<Rental>): Promise<Rental | null> {
  const db = await getDB();
  const existing = await db.get('rentals', id);
  if (!existing) return null;
  
  const updated: Rental = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('rentals', updated);
  return updated;
}

export async function deleteRental(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('rentals', id);
  return true;
}

// Rental Payments
export async function getRentalPayments(rentalId: string): Promise<RentalPayment[]> {
  const db = await getDB();
  return db.getAllFromIndex('rentalPayments', 'by-rental', rentalId);
}

export async function addRentalPayment(data: Omit<RentalPayment, 'id' | 'createdAt'>): Promise<RentalPayment> {
  const db = await getDB();
  const payment: RentalPayment = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await db.add('rentalPayments', payment);
  return payment;
}

export async function deleteRentalPayment(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('rentalPayments', id);
  return true;
}

export async function getMonthlyRentalIncome(): Promise<number> {
  const rentals = await getActiveRentals();
  return rentals.reduce((sum, r) => sum + r.monthlyRate, 0);
}

export async function getTotalRentalIncomeThisMonth(): Promise<number> {
  const db = await getDB();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const payments = await db.getAll('rentalPayments');
  return payments
    .filter(p => p.date >= startOfMonth && p.date <= endOfMonth)
    .reduce((sum, p) => sum + p.amount, 0);
}
