'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import { getUnsyncedCount } from '@/lib/offlineSync';
import { store } from '@/lib/store';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncedMessage, setSyncedMessage] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<{ connected: boolean; lastEvent: any }>({
    connected: false,
    lastEvent: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const updateStatus = async () => {
      setIsOnline(navigator.onLine);
      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
      const rt = store.getRealtimeStatus();
      setRealtimeStatus(rt);
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

  if (isOnline && unsyncedCount === 0 && !syncedMessage && !realtimeStatus.lastEvent) {
    return (
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between shadow-xs border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Supabase Cloud Connected • Live Multi-Device Realtime Active</span>
        </div>
        {realtimeStatus.connected && (
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30">
            ● Realtime Live
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md border-b border-slate-800">
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
            {realtimeStatus.lastEvent && (
              <span className="ml-2 bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded text-[11px] font-mono border border-blue-400/30 animate-pulse">
                ⚡ Live Cloud Update Received ({realtimeStatus.lastEvent.table} {realtimeStatus.lastEvent.eventType})
              </span>
            )}
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
