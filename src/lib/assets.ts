import { getDB, generateId, Asset } from '@/lib/db';

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDB();
  return db.getAll('assets');
}

export async function getActiveAssets(): Promise<Asset[]> {
  const db = await getDB();
  return db.getAllFromIndex('assets', 'by-status', 'active');
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  const db = await getDB();
  return db.get('assets', id);
}

export async function addAsset(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
  const db = await getDB();
  const now = new Date().toISOString();
  const asset: Asset = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('assets', asset);
  return asset;
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset | null> {
  const db = await getDB();
  const existing = await db.get('assets', id);
  if (!existing) return null;
  
  const updated: Asset = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('assets', updated);
  return updated;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('assets', id);
  return true;
}

export function calculateDepreciation(asset: Asset): number {
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (asset.depreciationMethod === 'straight-line') {
    const annualDepreciation = asset.purchasePrice / asset.usefulLife;
    const totalDepreciation = annualDepreciation * Math.min(yearsOwned, asset.usefulLife);
    return Math.max(0, asset.purchasePrice - totalDepreciation);
  } else {
    // Declining balance method
    const rate = asset.depreciationRate / 100;
    return asset.purchasePrice * Math.pow(1 - rate, yearsOwned);
  }
}

export function getMonthlyDepreciation(asset: Asset): number {
  if (asset.depreciationMethod === 'straight-line') {
    return (asset.purchasePrice / asset.usefulLife) / 12;
  } else {
    const rate = asset.depreciationRate / 100;
    return (asset.currentValue * rate) / 12;
  }
}

export async function getTotalAssetValue(): Promise<number> {
  const assets = await getActiveAssets();
  return assets.reduce((sum, a) => sum + a.currentValue, 0);
}

export async function getTotalDepreciationThisMonth(): Promise<number> {
  const assets = await getActiveAssets();
  return assets.reduce((sum, a) => sum + getMonthlyDepreciation(a), 0);
}
