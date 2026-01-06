import { getDB, generateId, Activity, ActivityRecord } from '@/lib/db';

export async function getAllActivities(): Promise<Activity[]> {
  const db = await getDB();
  return db.getAll('activities');
}

export async function getActiveActivities(): Promise<Activity[]> {
  const db = await getDB();
  return db.getAllFromIndex('activities', 'by-status', 'active');
}

export async function getActivity(id: string): Promise<Activity | undefined> {
  const db = await getDB();
  return db.get('activities', id);
}

export async function addActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
  const db = await getDB();
  const now = new Date().toISOString();
  const activity: Activity = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('activities', activity);
  return activity;
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity | null> {
  const db = await getDB();
  const existing = await db.get('activities', id);
  if (!existing) return null;
  
  const updated: Activity = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('activities', updated);
  return updated;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('activities', id);
  return true;
}

// Activity Records
export async function getAllActivityRecords(): Promise<ActivityRecord[]> {
  const db = await getDB();
  return db.getAll('activityRecords');
}

export async function getActivityRecordsByActivity(activityId: string): Promise<ActivityRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('activityRecords', 'by-activity', activityId);
}

export async function addActivityRecord(data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityRecord> {
  const db = await getDB();
  const now = new Date().toISOString();
  const record: ActivityRecord = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('activityRecords', record);
  return record;
}

export async function updateActivityRecord(id: string, data: Partial<ActivityRecord>): Promise<ActivityRecord | null> {
  const db = await getDB();
  const existing = await db.get('activityRecords', id);
  if (!existing) return null;
  
  const updated: ActivityRecord = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('activityRecords', updated);
  return updated;
}

export async function deleteActivityRecord(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('activityRecords', id);
  return true;
}

export async function getActivityProfitability(activityId: string): Promise<{ income: number; expenses: number; profit: number }> {
  const records = await getActivityRecordsByActivity(activityId);
  const income = records.reduce((sum, r) => sum + (r.income || 0), 0);
  const expenses = records.reduce((sum, r) => sum + (r.expense || 0), 0);
  return { income, expenses, profit: income - expenses };
}
