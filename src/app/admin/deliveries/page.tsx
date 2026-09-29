'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { DailyDelivery, Customer, AppUser, Product, DeliveryStatus } from '@/lib/types';
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Edit3,
  X,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { calculateTotalDeliveryCharge } from '@/lib/calculations';

export default function AdminDeliveriesPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dboyFilter, setDboyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchCust, setSearchCust] = useState<string>('');

  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Correction Modal State
  const [editingDelivery, setEditingDelivery] = useState<DailyDelivery | null>(null);
  const [correctStatus, setCorrectStatus] = useState<DeliveryStatus>('DELIVERED');
  const [correctReason, setCorrectReason] = useState<string>('');
  const [correctMilkLitres, setCorrectMilkLitres] = useState<string>('0');
  const [correctCurdPackets, setCorrectCurdPackets] = useState<string>('0');
  const [correctProductTotal, setCorrectProductTotal] = useState<string>('0');

  const reloadData = () => {
    setDeliveries(store.getDeliveries(selectedDate));
    setCustomers(store.getCustomers());
    setDeliveryBoys(store.getDeliveryBoys());
    setProducts(store.getProducts());
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, [selectedDate]);

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const boyMap = useMemo(() => new Map(deliveryBoys.map((u) => [u.id, u.name])), [deliveryBoys]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (dboyFilter !== 'ALL' && d.delivery_boy_id !== dboyFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DELIVERED' && d.status !== 'DELIVERED') return false;
        if (statusFilter === 'SKIPPED' && !d.status.startsWith('SKIPPED') && d.status !== 'CUSTOMER_UNAVAILABLE') return false;
      }
      if (searchCust) {
        const cust = customerMap.get(d.customer_id);
        const term = searchCust.toLowerCase();
        if (
          !cust ||
          (!cust.name.toLowerCase().includes(term) &&
            !cust.phone.includes(term) &&
            !cust.customer_code.toLowerCase().includes(term))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [deliveries, dboyFilter, statusFilter, searchCust, customerMap]);

  const totalDelivered = filteredDeliveries.filter((d) => d.status === 'DELIVERED').length;
  const totalSkipped = filteredDeliveries.filter((d) => d.status.startsWith('SKIPPED') || d.status === 'CUSTOMER_UNAVAILABLE').length;
  const totalMilkLitres = filteredDeliveries.filter((d) => d.status === 'DELIVERED').reduce((sum, d) => sum + d.total_milk_litres, 0);
  const totalCurdPackets = filteredDeliveries.filter((d) => d.status === 'DELIVERED').reduce((sum, d) => sum + d.total_curd_packets, 0);
  const totalSales = filteredDeliveries.filter((d) => d.status === 'DELIVERED').reduce((sum, d) => sum + d.grand_total, 0);

  const openCorrectionModal = (del: DailyDelivery) => {
    setEditingDelivery(del);
    setCorrectStatus(del.status);
    setCorrectReason(del.skip_reason || del.remarks || '');
    setCorrectMilkLitres(del.total_milk_litres.toString());
    setCorrectCurdPackets(del.total_curd_packets.toString());
    setCorrectProductTotal(del.product_total.toString());
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;

    const cust = customerMap.get(editingDelivery.customer_id);
    const isBulk = cust?.customer_type === 'BULK';

    const milkLit = parseFloat(correctMilkLitres) || 0;
    const curdPkts = parseInt(correctCurdPackets, 10) || 0;
    const prodTot = parseFloat(correctProductTotal) || 0;

    let delCharge = 0;
    let grandTot = 0;

    if (correctStatus === 'DELIVERED') {
      delCharge = calculateTotalDeliveryCharge(milkLit, curdPkts, isBulk);
      grandTot = prodTot + delCharge;
    }

    store.correctDelivery(editingDelivery.id, {
      status: correctStatus,
      skip_reason: correctStatus !== 'DELIVERED' ? correctReason : undefined,
      remarks: correctReason,
      total_milk_litres: correctStatus === 'DELIVERED' ? milkLit : 0,
      total_curd_packets: correctStatus === 'DELIVERED' ? curdPkts : 0,
      product_total: correctStatus === 'DELIVERED' ? prodTot : 0,
      delivery_charge: delCharge,
      grand_total: grandTot,
    });

    setEditingDelivery(null);
    reloadData();
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Daily Deliveries</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Audit live daily deliveries, exact execution timestamps, and perform delivery record corrections.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-300 shadow-xs self-start md:self-auto">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm font-bold bg-transparent focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivered</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalDelivered}</div>
            <div className="text-[11px] text-slate-400 font-medium">{totalSkipped} skipped</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Milk Volume</span>
            <div className="text-2xl font-black text-nandini-blue mt-1">{totalMilkLitres.toFixed(1)} L</div>
            <div className="text-[11px] text-slate-400 font-medium">Actual volume dispatched</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Curd Packets</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalCurdPackets} Pkts</div>
            <div className="text-[11px] text-slate-400 font-medium">Packets delivered</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total Sales</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalSales.toFixed(0)}</div>
            <div className="text-[11px] text-slate-400 font-medium">For {selectedDate}</div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchCust}
              onChange={(e) => setSearchCust(e.target.value)}
              placeholder="Search customer..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={dboyFilter}
            onChange={(e) => setDboyFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Delivery Boys ({deliveryBoys.length})</option>
            {deliveryBoys.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered Only</option>
            <option value="SKIPPED">Skipped Only</option>
          </select>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredDeliveries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No delivery records found</h3>
              <p className="text-xs text-slate-500">No deliveries matching criteria recorded for {selectedDate}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Delivery Boy</th>
                    <th className="py-3 px-4">Delivered Quantity</th>
                    <th className="py-3 px-4">Delivery Time</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.map((del) => {
                    const cust = customerMap.get(del.customer_id);
                    const boyName = boyMap.get(del.delivery_boy_id) || 'Delivery Boy';
                    const isDelivered = del.status === 'DELIVERED';

                    return (
                      <tr key={del.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cust?.name || 'Customer'}</div>
                          <div className="text-xs text-slate-500 font-mono">{cust?.customer_code} • {cust?.house_number || cust?.address}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {boyName}
                        </td>

                        <td className="py-3.5 px-4">
                          {isDelivered ? (
                            <div className="font-medium text-slate-800">
                              {del.total_milk_litres > 0 && <span>{del.total_milk_litres}L Milk </span>}
                              {del.total_curd_packets > 0 && <span>• {del.total_curd_packets} Curd </span>}
                              {del.total_milk_litres === 0 && del.total_curd_packets === 0 && <span>Other items</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">0 (Skipped)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{del.delivered_at || 'Recorded'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{del.grand_total.toFixed(0)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                              isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isDelivered ? '✓ Delivered' : `✕ Skipped (${del.skip_reason || 'Unavailable'})`}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openCorrectionModal(del)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-nandini-blue font-bold text-xs rounded-xl transition flex items-center space-x-1 ml-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Correct</span>
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

      {/* Delivery Correction Modal */}
      {editingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Correct Delivery Record</h3>
                <p className="text-xs text-slate-500">Customer: {customerMap.get(editingDelivery.customer_id)?.name}</p>
              </div>
              <button onClick={() => setEditingDelivery(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Modifying a past delivery will flag affected monthly bills for recalculation.
              </span>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={correctStatus}
                  onChange={(e) => setCorrectStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-bold"
                >
                  <option value="DELIVERED">Delivered</option>
                  <option value="SKIPPED">Skipped (Customer Requested)</option>
                  <option value="CUSTOMER_UNAVAILABLE">Skipped (Customer Unavailable)</option>
                  <option value="ROUTE_ISSUE">Skipped (Route Issue)</option>
                </select>
              </div>

              {correctStatus === 'DELIVERED' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Milk Volume (L)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={correctMilkLitres}
                        onChange={(e) => setCorrectMilkLitres(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Curd Packets</label>
                      <input
                        type="number"
                        min="0"
                        value={correctCurdPackets}
                        onChange={(e) => setCorrectCurdPackets(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Amount Subtotal (₹)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={correctProductTotal}
                      onChange={(e) => setCorrectProductTotal(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Skip Reason / Remarks</label>
                  <input
                    type="text"
                    value={correctReason}
                    onChange={(e) => setCorrectReason(e.target.value)}
                    placeholder="e.g. Customer out of town"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDelivery(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  Save Delivery Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
