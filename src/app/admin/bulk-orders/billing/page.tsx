'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { MonthlyInvoice, Customer, AgencyProfile } from '@/lib/types';
import {
  Building2,
  Calendar,
  Printer,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  Receipt,
  Milk,
} from 'lucide-react';
import Link from 'next/link';

function numberToWords(num: number): string {
  if (!num || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const n = Math.floor(num);
  let str = '';
  
  if (n >= 100000) {
    str += a[Math.floor(n / 100000)] + ' Lakh ';
  }
  if (Math.floor((n % 100000) / 1000) > 0) {
    const k = Math.floor((n % 100000) / 1000);
    str += (k < 20 ? a[k] : b[Math.floor(k / 10)] + ' ' + a[k % 10]) + ' Thousand ';
  }
  if (Math.floor((n % 1000) / 100) > 0) {
    str += a[Math.floor((n % 1000) / 100)] + ' Hundred ';
  }
  if (n % 100 > 0) {
    const rem = n % 100;
    str += (rem < 20 ? a[rem] : b[Math.floor(rem / 10)] + ' ' + a[rem % 10]) + ' ';
  }
  return str.trim() + ' Rupees Only';
}

export default function AdminBulkOrdersBillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [bulkCustomers, setBulkCustomers] = useState<Customer[]>([]);
  const [viewInvoice, setViewInvoice] = useState<MonthlyInvoice | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [paymentQRImage, setPaymentQRImage] = useState<string | null>(null);
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile | null>(null);

  const reload = () => {
    const allCusts = store.getCustomers();
    const bulkCusts = allCusts.filter(
      (c) => c.customer_category === 'BULK_ORDER' || c.is_bulk_order
    );
    setBulkCustomers(bulkCusts);

    const keySuffix =
      billingPeriod === 'WEEKLY'
        ? `${selectedMonth}-W${selectedWeek}`
        : selectedMonth;

    const allInvoices = store.getInvoices(keySuffix);
    const bulkInvList = allInvoices.filter((inv) =>
      bulkCusts.some((bc) => bc.id === inv.customer_id)
    );
    setInvoices(bulkInvList);
    setSignatureImage(store.getSignatureImage());
    setPaymentQRImage(store.getPaymentQR());
    setAgencyProfile(store.getAgencyProfile());
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => {
      unsub();
    };
  }, [selectedMonth, selectedWeek, billingPeriod]);

  const handleGenerateBulkBills = () => {
    const generated = store.generateBulkBills(
      billingPeriod,
      selectedMonth,
      selectedWeek
    );
    alert(
      `Successfully generated ${generated.length} bulk ${
        billingPeriod === 'WEEKLY' ? `Week ${selectedWeek}` : 'Monthly'
      } invoices!`
    );
    reload();
  };

  const customerMap = new Map(bulkCustomers.map((c) => [c.id, c]));

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalAdvances = invoices.reduce((sum, inv) => sum + inv.advance_paid, 0);
  const totalPayable = invoices.reduce((sum, inv) => sum + inv.amount_payable, 0);

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Global Print Styles for Single Page Printing */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 4mm;
            }
            body {
              background: white !important;
              color: black !important;
              font-size: 11px !important;
            }
            nav, header, button, .no-print {
              display: none !important;
            }
            .printable-invoice {
              border: 1px solid #000 !important;
              padding: 0 !important;
              box-shadow: none !important;
              width: 100% !important;
              max-height: 98vh !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            .fixed {
              position: static !important;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-nandini-blue font-bold text-xs uppercase tracking-wider">
              <Receipt className="w-4 h-4" />
              <span>Bulk Order Billing Dashboard</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Hotels, Restaurants & Institutional Invoices
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Generate <b>Weekly</b> or <b>Monthly</b> bills for commercial bulk order accounts with <b>₹0 Delivery Charges</b>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/bulk-orders"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Bulk Accounts</span>
            </Link>
          </div>
        </div>

        {/* Billing Cycle Controls Box */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Billing Period Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Billing Cycle
              </label>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('WEEKLY')}
                  className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                    billingPeriod === 'WEEKLY'
                      ? 'bg-nandini-blue text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Weekly Billing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('MONTHLY')}
                  className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                    billingPeriod === 'MONTHLY'
                      ? 'bg-nandini-blue text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Monthly Billing</span>
                </button>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              {billingPeriod === 'WEEKLY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Week
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  >
                    <option value={1}>Week 1 (Day 1 - 7)</option>
                    <option value={2}>Week 2 (Day 8 - 14)</option>
                    <option value={3}>Week 3 (Day 15 - 21)</option>
                    <option value={4}>Week 4 (Day 22 - End)</option>
                  </select>
                </div>
              )}

              <div className="self-end pt-1">
                <button
                  onClick={handleGenerateBulkBills}
                  className="bg-nandini-blue hover:bg-nandini-dark text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-sm transition active:scale-[0.99]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    Generate Bulk {billingPeriod === 'WEEKLY' ? `Week ${selectedWeek}` : 'Monthly'} Bills
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Targeting <b>{bulkCustomers.length} Active Hotel / Bulk Accounts</b>. All deliveries are calculated with <b>₹0 Delivery Charges</b>.
            </span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Total {billingPeriod === 'WEEKLY' ? `Week ${selectedWeek}` : 'Monthly'} Billing
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">{invoices.length} bulk order statements</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Payments Credited</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹{totalAdvances.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Prepaid & weekly credits applied</div>
          </div>

          <div className="bg-nandini-blue text-white p-4 rounded-xl shadow-xs">
            <div className="text-xs font-semibold text-blue-200 uppercase">Net Amount Payable</div>
            <div className="text-2xl font-black text-white mt-1">₹{totalPayable.toFixed(2)}</div>
            <div className="text-xs text-blue-200 mt-0.5">To be collected</div>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
            <span>Generated Bulk Invoices ({invoices.length})</span>
            <span className="text-slate-500 font-normal text-[11px]">
              Cycle: {billingPeriod === 'WEEKLY' ? `Week ${selectedWeek} (${selectedMonth})` : selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Invoice No.</th>
                  <th className="p-3">Hotel / Establishment</th>
                  <th className="p-3 text-center">Period</th>
                  <th className="p-3 text-right">Product Total</th>
                  <th className="p-3 text-right">Del. Charges</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Paid / Credit</th>
                  <th className="p-3 text-right">Net Payable</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No bulk invoices generated yet for this cycle. Select your cycle above and click <b>Generate Bulk Bills</b>.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const cust = customerMap.get(inv.customer_id);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-nandini-blue">{inv.invoice_number}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{cust?.name || 'Hotel / Restaurant'}</div>
                          <div className="text-[11px] text-slate-500">
                            <span className="font-semibold text-amber-800">{cust?.establishment_type || 'Bulk Order'}</span> • {cust?.location}
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium text-slate-700">
                          {inv.period_label || (inv.billing_period === 'WEEKLY' ? `Week ${selectedWeek}` : inv.month_year)}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800">₹{inv.total_product_amount}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">₹0 (Free)</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{inv.grand_total}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">₹{inv.advance_paid}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">₹{inv.amount_payable}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Invoice View & Single Sheet Print Modal */}
        {viewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-4 space-y-3 max-h-[96vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 no-print">
                <h3 className="font-bold text-slate-900 text-base">Bulk Tax Invoice Preview (1 Sheet Print)</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Bill (1 Sheet)</span>
                  </button>
                  <button onClick={() => setViewInvoice(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Boxed Tax Invoice Container */}
              <div className="printable-invoice border-2 border-slate-900 rounded-none bg-white text-slate-900 text-xs font-sans">
                {/* Top Header Title */}
                <div className="text-center font-bold uppercase tracking-wider py-1 border-b border-slate-900 bg-slate-50 text-xs">
                  Tax Invoice — Commercial Bulk Order
                </div>

                {/* Main Header Grid */}
                <div className="grid grid-cols-12 border-b border-slate-900">
                  {/* Agency Details Left */}
                  <div className="col-span-8 p-3 flex items-start space-x-3 border-r border-slate-900">
                    <div className="w-16 h-16 shrink-0 rounded-full border border-nandini-blue flex items-center justify-center bg-blue-50 overflow-hidden">
                      {agencyProfile?.logo_url ? (
                        <img src={agencyProfile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Milk className="w-7 h-7 text-nandini-blue mx-auto" />
                          <span className="text-[8px] font-black text-nandini-blue block uppercase">Nandini</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px] leading-tight">
                      <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                        {agencyProfile?.business_name || 'NANDINI MILK PARLOUR'}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-700 uppercase">
                        {agencyProfile?.address || 'SHOP NO.1,37/A, HCS GALLERIA COMPLEX, KOTE, BANGALORE RURAL DIST.'}
                      </p>
                      <p className="text-[10px] text-slate-700">
                        Phone: <b className="font-mono">{agencyProfile?.phone || '7022754524'}</b> | Email: <b>{agencyProfile?.email || 'maheshgultedar545@gmail.com'}</b>
                      </p>
                      <p className="text-[10px] text-slate-800 font-bold">
                        GSTIN: <span className="font-mono">{agencyProfile?.gstin || '29FBWPD7245C1ZA'}</span> | State: {agencyProfile?.state ? `29-${agencyProfile.state}` : '29-Karnataka'}
                      </p>
                    </div>
                  </div>

                  {/* Invoice Meta Right */}
                  <div className="col-span-4 p-3 text-xs space-y-1 font-medium bg-slate-50/50">
                    <div>Invoice No.: <b className="font-mono text-nandini-blue">{viewInvoice.invoice_number}</b></div>
                    <div>Period: <b>{viewInvoice.period_label || viewInvoice.month_year}</b></div>
                    <div>Date: <b>{new Date(viewInvoice.generated_at).toLocaleDateString('en-IN')}</b></div>
                  </div>
                </div>

                {/* Bill To & Transportation Details Grid */}
                <div className="grid grid-cols-12 border-b border-slate-900 text-xs">
                  <div className="col-span-8 p-2.5 border-r border-slate-900 space-y-0.5">
                    <div className="font-bold uppercase text-[10px] text-slate-600">Bill To:</div>
                    <div className="font-black text-sm text-slate-900">{customerMap.get(viewInvoice.customer_id)?.name}</div>
                    <div>Establishment Type: <b className="text-amber-800">{customerMap.get(viewInvoice.customer_id)?.establishment_type || 'Bulk Account'}</b></div>
                    <div>Contact No: <b className="font-mono">{customerMap.get(viewInvoice.customer_id)?.phone}</b></div>
                    <div>Premises & Area: {customerMap.get(viewInvoice.customer_id)?.house_number}, {customerMap.get(viewInvoice.customer_id)?.location}</div>
                  </div>

                  <div className="col-span-4 p-2.5 space-y-0.5 bg-slate-50/30">
                    <div className="font-bold uppercase text-[10px] text-slate-600">Transportation Details:</div>
                    <div>Transport Name: <b>Bulk Order Delivery</b></div>
                    <div>Delivery Charges: <b className="text-emerald-700">Rs 0.00 (Free)</b></div>
                  </div>
                </div>

                {/* Delivered Product Breakdown Table & Summary Section */}
                {(() => {
                  const modalDeliveries = store
                    .getDeliveries(undefined, viewInvoice.customer_id)
                    .filter((d) => {
                      if (viewInvoice.date_start && viewInvoice.date_end) {
                        return d.delivery_date >= viewInvoice.date_start && d.delivery_date <= viewInvoice.date_end;
                      }
                      return d.delivery_date.startsWith(viewInvoice.month_year);
                    });

                  const modalItems = modalDeliveries
                    .flatMap((d) => store.getDeliveryItems(d.id))
                    .reduce((acc, item) => {
                      const existing = acc.find((i) => i.product_name === item.product_name);
                      if (existing) {
                        existing.packets_count += item.packets_count;
                        existing.total_amount += item.total_amount;
                      } else {
                        acc.push({ ...item });
                      }
                      return acc;
                    }, [] as any[]);

                  const modalTotalPackets = modalItems.reduce((sum, i) => sum + i.packets_count, 0);
                  const modalProductTotal = Math.round(modalItems.reduce((sum, i) => sum + i.total_amount, 0) * 100) / 100;
                  const modalDeliveryCharges = 0; // Bulk orders have free delivery
                  const modalGrandTotal = Math.round((modalProductTotal + modalDeliveryCharges) * 100) / 100;
                  const modalAdvancePaid = viewInvoice.advance_paid;
                  const modalAmountPayable = Math.round((modalGrandTotal - modalAdvancePaid - viewInvoice.previous_balance_credit) * 100) / 100;

                  return (
                    <>
                      <div className="border-b border-slate-900 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-100 font-bold uppercase text-[10px] text-slate-800">
                              <th className="p-1.5 border-r border-slate-900 text-center w-8">#</th>
                              <th className="p-1.5 border-r border-slate-900">Item name</th>
                              <th className="p-1.5 border-r border-slate-900 text-center w-16">Quantity</th>
                              <th className="p-1.5 border-r border-slate-900 text-center w-14">Unit</th>
                              <th className="p-1.5 border-r border-slate-900 text-right w-16">MRP(Rs)</th>
                              <th className="p-1.5 border-r border-slate-900 text-right w-16">Price(Rs)</th>
                              <th className="p-1.5 border-r border-slate-900 text-right w-20">GST(Rs)</th>
                              <th className="p-1.5 text-right w-20">Amount(Rs)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300">
                            {modalItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1.5 border-r border-slate-900 text-center font-bold">{idx + 1}</td>
                                <td className="p-1.5 border-r border-slate-900 font-semibold">{item.product_name}</td>
                                <td className="p-1.5 border-r border-slate-900 text-center font-bold">{item.packets_count}</td>
                                <td className="p-1.5 border-r border-slate-900 text-center text-slate-600">Pkt/Ltr</td>
                                <td className="p-1.5 border-r border-slate-900 text-right">Rs {item.price_per_unit.toFixed(2)}</td>
                                <td className="p-1.5 border-r border-slate-900 text-right">Rs {item.price_per_unit.toFixed(2)}</td>
                                <td className="p-1.5 border-r border-slate-900 text-right text-slate-600">Rs 0.00 (0%)</td>
                                <td className="p-1.5 text-right font-bold">Rs {item.total_amount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="border-t border-slate-900 bg-slate-100 font-bold">
                              <td colSpan={2} className="p-1.5 border-r border-slate-900 text-right uppercase">Total</td>
                              <td className="p-1.5 border-r border-slate-900 text-center font-black">
                                {modalTotalPackets}
                              </td>
                              <td colSpan={4} className="p-1.5 border-r border-slate-900 text-right">Rs 0.00</td>
                              <td className="p-1.5 text-right font-black text-slate-900">Rs {modalGrandTotal.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary & Financial Grid */}
                      <div className="border-b border-slate-900 text-[11px] leading-snug">
                        <div className="grid grid-cols-12 border-b border-slate-300 p-1.5 bg-slate-50">
                          <div className="col-span-3 font-semibold">Sub Total: <b>Rs {modalProductTotal.toFixed(2)}</b></div>
                          <div className="col-span-3 font-semibold">Round Off: <b>- Rs 0.00</b></div>
                          <div className="col-span-6 text-right font-black text-slate-900">
                            Total: Rs {modalGrandTotal.toFixed(2)} ({numberToWords(modalGrandTotal)})
                          </div>
                        </div>

                        <div className="grid grid-cols-12 p-1.5 font-medium">
                          <div className="col-span-3">Received: <b className="text-emerald-700">Rs {modalAdvancePaid.toFixed(2)}</b></div>
                          <div className="col-span-3">Balance: <b className="text-slate-900">Rs {modalAmountPayable.toFixed(2)}</b></div>
                          <div className="col-span-3">Previous Balance: <b>Rs {viewInvoice.previous_balance_credit.toFixed(2)}</b></div>
                          <div className="col-span-3 text-right">Current Balance: <b className="text-nandini-blue">Rs {modalAmountPayable.toFixed(2)}</b></div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* QR Code & Signature Section */}
                <div className="grid grid-cols-12 border-b border-slate-900 p-2.5 items-center">
                  {/* Left: UPI QR Code */}
                  <div className="col-span-6 flex items-center space-x-3">
                    {paymentQRImage ? (
                      <div className="text-center shrink-0">
                        <img src={paymentQRImage} alt="Payment UPI QR Code" className="w-20 h-20 border border-slate-300 p-1 rounded bg-white mx-auto object-contain" />
                        <div className="text-[9px] font-black text-slate-700 uppercase mt-0.5">UPI SCAN TO PAY</div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-1 text-center text-slate-400 text-[9px] shrink-0">
                        <span>[ QR Code ]</span>
                        <span className="text-[8px]">Upload in Profile</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      <div className="font-bold text-slate-800 uppercase">Payment Modes</div>
                      <div>• Scan & Pay via GPay / PhonePe / Paytm</div>
                      <div>• Cash / Weekly Direct Bank Transfer</div>
                    </div>
                  </div>

                  {/* Right: Signature Box */}
                  <div className="col-span-6 text-right space-y-1">
                    {signatureImage ? (
                      <img src={signatureImage} alt="Authorized Signature" className="h-12 w-auto max-w-[150px] ml-auto object-contain" />
                    ) : (
                      <div className="h-10 border-b border-dashed border-slate-400 w-36 ml-auto flex items-center justify-center text-[9px] text-slate-400">
                        [ Signature Placeholder ]
                      </div>
                    )}
                    <div className="text-[11px] font-bold text-slate-900 border-t border-slate-900 pt-0.5 inline-block px-4">
                      Authorized Signatory
                    </div>
                    <div className="text-[10px] text-slate-600">{agencyProfile?.business_name || 'S.S Agency'}</div>
                  </div>
                </div>

                {/* Terms & Conditions Footer */}
                <div className="p-2 bg-slate-50 text-[9px] text-slate-600 leading-tight space-y-0.5">
                  <div className="font-bold uppercase text-slate-800">Terms & Conditions:</div>
                  <div>GOODS ONCE SOLD CANNOT BE RETURNED BACK</div>
                  <div>- MONDAY TO SATURDAY - 9:30 AM - 5:30 PM & SUNDAY - HOLIDAY - THANKS FOR DOING BUSINESS WITH US!</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
