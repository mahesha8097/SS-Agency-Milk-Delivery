'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { getUnsyncedCount } from '@/lib/offlineSync';
import { store } from '@/lib/store';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncedMessage, setSyncedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const updateStatus = async () => {
      setIsOnline(navigator.onLine);
      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    };

    updateStatus();

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      const synced = await store.syncPendingOfflineQueue();
      setSyncing(false);
      if (synced > 0) {
        setSyncedMessage(`Successfully synced ${synced} offline records!`);
        setTimeout(() => setSyncedMessage(null), 4000);
      }
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = store.subscribe(() => {
      updateStatus();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    const count = await store.syncPendingOfflineQueue();
    setSyncing(false);
    if (count > 0) {
      setSyncedMessage(`Synced ${count} offline deliveries!`);
      setTimeout(() => setSyncedMessage(null), 4000);
    }
  };

  if (isOnline && unsyncedCount === 0 && !syncedMessage) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Saved Offline – Waiting for Sync ({unsyncedCount} pending)</span>
          </>
        ) : syncedMessage ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{syncedMessage}</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Online – {unsyncedCount} offline record(s) ready to sync</span>
          </>
        )}
      </div>

      {isOnline && unsyncedCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center space-x-1 bg-nandini-accent hover:bg-blue-600 px-3 py-1 rounded text-white text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
}
