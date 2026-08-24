'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { DailyDelivery, Customer } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export default function DeliveryBoyIssuesPage() {
  const currentUser = store.getCurrentUser();
  const [issues, setIssues] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const reload = () => {
    if (!currentUser) return;
    const date = new Date().toISOString().split('T')[0];
    const userDeliveries = store.getDeliveries(date).filter(
      (d) => d.delivery_boy_id === currentUser.id && (d.status === 'DELIVERY_ISSUE' || d.status === 'CUSTOMER_UNAVAILABLE' || d.status === 'SKIPPED_BY_CUSTOMER')
    );
    setIssues(userDeliveries);
    setCustomers(store.getCustomersByDeliveryBoy(currentUser.id));
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, [currentUser]);


  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return (
    <Navigation>
      <main className="max-w-3xl w-full mx-auto p-4 space-y-4">

        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Delivery Issues & Skips</h2>
          <p className="text-xs text-slate-500">List of customers who skipped, were unavailable, or had delivery issues today</p>
        </div>

        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-500 text-sm border border-slate-200">
              No delivery issues or skips logged today.
            </div>
          ) : (
            issues.map((iss) => {
              const cust = customerMap.get(iss.customer_id);
              return (
                <div key={iss.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-2 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900">{cust?.name} ({cust?.house_number})</div>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{iss.status}</span>
                  </div>
                  {iss.remarks && (
                    <div className="text-slate-600 italic bg-slate-50 p-2 rounded text-xs border border-slate-200">
                      "{iss.remarks}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </Navigation>
  );
}

