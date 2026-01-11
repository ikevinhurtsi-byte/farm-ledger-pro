import { getDB, generateId, FarmSettings } from '@/lib/db';

const DEFAULT_SETTINGS: Omit<FarmSettings, 'updatedAt'> = {
  id: 'main',
  farmName: 'My Farm',
  currency: 'UGX',
  fiscalYearStart: '01-01',
};

export async function getSettings(): Promise<FarmSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  if (!settings) {
    const newSettings: FarmSettings = {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
    await db.add('settings', newSettings);
    return newSettings;
  }
  return settings;
}

export async function updateSettings(data: Partial<FarmSettings>): Promise<FarmSettings> {
  const db = await getDB();
  const existing = await getSettings();
  const updated: FarmSettings = {
    ...existing,
    ...data,
    id: 'main',
    updatedAt: new Date().toISOString(),
  };
  await db.put('settings', updated);
  return updated;
}

export async function exportData(): Promise<string> {
  const db = await getDB();
  const data = {
    transactions: await db.getAll('transactions'),
    employees: await db.getAll('employees'),
    laborEntries: await db.getAll('laborEntries'),
    activities: await db.getAll('activities'),
    activityRecords: await db.getAll('activityRecords'),
    assets: await db.getAll('assets'),
    rentals: await db.getAll('rentals'),
    rentalPayments: await db.getAll('rentalPayments'),
    settings: await db.getAll('settings'),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    const db = await getDB();
    
    // Clear existing data
    await db.clear('transactions');
    await db.clear('employees');
    await db.clear('laborEntries');
    await db.clear('activities');
    await db.clear('activityRecords');
    await db.clear('assets');
    await db.clear('rentals');
    await db.clear('rentalPayments');
    await db.clear('settings');
    
    // Import new data
    for (const item of data.transactions || []) {
      await db.add('transactions', item);
    }
    for (const item of data.employees || []) {
      await db.add('employees', item);
    }
    for (const item of data.laborEntries || []) {
      await db.add('laborEntries', item);
    }
    for (const item of data.activities || []) {
      await db.add('activities', item);
    }
    for (const item of data.activityRecords || []) {
      await db.add('activityRecords', item);
    }
    for (const item of data.assets || []) {
      await db.add('assets', item);
    }
    for (const item of data.rentals || []) {
      await db.add('rentals', item);
    }
    for (const item of data.rentalPayments || []) {
      await db.add('rentalPayments', item);
    }
    for (const item of data.settings || []) {
      await db.add('settings', item);
    }
    
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}
