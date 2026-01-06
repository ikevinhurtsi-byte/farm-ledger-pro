import { getDB, generateId, LaborEntry } from '@/lib/db';

export async function getAllLaborEntries(): Promise<LaborEntry[]> {
  const db = await getDB();
  return db.getAll('laborEntries');
}

export async function getLaborEntriesByDate(date: string): Promise<LaborEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('laborEntries', 'by-date', date);
}

export async function getLaborEntriesByDateRange(startDate: string, endDate: string): Promise<LaborEntry[]> {
  const db = await getDB();
  const all = await db.getAll('laborEntries');
  return all.filter(e => e.date >= startDate && e.date <= endDate);
}

export async function getLaborEntriesByEmployee(employeeId: string): Promise<LaborEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('laborEntries', 'by-employee', employeeId);
}

export async function addLaborEntry(data: Omit<LaborEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LaborEntry> {
  const db = await getDB();
  const now = new Date().toISOString();
  const entry: LaborEntry = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('laborEntries', entry);
  return entry;
}

export async function updateLaborEntry(id: string, data: Partial<LaborEntry>): Promise<LaborEntry | null> {
  const db = await getDB();
  const existing = await db.get('laborEntries', id);
  if (!existing) return null;
  
  const updated: LaborEntry = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('laborEntries', updated);
  return updated;
}

export async function deleteLaborEntry(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('laborEntries', id);
  return true;
}

export async function getLaborCostByActivity(activityId: string): Promise<number> {
  const entries = await getAllLaborEntries();
  return entries
    .filter(e => e.activityId === activityId)
    .reduce((sum, e) => sum + e.amount, 0);
}

export async function getTotalLaborCost(startDate: string, endDate: string): Promise<number> {
  const entries = await getLaborEntriesByDateRange(startDate, endDate);
  return entries.reduce((sum, e) => sum + e.amount, 0);
}
