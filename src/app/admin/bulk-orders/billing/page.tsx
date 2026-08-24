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
  Upload,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Filter,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

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

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSignatureImage(base64);
        store.setSignatureImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    store.setSignatureImage(null);
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
              margin: 6mm;
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
              border: none !important;
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-3 max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 no-print">
                <h3 className="font-bold text-slate-900 text-base">Bulk Invoice Preview (1 Sheet Print)</h3>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5 text-nandini-blue" />
                    <span>Upload Signature</span>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>

                  {signatureImage && (
                    <button
                      onClick={handleRemoveSignature}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Signature</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrintInvoice}
                    className="bg-nandini-blue text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill (1 Sheet)</span>
                  </button>
                  <button onClick={() => setViewInvoice(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container (Fits 1 Sheet) */}
              <div className="printable-invoice p-5 border border-slate-300 rounded-lg space-y-3 text-xs bg-white text-slate-900">
                {/* Invoice Header displaying strictly configured profile details */}
                <div className="text-center border-b border-slate-300 pb-3 space-y-0.5">
                  <h1 className="text-xl font-black tracking-tight text-nandini-blue uppercase">
                    {agencyProfile?.business_name || 'NANDINI MILK PARLOUR'}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {agencyProfile?.business_type || 'Distributor'} — COMMERCIAL BULK SUPPLY STATEMENT
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {agencyProfile?.address || 'Nandini Milk Parlour, Seegehalli, Bangalore - 560067'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ph: {agencyProfile?.phone || '7022754524'} | Email: {agencyProfile?.email || 'maheshgultedar545@gmail.com'}
                    {agencyProfile?.gstin ? ` | GSTIN: ${agencyProfile.gstin}` : ''}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase text-[9px]">Bulk Establishment Details</div>
                    <div className="font-bold text-sm text-slate-900">{customerMap.get(viewInvoice.customer_id)?.name}</div>
                    <div>Type: <b>{customerMap.get(viewInvoice.customer_id)?.establishment_type || 'Bulk Account'}</b></div>
                    <div>Premises: {customerMap.get(viewInvoice.customer_id)?.house_number}</div>
                    <div>Location: {customerMap.get(viewInvoice.customer_id)?.location}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-500 font-semibold uppercase text-[9px]">Invoice Info</div>
                    <div className="font-mono font-bold text-nandini-blue">{viewInvoice.invoice_number}</div>
                    <div>Period: <b>{viewInvoice.period_label || viewInvoice.month_year}</b></div>
                    <div>Generated: {new Date(viewInvoice.generated_at).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                {/* Delivered Line Items Table */}
                <div>
                  <div className="font-bold text-[11px] uppercase text-slate-700 mb-1">Delivered Product Breakdown</div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100 font-bold">
                        <th className="py-1 px-2">Product</th>
                        <th className="py-1 px-2 text-center">Packets</th>
                        <th className="py-1 px-2 text-right">Rate</th>
                        <th className="py-1 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {store
                        .getDeliveries(undefined, viewInvoice.customer_id)
                        .filter((d) => {
                          if (viewInvoice.date_start && viewInvoice.date_end) {
                            return d.delivery_date >= viewInvoice.date_start && d.delivery_date <= viewInvoice.date_end;
                          }
                          return d.delivery_date.startsWith(viewInvoice.month_year);
                        })
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
                        }, [] as any[])
                        .map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-medium">{item.product_name}</td>
                            <td className="py-1 px-2 text-center">{item.packets_count} pkts</td>
                            <td className="py-1 px-2 text-right">₹{item.price_per_unit}</td>
                            <td className="py-1 px-2 text-right font-semibold">₹{item.total_amount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Block */}
                <div className="border-t border-slate-300 pt-2 space-y-1 text-xs text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Product Subtotal:</span>
                    <span className="font-semibold text-slate-800">₹{viewInvoice.total_product_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery Charges (Bulk Special Rate):</span>
                    <span className="font-bold text-emerald-600">₹0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs border-t border-slate-200 pt-1">
                    <span>Grand Total:</span>
                    <span>₹{viewInvoice.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Less: Payments / Credit:</span>
                    <span className="font-bold">- ₹{viewInvoice.advance_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t-2 border-slate-900 pt-1 text-slate-900">
                    <span>NET AMOUNT PAYABLE:</span>
                    <span className="text-nandini-blue">₹{viewInvoice.amount_payable.toFixed(2)}</span>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="flex items-end justify-between pt-3 border-t border-slate-300">
                  <div className="text-left text-[10px] text-slate-500 font-medium">
                    <div>Thank you for choosing {agencyProfile?.business_name || 'S.S Agency'}!</div>
                    <div className="text-[9px] text-slate-400">Nandini Commercial Bulk Supply</div>
                  </div>

                  <div className="text-center space-y-1">
                    {signatureImage ? (
                      <img src={signatureImage} alt="Authorized Signature" className="h-10 w-auto max-w-[140px] mx-auto object-contain" />
                    ) : (
                      <div className="h-8 border-b border-dashed border-slate-400 w-32 mx-auto flex items-center justify-center text-[9px] text-slate-400">
                        [ Signature Placeholder ]
                      </div>
                    )}
                    <div className="text-[10px] font-bold text-slate-900 border-t border-slate-300 pt-0.5 px-2">
                      Authorized Signatory
                    </div>
                    <div className="text-[9px] text-slate-500">{agencyProfile?.business_name || 'S.S Agency'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </Navigation>
  );
}
