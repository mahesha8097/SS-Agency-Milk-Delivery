'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Payment, Customer, PaymentMethod } from '@/lib/types';
import { CreditCard, Plus, Calendar, Check, X, Search } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'UPI' as PaymentMethod,
    reference_number: '',
    notes: '',
  });

  const reload = () => {
    setPayments(store.getPayments());
    const custs = store.getCustomers();
    setCustomers(custs);
    if (custs.length > 0 && !formData.customer_id) {
      setFormData((f) => ({ ...f, customer_id: custs[0].id }));
    }
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);


  const openAddModal = () => {
    setFormData({
      customer_id: customers[0]?.id || '',
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_method: 'UPI',
      reference_number: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.customer_id || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid customer and payment amount');
      return;
    }

    store.recordPayment({
      customer_id: formData.customer_id,
      payment_date: formData.payment_date,
      amount: numAmount,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number,
      notes: formData.notes,
    });

    setShowModal(false);
  };

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const filteredPayments = payments.filter((p) => {
    const cust = customerMap.get(p.customer_id);
    if (!cust) return false;
    const term = searchTerm.toLowerCase();
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.customer_code.toLowerCase().includes(term) ||
      p.payment_method.toLowerCase().includes(term) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(term))
    );
  });

  const totalPaymentsAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Payment & Advance Management</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Record advance payments, customer credits, UPI transactions, and cash receipts
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Customer Payment</span>
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Total Payments Recorded</div>
              <div className="text-2xl font-extrabold text-slate-900">₹{totalPaymentsAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="w-full md:w-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by customer name, code, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Reference / Txn ID</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map((p) => {
                      const cust = customerMap.get(p.customer_id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-medium text-slate-600">{p.payment_date}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{cust?.name}</div>
                            <div className="text-[11px] font-mono text-nandini-blue">{cust?.customer_code} • {cust?.house_number}</div>
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-700">₹{p.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-800">
                              {p.payment_method}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-600">{p.reference_number || 'N/A'}</td>
                          <td className="p-3 text-xs text-slate-500 italic">{p.notes || '-'}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-lg">Record Customer Payment</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customer_code} - {c.house_number}, {c.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-lg text-emerald-700 focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'CASH', 'BANK'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: method })}
                        className={`py-2 rounded-lg text-xs font-bold border transition ${formData.payment_method === method
                            ? 'bg-nandini-blue text-white border-nandini-blue'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reference / UPI Txn ID</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="e.g. UPI987654321"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Monthly advance for August"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Payment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}

