// Offline Synchronization Engine for S.S Agency Milk Delivery
import Dexie, { Table } from 'dexie';
import { DailyDelivery, DeliveryItem } from './types';

export interface OfflineDeliveryPayload {
  idempotencyKey: string;
  delivery: DailyDelivery;
  items: DeliveryItem[];
  queuedAt: string;
  synced: boolean;
  syncAttempts: number;
  lastError?: string;
}

class OfflineDatabase extends Dexie {
  deliveryQueue!: Table<OfflineDeliveryPayload, string>;

  constructor() {
    super('SSAgencyOfflineDB');
    this.version(1).stores({
      deliveryQueue: 'idempotencyKey, queuedAt, synced, [delivery.customer_id+delivery.delivery_date]',
    });
  }
}

export const offlineDB = new OfflineDatabase();

/**
 * Enqueues a daily delivery record into local IndexedDB for offline resilience.
 */
export async function queueOfflineDelivery(
  delivery: DailyDelivery,
  items: DeliveryItem[]
): Promise<OfflineDeliveryPayload> {
  const payload: OfflineDeliveryPayload = {
    idempotencyKey: delivery.idempotency_key,
    delivery,
    items,
    queuedAt: new Date().toISOString(),
    synced: false,
    syncAttempts: 0,
  };

  await offlineDB.deliveryQueue.put(payload);
  return payload;
}

/**
 * Retrieves all pending offline deliveries.
 */
export async function getPendingOfflineDeliveries(): Promise<OfflineDeliveryPayload[]> {
  return await offlineDB.deliveryQueue.where('synced').equals(0).toArray();
}

/**
 * Marks a queued delivery as successfully synced.
 */
export async function markDeliverySynced(idempotencyKey: string): Promise<void> {
  await offlineDB.deliveryQueue.update(idempotencyKey, {
    synced: true,
  });
}

/**
 * Returns count of unsynced offline records.
 */
export async function getUnsyncedCount(): Promise<number> {
  return await offlineDB.deliveryQueue.where('synced').equals(0).count();
}
