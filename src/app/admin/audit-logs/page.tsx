'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { AuditLog } from '@/lib/types';
import { History, Shield, Info } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const reload = () => setLogs(store.getAuditLogs());

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);


  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Audit Logs & History</h2>
          <p className="text-xs md:text-sm text-slate-500">
            Immutable log of critical system operations: price updates, customer edits, delivery records, and billing
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{log.user_name || 'System'}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-nandini-blue border border-blue-200 px-2 py-0.5 rounded font-mono text-xs font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{log.entity_type}</td>
                      <td className="p-3 text-xs font-mono text-slate-600">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </Navigation>
  );
}

