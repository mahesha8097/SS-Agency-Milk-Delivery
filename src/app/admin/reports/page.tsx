'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import {
  Customer,
  DailyDelivery,
  Payment,
  Expense,
  MonthlyInvoice,
  Product,
  AppUser,
} from '@/lib/types';
import { exportReportToExcel } from '@/lib/excelExporter';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  Printer,
  TrendingUp,
  CreditCard,
  Truck,
  Receipt,
  Users,
  Package,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';

type ReportType =
  | 'OVERVIEW'
  | 'SALES'
  | 'PRODUCTS'
  | 'DELIVERIES'
  | 'CUSTOMERS'
  | 'PAYMENTS'
  | 'PENDING'
  | 'CREDIT'
  | 'EXPENSES'
  | 'DELIVERY_BOYS';

export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('OVERVIEW');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Filters
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'ALL' | 'HOUSE' | 'BULK'>('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'ALL' | 'PREPAID' | 'POSTPAID'>('ALL');
  const [dboyFilter, setDboyFilter] = useState<string>('ALL');

  const [exporting, setExporting] = useState(false);

  // Data collections
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);

  const reloadData = () => {
    setCustomers(store.getCustomers());
    setDeliveries(store.getDeliveries());
    setPayments(store.getPayments());
    setExpenses(store.getExpenses());
    setInvoices(store.getInvoices());
    setProducts(store.getProducts());
    setDeliveryBoys(store.getDeliveryBoys());
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, []);

  const reportTabs: { id: ReportType; label: string; icon: any }[] = [
    { id: 'OVERVIEW', label: '1. Financial Summary', icon: TrendingUp },
    { id: 'SALES', label: '2. Sales & Billing', icon: IndianRupee },
    { id: 'PRODUCTS', label: '3. Product Sales', icon: Package },
    { id: 'DELIVERIES', label: '4. Deliveries', icon: Truck },
    { id: 'CUSTOMERS', label: '5. Customers', icon: Users },
    { id: 'PAYMENTS', label: '6. Collections', icon: CreditCard },
    { id: 'PENDING', label: '7. Pending Dues', icon: IndianRupee },
    { id: 'CREDIT', label: '8. Customer Credit', icon: CreditCard },
    { id: 'EXPENSES', label: '9. Expenses', icon: Receipt },
    { id: 'DELIVERY_BOYS', label: '10. Delivery Boys', icon: Users },
  ];

  // Financial aggregates for Overview
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalCollected = payments.filter((p) => p.status === 'ACTIVE').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.remaining_pending || 0), 0) +
    customers.reduce((sum, c) => sum + (c.opening_pending || 0), 0);
  const totalCredit = customers.reduce((sum, c) => sum + (c.opening_credit || 0), 0);
  const totalExpenses = expenses.filter((e) => e.status === 'ACTIVE').reduce((sum, e) => sum + e.amount, 0);

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      const deliveryItems = deliveries.flatMap((d) => store.getDeliveryItems(d.id));
      await exportReportToExcel({
        reportType: activeReport,
        startDate,
        endDate,
        customers,
        deliveries,
        deliveryItems,
        payments,
        expenses,
        invoices,
        products,
        deliveryBoys,
        shopSettings: store.getShopSettings(),
      });
    } catch (err) {
      console.error('Excel Export Error', err);
      alert('Error generating Excel export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Business Reports & Analytics</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Audit sales, product dispatch volume, collections, pending balances, and expenses with Excel export.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={() => window.print()}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExcelExport}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-sm transition disabled:opacity-60"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Generating...' : 'Export to Excel'}</span>
            </button>
          </div>
        </div>

        {/* 10 Report Tabs Switcher */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-nandini-blue text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Range & Category Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Type</label>
            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="HOUSE">House</option>
              <option value="BULK">Bulk</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Boy</label>
            <select
              value={dboyFilter}
              onChange={(e) => setDboyFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
            >
              <option value="ALL">All Delivery Boys</option>
              {deliveryBoys.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. FINANCIAL SUMMARY REPORT VIEW */}
        {activeReport === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Billed / Sales</span>
                <div className="text-xl font-black text-slate-900 mt-1">₹{totalBilled.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{invoices.length} invoices generated</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount Collected</span>
                <div className="text-xl font-black text-emerald-700 mt-1">₹{totalCollected.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Active payment transactions</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Dues</span>
                <div className="text-xl font-black text-rose-700 mt-1">₹{totalPending.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Unpaid customer balances</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Credit</span>
                <div className="text-xl font-black text-emerald-600 mt-1">₹{totalCredit.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Advance prepaid balances</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expenses</span>
                <div className="text-xl font-black text-amber-700 mt-1">₹{totalExpenses.toFixed(0)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Recorded shop costs</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Financial Ledger Breakdown</h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Actuals Summary
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-800">Total Billed Sales</td>
                      <td className="py-2.5 px-3 text-slate-500">Invoicing</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹{totalBilled.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">Cumulative products + delivery charges billed</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">Payments Collected</td>
                      <td className="py-2.5 px-3 text-slate-500">Cash Flow (In)</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">₹{totalCollected.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">All received payments across cash, UPI, and bank transfer</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-rose-700">Total Pending Dues</td>
                      <td className="py-2.5 px-3 text-slate-500">Receivables</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700">₹{totalPending.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">Total outstanding balance from customers</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">Customer Credit</td>
                      <td className="py-2.5 px-3 text-slate-500">Liabilities</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">₹{totalCredit.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">Customer advance payments and prepaid balances</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-amber-700">Operational Expenses</td>
                      <td className="py-2.5 px-3 text-slate-500">Cash Flow (Out)</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">₹{totalExpenses.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">Delivery boy salaries, vehicle fuel, rent, and supplies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                * Note: This Financial Summary reports operational billing, cash collections, pending receivables, and shop expenses independently.
              </p>
            </div>
          </div>
        )}

        {/* 2. SALES / BILLING REPORT */}
        {activeReport === 'SALES' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Generated Bills Summary</span>
              <span className="text-xs font-bold text-slate-900">{invoices.length} Bills</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Deliveries (₹)</th>
                    <th className="py-3 px-4">Delivery Charges (₹)</th>
                    <th className="py-3 px-4">Grand Total (₹)</th>
                    <th className="py-3 px-4">Payable (₹)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customer_id);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold">{inv.invoice_number}</td>
                        <td className="py-3 px-4">{inv.month_year}</td>
                        <td className="py-3 px-4 font-bold">{cust?.name || 'Customer'}</td>
                        <td className="py-3 px-4">₹{inv.total_product_amount.toFixed(2)}</td>
                        <td className="py-3 px-4">₹{inv.total_delivery_charges.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold">₹{inv.grand_total.toFixed(2)}</td>
                        <td className="py-3 px-4 font-black text-rose-700">₹{(inv.total_payable || inv.amount_payable || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[10px] font-bold">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PRODUCT SALES REPORT */}
        {activeReport === 'PRODUCTS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const totalUnitsDelivered = deliveries
                .filter((d) => d.status === 'DELIVERED')
                .reduce((sum, d) => {
                  const items = store.getDeliveryItems(d.id);
                  const pItem = items.find((i) => i.product_id === p.id);
                  return sum + (pItem ? pItem.packets_count : 0);
                }, 0);

              const revenue = totalUnitsDelivered * p.price;

              return (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-mono text-slate-400 font-bold">{p.product_code}</span>
                  <h4 className="font-bold text-base text-slate-900">{p.name}</h4>
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Volume Dispatched:</span>
                    <strong className="text-slate-900">{totalUnitsDelivered} {p.unit}</strong>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Revenue (₹):</span>
                    <strong className="text-emerald-700 font-black">₹{revenue.toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. COLLECTIONS REPORT */}
        {activeReport === 'PAYMENTS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const cust = customers.find((c) => c.id === p.customer_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold">{p.payment_date}</td>
                        <td className="py-3 px-4 font-bold">{cust?.name} ({cust?.customer_code})</td>
                        <td className="py-3 px-4 font-black text-emerald-700">₹{p.amount.toFixed(2)}</td>
                        <td className="py-3 px-4">{p.payment_method}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.reference_number || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. EXPENSES REPORT */}
        {activeReport === 'EXPENSES' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold">{e.date}</td>
                      <td className="py-3 px-4 font-bold">{e.category_name}</td>
                      <td className="py-3 px-4">{e.paid_to}</td>
                      <td className="py-3 px-4 font-black text-amber-700">₹{e.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">{e.payment_method}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. DELIVERIES, 5. CUSTOMERS, 7. PENDING, 8. CREDIT, 10. DELIVERY BOYS */}
        {['DELIVERIES', 'CUSTOMERS', 'PENDING', 'CREDIT', 'DELIVERY_BOYS'].includes(activeReport) && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Billing Mode</th>
                    <th className="py-3 px-4">Available Credit (₹)</th>
                    <th className="py-3 px-4">Pending Due (₹)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold">{c.name} ({c.customer_code})</td>
                      <td className="py-3 px-4">{c.phone}</td>
                      <td className="py-3 px-4">{c.customer_type}</td>
                      <td className="py-3 px-4">{c.payment_type}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{c.opening_credit.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-rose-700">₹{c.opening_pending.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </Navigation>
  );
}
