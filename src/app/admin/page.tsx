'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import {
  Users,
  CheckCircle2,
  Package,
  IndianRupee,
  Truck,
  AlertTriangle,
  UserPlus,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Receipt,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

export default function AdminDashboard() {
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const [state, setState] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthPrefix = today.slice(0, 7);
    return {
      customers: store.getCustomers(),
      deliveryBoys: store.getDeliveryBoys(),
      deliveries: store.getDeliveries(today),
      allMonthDeliveries: store.getDeliveries().filter((d) => d.delivery_date.startsWith(monthPrefix)),
      products: store.getProducts(),
      payments: store.getPayments(),
      invoices: store.getInvoices(),
      expenses: store.getExpenses(),
    };
  });

  const reloadData = () => {
    const today = todayStr || new Date().toISOString().split('T')[0];
    const monthPrefix = today.slice(0, 7);
    setState({
      customers: store.getCustomers(),
      deliveryBoys: store.getDeliveryBoys(),
      deliveries: store.getDeliveries(today),
      allMonthDeliveries: store.getDeliveries().filter((d) => d.delivery_date.startsWith(monthPrefix)),
      products: store.getProducts(),
      payments: store.getPayments(),
      invoices: store.getInvoices(),
      expenses: store.getExpenses(),
    });
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, [todayStr]);

  const activeCustomers = state.customers.filter((c) => c.status === 'ACTIVE');
  const activeCustomersCount = activeCustomers.length;

  // Delivery Progress Stats
  const deliveredTodayCount = state.deliveries.filter((d) => d.status === 'DELIVERED').length;
  const skippedTodayCount = state.deliveries.filter((d) => d.status.startsWith('SKIPPED') || d.status === 'CUSTOMER_UNAVAILABLE').length;
  const totalAssignedDeliveries = activeCustomersCount;
  const remainingTodayCount = Math.max(0, totalAssignedDeliveries - (deliveredTodayCount + skippedTodayCount));
  const deliveryProgressPercent = totalAssignedDeliveries > 0 ? Math.round((deliveredTodayCount / totalAssignedDeliveries) * 100) : 0;

  // Sales & Collection Stats
  const todayEstimatedSales = state.deliveries.filter((d) => d.status === 'DELIVERED').reduce((sum, d) => sum + d.grand_total, 0);

  const todayCollected = state.payments
    .filter((p) => p.status === 'ACTIVE' && p.payment_date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const monthCollected = state.payments
    .filter((p) => p.status === 'ACTIVE' && p.payment_date.startsWith(todayStr.slice(0, 7)))
    .reduce((sum, p) => sum + p.amount, 0);

  // Total Pending & Credit Balances from generated Invoices & Customers
  const totalCustomerCredit = state.customers.reduce((sum, c) => sum + (c.opening_credit || 0), 0);
  const totalCustomerPending = state.invoices.reduce((sum, inv) => sum + (inv.remaining_pending || 0), 0) +
    state.customers.reduce((sum, c) => sum + (c.opening_pending || 0), 0);

  // Product Quantities Delivered Today
  const totalMilkLitresToday = state.deliveries
    .filter((d) => d.status === 'DELIVERED')
    .reduce((sum, d) => sum + d.total_milk_litres, 0);

  const totalCurdPacketsToday = state.deliveries
    .filter((d) => d.status === 'DELIVERED')
    .reduce((sum, d) => sum + d.total_curd_packets, 0);

  // Alerts
  const recalculationNeededInvoices = state.invoices.filter((inv) => inv.recalculation_required);
  const inactiveDeliveryBoys = state.deliveryBoys.filter((db) => {
    const dbDeliveries = state.deliveries.filter((d) => d.delivery_boy_id === db.id);
    return dbDeliveries.length === 0;
  });

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Dashboard Title & Date */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Admin Overview Dashboard</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Today: {todayStr ? new Date(todayStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/customers"
              className="bg-nandini-blue hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Customer</span>
            </Link>
            <Link
              href="/admin/delivery-boys"
              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Users className="w-4 h-4" />
              <span>+ Add Delivery Boy</span>
            </Link>
            <Link
              href="/admin/invoices"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Generate Bills</span>
            </Link>
            <Link
              href="/admin/payments"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </Link>
            <Link
              href="/admin/expenses"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>+ Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Alerts Banner */}
        {recalculationNeededInvoices.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs md:text-sm text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Bill Recalculation Required: </span>
                <span>{recalculationNeededInvoices.length} bill(s) need review due to recent delivery corrections.</span>
              </div>
            </div>
            <Link
              href="/admin/invoices"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs whitespace-nowrap"
            >
              Review Bills
            </Link>
          </div>
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{activeCustomersCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Door-to-door subscribers</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {deliveredTodayCount} <span className="text-xs text-slate-400 font-semibold">/ {totalAssignedDeliveries}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{remainingTodayCount} pending | {skippedTodayCount} skipped</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{todayEstimatedSales.toFixed(0)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Product + delivery charges</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Amount</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">₹{totalCustomerPending.toFixed(0)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Unpaid customer dues</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Customer Credit</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">₹{totalCustomerCredit.toFixed(0)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Available advance balance</div>
          </div>
        </div>

        {/* Delivery Progress Bar Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-base text-slate-900">Today's Live Delivery Progress</h3>
              <p className="text-xs text-slate-500">Real-time status across all active delivery boys</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold">
              <span className="text-emerald-700">✓ {deliveredTodayCount} Delivered</span>
              <span className="text-amber-600">⏳ {remainingTodayCount} Remaining</span>
              <span className="text-slate-500">✕ {skippedTodayCount} Skipped</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${deliveryProgressPercent}%` }}
              title={`Delivered: ${deliveredTodayCount}`}
            />
            <div
              className="bg-slate-300 h-full transition-all duration-500"
              style={{ width: `${totalAssignedDeliveries > 0 ? (skippedTodayCount / totalAssignedDeliveries) * 100 : 0}%` }}
              title={`Skipped: ${skippedTodayCount}`}
            />
          </div>
        </div>

        {/* 2-Column Grid: Delivery Boys Overview & Product Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Delivery Boy Breakdown */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Delivery Boys Overview</span>
              </div>
              <Link href="/admin/delivery-boys" className="text-xs text-nandini-blue font-bold hover:underline">
                Manage All →
              </Link>
            </div>

            {state.deliveryBoys.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No delivery boys added yet. <Link href="/admin/delivery-boys" className="text-blue-600 font-bold hover:underline">Add your first delivery boy</Link>.
              </div>
            ) : (
              <div className="space-y-2.5">
                {state.deliveryBoys.map((db) => {
                  const assignedCount = state.customers.filter((c) => (c.assigned_delivery_boy_id === db.id || c.delivery_boy_id === db.id) && c.status === 'ACTIVE').length;
                  const deliveredCount = state.deliveries.filter((d) => d.delivery_boy_id === db.id && d.status === 'DELIVERED').length;
                  const remainingCount = Math.max(0, assignedCount - deliveredCount);

                  return (
                    <div key={db.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl flex items-center justify-between transition border border-slate-100">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{db.name}</div>
                        <div className="text-[11px] text-slate-500">{db.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700">
                          {deliveredCount} / {assignedCount} Delivered
                        </div>
                        <div className="text-[11px] text-amber-600 font-medium">{remainingCount} Remaining</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Summary & Quantities */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Today's Product Dispatch Volume</span>
              </div>
              <Link href="/admin/products" className="text-xs text-nandini-blue font-bold hover:underline">
                Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                <div className="text-xs font-bold text-blue-900 uppercase">Milk Volume</div>
                <div className="text-2xl font-black text-nandini-blue mt-1">{totalMilkLitresToday.toFixed(1)} L</div>
                <div className="text-[10px] text-blue-700 mt-0.5">Delivered today</div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                <div className="text-xs font-bold text-emerald-900 uppercase">Curd Packets</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{totalCurdPacketsToday} Pkts</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Delivered today</div>
              </div>
            </div>

            {/* Quick Summary of Collections vs Expenses */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Collected This Month: <strong className="text-slate-900">₹{monthCollected.toFixed(0)}</strong></span>
              <span>Today's Collections: <strong className="text-emerald-700">₹{todayCollected.toFixed(0)}</strong></span>
            </div>
          </div>

        </div>

      </main>
    </Navigation>
  );
}
