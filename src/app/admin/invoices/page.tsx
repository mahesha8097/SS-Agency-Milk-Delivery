'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { MonthlyInvoice, Customer } from '@/lib/types';
import { FileText, Printer, RefreshCw, Eye, X, Upload, CheckCircle2 } from 'lucide-react';

export default function AdminInvoicesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  );

  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewInvoice, setViewInvoice] = useState<MonthlyInvoice | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const reload = () => {
    setInvoices(store.getInvoices(selectedMonth));
    setCustomers(store.getCustomers());
    setSignatureImage(store.getSignatureImage());
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => {
      unsub();
    };
  }, [selectedMonth]);

  const handleGenerateInvoices = () => {
    const generated = store.generateMonthlyBills(selectedMonth);
    alert(`Successfully generated ${generated.length} invoices for ${selectedMonth}!`);
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

  const customerMap = new Map(customers.map((c) => [c.id, c]));

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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Monthly Bills & Invoices</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Generate monthly billing statements, advance deductions, and single-sheet printable invoices
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />

            <button
              onClick={handleGenerateInvoices}
              className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate Monthly Bills</span>
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Monthly Billing</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">{invoices.length} customer invoices</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Advance Payments Credited</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹{totalAdvances.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Prepaid credits applied</div>
          </div>

          <div className="bg-nandini-blue text-white p-4 rounded-xl shadow-xs">
            <div className="text-xs font-semibold text-blue-200 uppercase">Net Outstanding Amount Payable</div>
            <div className="text-2xl font-black text-white mt-1">₹{totalPayable.toFixed(2)}</div>
            <div className="text-xs text-blue-200 mt-0.5">To be collected</div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Invoice No.</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Product Total</th>
                  <th className="p-3 text-right">Del. Charges</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Advance Paid</th>
                  <th className="p-3 text-right">Amount Payable</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No invoices generated yet for {selectedMonth}. Click <b>Generate Monthly Bills</b> above.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const cust = customerMap.get(inv.customer_id);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-nandini-blue">{inv.invoice_number}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{cust?.name}</div>
                          <div className="text-[11px] text-slate-500">{cust?.house_number}, {cust?.location}</div>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800">₹{inv.total_product_amount}</td>
                        <td className="p-3 text-right font-medium text-nandini-accent">₹{inv.total_delivery_charges}</td>
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

        {/* Invoice View & Print Modal */}
        {viewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-3 max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 no-print">
                <h3 className="font-bold text-slate-900 text-base">Invoice Preview (Single Sheet Print)</h3>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5 text-nandini-blue" />
                    <span>Upload Signature</span>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>

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
                {/* Invoice Header */}
                <div className="text-center border-b border-slate-300 pb-3">
                  <h1 className="text-xl font-black tracking-tight text-nandini-blue uppercase">S.S AGENCY</h1>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">NANDINI MILK & DAIRY PRODUCTS</p>
                  <p className="text-[10px] text-slate-500">Morning Door-to-Door Delivery Service</p>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase text-[9px]">Customer Details</div>
                    <div className="font-bold text-sm text-slate-900">{customerMap.get(viewInvoice.customer_id)?.name}</div>
                    <div>Premises: <b>{customerMap.get(viewInvoice.customer_id)?.house_number}</b></div>
                    <div>Location: {customerMap.get(viewInvoice.customer_id)?.location}</div>
                    <div>Code: {customerMap.get(viewInvoice.customer_id)?.customer_code}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-500 font-semibold uppercase text-[9px]">Invoice Info</div>
                    <div className="font-mono font-bold text-nandini-blue">{viewInvoice.invoice_number}</div>
                    <div>Month: <b>{viewInvoice.month_year}</b></div>
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
                        .filter((d) => d.delivery_date.startsWith(viewInvoice.month_year))
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
                    <span className="text-slate-600">Delivery Charges:</span>
                    <span className="font-semibold text-nandini-accent">₹{viewInvoice.total_delivery_charges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs border-t border-slate-200 pt-1">
                    <span>Grand Total:</span>
                    <span>₹{viewInvoice.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Less: Advance Payments / Credit:</span>
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
                    <div>Thank you for choosing S.S Agency!</div>
                    <div className="text-[9px] text-slate-400">Nandini Door-to-Door Milk Service</div>
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
                    <div className="text-[9px] text-slate-500">S.S Agency</div>
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
