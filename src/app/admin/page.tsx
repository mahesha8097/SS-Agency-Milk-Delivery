'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import {
  Users,
  CheckCircle,
  Milk,
  Package,
  IndianRupee,
  Truck,
  AlertTriangle,
  UserPlus,
  CreditCard,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboard() {
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const [state, setState] = useState(() => ({
    customers: store.getCustomers(),
    deliveries: store.getDeliveries(new Date().toISOString().split('T')[0]),
    products: store.getProducts(),
    routes: store.getRoutes(),
  }));

  useEffect(() => {
    const date = new Date().toISOString().split('T')[0];
    const update = () => {
      setState({
        customers: store.getCustomers(),
        deliveries: store.getDeliveries(date),
        products: store.getProducts(),
        routes: store.getRoutes(),
      });
    };
    const unsub = store.subscribe(update);
    return () => { unsub(); };
  }, []);


  const activeCustomersCount = state.customers.filter((c) => c.status === 'ACTIVE').length;
  const deliveredTodayCount = state.deliveries.filter((d) => d.status === 'DELIVERED').length;

  const totalMilkLitres = state.deliveries.reduce((sum, d) => sum + d.total_milk_litres, 0);
  const totalCurdPackets = state.deliveries.reduce((sum, d) => sum + d.total_curd_packets, 0);
  const totalProductSales = state.deliveries.reduce((sum, d) => sum + d.product_total, 0);
  const totalDeliveryCharges = state.deliveries.reduce((sum, d) => sum + d.delivery_charge, 0);
  const totalSales = state.deliveries.reduce((sum, d) => sum + d.grand_total, 0);

  const pendingIssues = state.deliveries.filter(
    (d) => d.status === 'DELIVERY_ISSUE' || d.status === 'CUSTOMER_UNAVAILABLE'
  );

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Admin Dashboard</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Today: {todayStr ? new Date(todayStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/customers?add=true"
              className="bg-nandini-blue hover:bg-nandini-dark text-white px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Customer</span>
            </Link>
            <Link
              href="/admin/payments"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </Link>
            <Link
              href="/admin/invoices"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Generate Bills</span>
            </Link>
            <Link
              href="/admin/reports"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Active Customers</span>
              <Users className="w-5 h-5 text-nandini-blue" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{activeCustomersCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Total subscribed houses</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Delivered Today</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
              {deliveredTodayCount} <span className="text-xs text-slate-400 font-normal">/ {activeCustomersCount}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Customers completed</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Milk Delivered</span>
              <Milk className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {totalMilkLitres} <span className="text-xs text-slate-500 font-medium">Litres</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Total milk volume today</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Curd Delivered</span>
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {totalCurdPackets} <span className="text-xs text-slate-500 font-medium">Pkts</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Total curd 1L packets</div>
          </div>
        </div>

        {/* Financial Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Product Sales</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">₹{totalProductSales.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Milk & Curd products</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Delivery Charges</div>
            <div className="text-xl md:text-2xl font-bold text-nandini-accent">₹{totalDeliveryCharges.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Tiered milk litres charges</div>
          </div>

          <div className="bg-nandini-blue text-white p-4 rounded-xl shadow-xs">
            <div className="text-xs font-semibold uppercase text-blue-200 mb-1">Total Sales Today</div>
            <div className="text-2xl md:text-3xl font-black text-white">₹{totalSales.toFixed(2)}</div>
            <div className="text-[11px] text-blue-200 mt-1">Grand total revenue</div>
          </div>
        </div>

        {/* Recent Delivery Issues Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">Pending Delivery Issues / Remarks ({pendingIssues.length})</h3>
            </div>
            <Link href="/admin/deliveries" className="text-xs text-nandini-blue font-semibold hover:underline">
              View All Deliveries →
            </Link>
          </div>

          {pendingIssues.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              No delivery issues reported today. All deliveries running smoothly!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingIssues.map((issue) => {
                const cust = state.customers.find((c) => c.id === issue.customer_id);
                return (
                  <div key={issue.id} className="py-3 flex items-start justify-between text-xs md:text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {cust?.name} ({cust?.house_number}, {cust?.location})
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Status: <span className="font-medium text-amber-600">{issue.status}</span>
                      </div>
                      {issue.remarks && (
                        <div className="text-slate-600 text-xs italic mt-1 bg-slate-50 p-1.5 rounded">
                          "{issue.remarks}"
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{issue.delivery_date}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </Navigation>
  );
}

