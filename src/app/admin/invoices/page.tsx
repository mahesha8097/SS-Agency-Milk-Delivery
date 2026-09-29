'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { MonthlyInvoice, Customer, ShopSettings, DailyDelivery, DeliveryItem, Product } from '@/lib/types';
import {
  FileText,
  Printer,
  RefreshCw,
  Eye,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  CheckSquare,
  Square,
  IndianRupee,
} from 'lucide-react';

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

export default function AdminBillsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g. "2026-09"
  );

  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState<MonthlyInvoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  // Batch Generation Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCustIds, setSelectedCustIds] = useState<string[]>([]);

  const reloadData = () => {
    const allCusts = store.getCustomers();
    setCustomers(allCusts);
    setProducts(store.getProducts());
    setShopSettings(store.getShopSettings());

    const allInvoices = store.getInvoices();
    const monthInvoices = allInvoices.filter((inv) => inv.month_year === selectedMonth);
    setInvoices(monthInvoices);
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, [selectedMonth]);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return invoices.filter((inv) => {
      const cust = customerMap.get(inv.customer_id);
      if (!term) return true;
      return (
        inv.invoice_number.toLowerCase().includes(term) ||
        (cust &&
          (cust.name.toLowerCase().includes(term) ||
            cust.phone.includes(term) ||
            cust.customer_code.toLowerCase().includes(term)))
      );
    });
  }, [invoices, searchTerm, customerMap]);

  // Handle Bill Generation
  const handleGenerateAll = () => {
    setIsGenerating(true);
    setGenerateMessage(null);
    try {
      const res = store.generateMonthlyBills(selectedMonth);
      setGenerateMessage(`Successfully generated ${res.created} new bill(s) and updated ${res.updated} bill(s).`);
      reloadData();
    } catch (e: any) {
      setGenerateMessage('Error generating bills: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecalculateSingle = (invoiceId: string) => {
    store.recalculateInvoice(invoiceId);
    reloadData();
    if (viewInvoice && viewInvoice.id === invoiceId) {
      setViewInvoice(store.getInvoiceById(invoiceId));
    }
  };

  // Compute itemized breakdown for viewing invoice
  const getInvoiceBreakdown = (inv: MonthlyInvoice) => {
    const custDeliveries = store
      .getDeliveries()
      .filter((d) => d.customer_id === inv.customer_id && d.delivery_date.startsWith(inv.month_year) && d.status === 'DELIVERED');

    // Aggregate by product
    const prodSummary: { [prodId: string]: { name: string; unit: string; quantity: number; rate: number; total: number } } = {};

    custDeliveries.forEach((del) => {
      const items = store.getDeliveryItems(del.id);
      items.forEach((item) => {
        if (!prodSummary[item.product_id]) {
          prodSummary[item.product_id] = {
            name: item.product_name,
            unit: 'Packets',
            quantity: 0,
            rate: item.price_per_unit,
            total: 0,
          };
        }
        prodSummary[item.product_id].quantity += item.packets_count;
        prodSummary[item.product_id].total += item.total_amount;
      });
    });

    return Object.values(prodSummary);
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Customer Bills & Invoices</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Generate non-GST customer bills computed directly from actual daily deliveries and credit carry-forward.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Month Picker */}
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-300 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs sm:text-sm font-bold bg-transparent focus:outline-none text-slate-800"
              />
            </div>

            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="bg-nandini-blue hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-2 shadow-sm transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Generate / Refresh Bills</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {generateMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{generateMessage}</span>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bill by customer name, bill number, phone..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No bills generated for {selectedMonth}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Generate / Refresh Bills" above to calculate bills based on actual deliveries recorded for this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Bill No & Period</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Deliveries Total</th>
                    <th className="py-3 px-4">Previous Credit / Due</th>
                    <th className="py-3 px-4">Payments Received</th>
                    <th className="py-3 px-4">Net Payable / Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const cust = customerMap.get(inv.customer_id);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">{inv.invoice_number}</div>
                          <div className="text-xs text-slate-500">{inv.billing_period || inv.month_year}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cust?.name || 'Customer'}</div>
                          <div className="text-xs text-slate-500">{cust?.phone} • {cust?.customer_type} ({inv.billing_type})</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">₹{inv.grand_total.toFixed(0)}</div>
                          <div className="text-[11px] text-slate-500">
                            Prod: ₹{inv.total_product_amount.toFixed(0)} | Del: ₹{inv.total_delivery_charges.toFixed(0)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.previous_balance_credit > 0 && (
                            <span className="text-emerald-700 font-bold block text-xs">
                              -₹{inv.previous_balance_credit.toFixed(0)} (Credit Applied)
                            </span>
                          )}
                          {inv.previous_pending && inv.previous_pending > 0 && (
                            <span className="text-rose-600 font-bold block text-xs">
                              +₹{inv.previous_pending.toFixed(0)} (Previous Due)
                            </span>
                          )}
                          {!inv.previous_balance_credit && !inv.previous_pending && (
                            <span className="text-slate-400 text-xs font-semibold">₹0</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          ₹{(inv.advance_paid || 0).toFixed(0)}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.remaining_credit && inv.remaining_credit > 0 ? (
                            <span className="text-emerald-700 font-bold">
                              ₹0 <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md">Credit: ₹{inv.remaining_credit.toFixed(0)}</span>
                            </span>
                          ) : (
                            <span className="text-rose-700 font-black text-sm">
                              ₹{(inv.total_payable || inv.amount_payable || 0).toFixed(0)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.recalculation_required ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold inline-flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Needs Recalculation</span>
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          {inv.recalculation_required && (
                            <button
                              onClick={() => handleRecalculateSingle(inv.id)}
                              title="Recalculate Bill"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-nandini-blue font-bold text-xs rounded-xl transition inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Non-GST Customer Invoice Modal (Printable & Shareable) */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto my-auto print:m-0 print:p-0 print:shadow-none">

            {/* Actions Bar (Hidden during print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-nandini-blue text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm hover:bg-blue-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => {
                    const text = `Bill for ${customerMap.get(viewInvoice.customer_id)?.name}: Amount Payable ₹${(viewInvoice.total_payable || viewInvoice.amount_payable || 0).toFixed(0)}. Billing Period: ${viewInvoice.month_year}. S.S Agency Milk Delivery.`;
                    if (navigator.share) {
                      navigator.share({ title: 'Customer Bill', text });
                    } else {
                      navigator.clipboard.writeText(text);
                      alert('Bill summary copied to clipboard!');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-200"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              <button onClick={() => setViewInvoice(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Non-GST Invoice Document */}
            <div className="space-y-5 text-slate-900 font-sans border-2 border-slate-200 p-6 rounded-2xl print:border-none print:p-0">

              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black tracking-tight text-nandini-blue">
                    {shopSettings?.shop_name || 'NANDINI MILK PARLOUR'}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-sm">{shopSettings?.address}</p>
                  <p className="text-xs text-slate-700 font-semibold">Phone: {shopSettings?.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider mb-1">
                    CUSTOMER BILL
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-900">Bill No: {viewInvoice.invoice_number}</div>
                  <div className="text-xs text-slate-600">Date: {new Date(viewInvoice.generated_at).toLocaleDateString('en-IN')}</div>
                  <div className="text-xs font-bold text-nandini-blue">Period: {viewInvoice.billing_period || viewInvoice.month_year}</div>
                </div>
              </div>

              {/* Customer Details Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billed To:</span>
                  <div className="font-black text-sm text-slate-900 mt-0.5">
                    {customerMap.get(viewInvoice.customer_id)?.name}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {customerMap.get(viewInvoice.customer_id)?.house_number && `${customerMap.get(viewInvoice.customer_id)?.house_number}, `}
                    {customerMap.get(viewInvoice.customer_id)?.address}
                  </div>
                  <div className="text-slate-700 font-semibold mt-0.5">
                    Phone: {customerMap.get(viewInvoice.customer_id)?.phone}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-500 font-medium">Customer Type: </span>
                    <strong className="text-slate-900">{customerMap.get(viewInvoice.customer_id)?.customer_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Payment Mode: </span>
                    <strong className="text-slate-900">{viewInvoice.billing_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Customer Code: </span>
                    <strong className="font-mono text-slate-900">{customerMap.get(viewInvoice.customer_id)?.customer_code}</strong>
                  </div>
                </div>
              </div>

              {/* Product Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Actual Delivered Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {getInvoiceBreakdown(viewInvoice).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-center">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-3 text-right">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-600 font-semibold text-right">
                        Daily Delivery Charges:
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        ₹{viewInvoice.total_delivery_charges.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
                  <span>Current Month Delivery Charges + Products:</span>
                  <span>₹{viewInvoice.grand_total.toFixed(2)}</span>
                </div>

                {viewInvoice.previous_pending && viewInvoice.previous_pending > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Previous Unpaid Due (+):</span>
                    <span>+₹{viewInvoice.previous_pending.toFixed(2)}</span>
                  </div>
                )}

                {viewInvoice.previous_balance_credit > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Previous Credit Balance Applied (-):</span>
                    <span>-₹{viewInvoice.previous_balance_credit.toFixed(2)}</span>
                  </div>
                )}

                {viewInvoice.advance_paid > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Payments Received for this cycle (-):</span>
                    <span>-₹{viewInvoice.advance_paid.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>
                    {viewInvoice.remaining_credit && viewInvoice.remaining_credit > 0
                      ? 'Net Balance (Credit Remaining):'
                      : 'Total Amount Payable:'}
                  </span>
                  <span className={viewInvoice.remaining_credit && viewInvoice.remaining_credit > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    ₹
                    {(
                      viewInvoice.remaining_credit && viewInvoice.remaining_credit > 0
                        ? viewInvoice.remaining_credit
                        : viewInvoice.total_payable || viewInvoice.amount_payable || 0
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium italic pt-1">
                  Amount in words: {numberToWords(viewInvoice.total_payable || viewInvoice.amount_payable || 0)}
                </div>
              </div>

              {/* Simple Footer Note (Strictly Non-GST) */}
              <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-200">
                <p className="font-semibold text-slate-700">
                  {shopSettings?.footer_message || 'Thank you for choosing Nandini Milk Delivery!'}
                </p>
                <p className="text-[10px] mt-0.5">This is a computer-generated customer bill.</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </Navigation>
  );
}
