'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { DailyDelivery, Customer } from '@/lib/types';
import { History, Calendar } from 'lucide-react';

export default function DeliveryBoyHistoryPage() {
  const currentUser = store.getCurrentUser();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const reload = () => {
    if (!currentUser) return;
    setDeliveries(store.getDeliveries(selectedDate).filter((d) => d.delivery_boy_id === currentUser.id));
    setCustomers(store.getCustomersByDeliveryBoy(currentUser.id));
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, [currentUser, selectedDate]);


  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return (
    <Navigation>
      <main className="max-w-3xl w-full mx-auto p-4 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Delivery History</h2>
            <p className="text-xs text-slate-500">View past delivery records for your assigned route</p>
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {deliveries.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-500 text-sm border border-slate-200">
              No delivery records found for {selectedDate}.
            </div>
          ) : (
            deliveries.map((del) => {
              const cust = customerMap.get(del.customer_id);
              const items = store.getDeliveryItems(del.id);
              return (
                <div key={del.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs text-xs md:text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-base">{cust?.name}</div>
                    <span className="font-mono text-xs text-nandini-blue font-bold">{cust?.house_number}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {items.map((it) => (
                      <span key={it.id} className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">
                        {it.product_name}: <b>{it.packets_count}</b>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-600 text-xs">
                    <span>
                      Milk: <b>{del.total_milk_litres}L</b> • Total: <b>₹{del.grand_total}</b>
                    </span>
                    <span className="font-bold text-emerald-700">{del.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </Navigation>
  );
}

