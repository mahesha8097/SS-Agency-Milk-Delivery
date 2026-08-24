'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { DailyDelivery, Customer, Route, AppUser } from '@/lib/types';
import { Calendar, Filter, Milk, Package, IndianRupee, Truck } from 'lucide-react';

export default function AdminDeliveriesPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [routeFilter, setRouteFilter] = useState<string>('');
  const [dboyFilter, setDboyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);

  const reloadData = () => {
    setDeliveries(store.getDeliveries(selectedDate));
    setCustomers(store.getCustomers());
    setRoutes(store.getRoutes());
    setDeliveryBoys(store.getDeliveryBoys());
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => { unsub(); };
  }, [selectedDate]);


  const filteredDeliveries = deliveries.filter((d) => {
    if (routeFilter && d.route_id !== routeFilter) return false;
    if (dboyFilter && d.delivery_boy_id !== dboyFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  const totalCustomers = filteredDeliveries.length;
  const totalMilkLitres = filteredDeliveries.reduce((sum, d) => sum + d.total_milk_litres, 0);
  const totalCurdPackets = filteredDeliveries.reduce((sum, d) => sum + d.total_curd_packets, 0);
  const totalProductAmount = filteredDeliveries.reduce((sum, d) => sum + d.product_total, 0);
  const totalDeliveryCharges = filteredDeliveries.reduce((sum, d) => sum + d.delivery_charge, 0);
  const grandTotalSales = filteredDeliveries.reduce((sum, d) => sum + d.grand_total, 0);

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const userMap = new Map(deliveryBoys.map((u) => [u.id, u.name]));
  const routeMap = new Map(routes.map((r) => [r.id, r.name]));

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Daily Delivery Records</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Complete daily delivery logs, milk volumes, delivery charges, and packet counts
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Filter by Route</label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Routes ({routes.length})</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Filter by Delivery Boy</label>
            <select
              value={dboyFilter}
              onChange={(e) => setDboyFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Delivery Boys ({deliveryBoys.length})</option>
              {deliveryBoys.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Statuses</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="SKIPPED_BY_CUSTOMER">SKIPPED BY CUSTOMER</option>
              <option value="CUSTOMER_UNAVAILABLE">CUSTOMER UNAVAILABLE</option>
              <option value="DELIVERY_ISSUE">DELIVERY ISSUE</option>
            </select>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Deliveries</div>
            <div className="text-xl font-bold text-slate-900">{totalCustomers}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Milk</div>
            <div className="text-xl font-bold text-nandini-blue">{totalMilkLitres} L</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Curd</div>
            <div className="text-xl font-bold text-amber-600">{totalCurdPackets} Pkts</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Product Amount</div>
            <div className="text-xl font-bold text-slate-800">₹{totalProductAmount}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Delivery Charge</div>
            <div className="text-xl font-bold text-nandini-accent">₹{totalDeliveryCharges}</div>
          </div>
          <div className="bg-nandini-blue text-white p-3 rounded-lg text-center">
            <div className="text-[11px] font-semibold text-blue-200 uppercase">Grand Total</div>
            <div className="text-xl font-black text-white">₹{grandTotalSales}</div>
          </div>
        </div>

        {/* Delivery Records Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">House / Location</th>
                  <th className="p-3">Delivery Boy</th>
                  <th className="p-3">Delivered Products</th>
                  <th className="p-3 text-center">Milk Litres</th>
                  <th className="p-3 text-right">Product Total</th>
                  <th className="p-3 text-right">Del. Charge</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No delivery records found for selected date and filters.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((del) => {
                    const cust = customerMap.get(del.customer_id);
                    const items = store.getDeliveryItems(del.id);
                    return (
                      <tr key={del.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{cust?.name}</div>
                          <div className="text-[11px] font-mono text-nandini-blue">{cust?.customer_code}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{cust?.house_number}</div>
                          <div className="text-xs text-slate-500">{cust?.location}</div>
                        </td>
                        <td className="p-3 text-slate-600">{userMap.get(del.delivery_boy_id) || 'N/A'}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {items.map((it) => (
                              <span key={it.id} className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                                {it.product_name}: <b>{it.packets_count}</b>
                              </span>
                            ))}
                          </div>
                          {del.remarks && <div className="text-[11px] text-amber-700 italic mt-0.5">{del.remarks}</div>}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">{del.total_milk_litres} L</td>
                        <td className="p-3 text-right font-medium text-slate-800">₹{del.product_total}</td>
                        <td className="p-3 text-right font-medium text-nandini-accent">₹{del.delivery_charge}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{del.grand_total}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              del.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : del.status === 'SKIPPED_BY_CUSTOMER'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {del.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </Navigation>
  );
}

