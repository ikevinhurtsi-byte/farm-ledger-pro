import { getDB, generateId, Employee } from '@/lib/db';

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDB();
  return db.getAll('employees');
}

export async function getActiveEmployees(): Promise<Employee[]> {
  const db = await getDB();
  return db.getAllFromIndex('employees', 'by-status', 'active');
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  const db = await getDB();
  return db.get('employees', id);
}

export async function addEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
  const db = await getDB();
  const now = new Date().toISOString();
  const employee: Employee = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('employees', employee);
  return employee;
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | null> {
  const db = await getDB();
  const existing = await db.get('employees', id);
  if (!existing) return null;
  
  const updated: Employee = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('employees', updated);
  return updated;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('employees', id);
  return true;
}
