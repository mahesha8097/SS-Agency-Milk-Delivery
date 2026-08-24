'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { exportAllDataToExcel } from '@/lib/excelExporter';
import { FileSpreadsheet, Download, Calendar, CheckCircle } from 'lucide-react';

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const customers = store.getCustomers();
      const deliveries = store.getDeliveries();
      const deliveryItems = deliveries.flatMap((d) => store.getDeliveryItems(d.id));
      const payments = store.getPayments();
      const routes = store.getRoutes();
      const products = store.getProducts();
      const users = store.getUsers();

      await exportAllDataToExcel(
        customers,
        deliveries,
        deliveryItems,
        payments,
        routes,
        products,
        users,
        selectedMonth
      );
    } catch (e) {
      console.error('Excel Export Error', e);
      alert('Error exporting Excel workbook');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Excel Export & Business Reports</h2>
          <p className="text-xs md:text-sm text-slate-500">
            Export comprehensive multi-sheet Excel workbooks for accounting, backup, and daily logs
          </p>
        </div>

        {/* Excel Export Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Full Excel Business Workbook</h3>
              <p className="text-xs text-slate-500">
                Contains 5 formatted worksheets: Customers, Daily Deliveries, Monthly Summary, Payments, Routes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sheet 1: All Active Customers</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sheet 2: Daily Delivery Items</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sheet 3: Customer Monthly Summary</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sheet 4: Payments & Advances</span>
            </div>
            <div className="flex items-center space-x-2 sm:col-span-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sheet 5: Routes & Delivery Boy Assignments</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center space-x-2 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Generating Excel...' : 'Download Excel Workbook (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </main>
    </Navigation>
  );
}

