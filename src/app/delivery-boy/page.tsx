'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PacketCounter from '@/components/PacketCounter';
import { store } from '@/lib/store';
import { Customer, Product, DeliveryStatus, DailyDelivery, Route } from '@/lib/types';
import { calculateDeliveryTotals, calculateDeliveryCharge } from '@/lib/calculations';
import { Search, CheckCircle, AlertTriangle, Clock, RefreshCw, Check, Edit2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function DeliveryBoyPage() {
  const currentUser = store.getCurrentUser();

  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    setDateStr(new Date().toISOString().split('T')[0]);
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Delivery Entry Form State
  const [packetCounts, setPacketCounts] = useState<{ [productId: string]: number }>({});
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('DELIVERED');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reloadData = () => {
    if (!currentUser) return;
    const date = new Date().toISOString().split('T')[0];
    const assignedCusts = store.getCustomersByDeliveryBoy(currentUser.id);
    setCustomers(assignedCusts);
    setProducts(store.getProducts());
    setRoutes(store.getRoutes());
    setDeliveries(store.getDeliveries(date));
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => { unsub(); };
  }, [currentUser]);


  // Open delivery entry form for customer
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setSuccessMessage(null);

    // Check if delivery already exists today
    const existing = store.getExistingDelivery(cust.id, dateStr || new Date().toISOString().split('T')[0]);

    const prods = store.getProducts();
    const defaults: { [key: string]: number } = {};

    if (existing) {
      setDeliveryStatus(existing.status);
      setRemarks(existing.remarks || '');
      const items = store.getDeliveryItems(existing.id);
      prods.forEach((p) => {
        const item = items.find((i) => i.product_id === p.id);
        defaults[p.id] = item ? item.packets_count : 0;
      });
    } else {
      setDeliveryStatus('DELIVERED');
      setRemarks('');
      const custReqs = store.getCustomerProducts(cust.id);
      prods.forEach((p) => {
        const req = custReqs.find((cr) => cr.product_id === p.id);
        defaults[p.id] = req ? req.default_packets : 0;
      });
    }

    setPacketCounts(defaults);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const existingDelivery = selectedCustomer ? store.getExistingDelivery(selectedCustomer.id, dateStr) : undefined;
  const assignedRoute = routes.find((r) => r.assigned_delivery_boy_id === currentUser?.id);

  // Live totals calculation for current form entry
  const packetEntries = Object.entries(packetCounts).map(([productId, packetsCount]) => ({
    productId,
    packetsCount,
  }));
  const liveTotals = calculateDeliveryTotals(packetEntries, products);

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !currentUser) return;

    setSaving(true);
    try {
      const result = await store.saveDailyDelivery(
        selectedCustomer.id,
        currentUser.id,
        selectedCustomer.route_id,
        dateStr,
        deliveryStatus,
        packetEntries,
        remarks,
        existingDelivery?.id
      );

      setSaving(false);
      setSuccessMessage(`Delivery recorded for ${selectedCustomer.name}!`);
      setTimeout(() => {
        setSelectedCustomerId(null);
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert('Error saving delivery record');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.house_number.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term) ||
      c.customer_code.toLowerCase().includes(term)
    );
  });

  return (
    <Navigation>
      <main className="max-w-3xl w-full mx-auto p-3 md:p-6 space-y-4">

        {/* Header Information Card */}
        <div className="bg-nandini-blue text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
                Today's Morning Delivery
              </span>
              <h2 className="text-xl md:text-2xl font-black">{assignedRoute?.name || 'Assigned Route'}</h2>
              <div className="text-xs text-blue-100 mt-0.5">
                Date: <b>{dateStr}</b> • Delivery Boy: <b>{currentUser?.name}</b>
              </div>
            </div>
            <div className="text-right bg-blue-900/50 p-2 rounded-lg border border-blue-400/30">
              <div className="text-lg font-black text-white">
                {deliveries.filter((d) => d.status === 'DELIVERED').length} / {customers.length}
              </div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Done</div>
            </div>
          </div>
        </div>

        {/* VIEW 1: CUSTOMER LIST FOR TODAY */}
        {!selectedCustomer ? (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search house, name (e.g. A-103, Ravi)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-white shadow-2xs font-medium"
              />
            </div>

            {/* Customer List Cards */}
            <div className="space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center text-slate-500 text-sm border border-slate-200">
                  No assigned customers found for this route.
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const del = store.getExistingDelivery(cust.id, dateStr);
                  const isDone = !!del;

                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-nandini-blue'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-base md:text-lg">{cust.name}</span>
                          <span className="font-mono font-bold text-xs bg-slate-100 text-nandini-blue px-2 py-0.5 rounded">
                            {cust.house_number}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{cust.location}</div>
                        {cust.notes && (
                          <div className="text-[11px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded inline-block">
                            Note: {cust.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {isDone ? (
                          <div className="flex items-center space-x-1 text-emerald-700 font-bold text-xs bg-emerald-100 px-2.5 py-1.5 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span>Done ({del.total_milk_litres}L)</span>
                          </div>
                        ) : (
                          <button className="bg-nandini-blue text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-2xs">
                            + Record
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: DAILY PACKET ENTRY FORM (MOBILE-FIRST) */
          <form onSubmit={handleSaveDelivery} className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm space-y-4">
            {/* Top Navigation Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to List</span>
              </button>

              <div className="text-xs font-bold text-nandini-blue font-mono">
                {selectedCustomer.customer_code}
              </div>
            </div>

            {/* Customer Header */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{selectedCustomer.name}</h3>
              <div className="text-xs text-slate-500 font-medium">
                House <b>{selectedCustomer.house_number}</b> • {selectedCustomer.location}
              </div>
              {selectedCustomer.notes && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                  📌 <b>Customer Note:</b> {selectedCustomer.notes}
                </div>
              )}
            </div>

            {/* Duplicate Delivery Warning Banner */}
            {existingDelivery && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-lg text-xs flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Today's delivery already recorded!</div>
                  <div>Editing will update the existing delivery record safely.</div>
                </div>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-sm font-bold flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Delivery Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Delivery Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'DELIVERED', label: 'DELIVERED' },
                    { id: 'SKIPPED_BY_CUSTOMER', label: 'SKIPPED BY CUST.' },
                    { id: 'CUSTOMER_UNAVAILABLE', label: 'UNAVAILABLE' },
                    { id: 'DELIVERY_ISSUE', label: 'DELIVERY ISSUE' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDeliveryStatus(st.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition ${
                      deliveryStatus === st.id
                        ? st.id === 'DELIVERED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Packet Steppers list */}
            {deliveryStatus === 'DELIVERED' && (
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Select Delivered Packets
                </label>
                {products.map((p) => (
                  <PacketCounter
                    key={p.id}
                    label={p.name}
                    subLabel={p.category === 'MILK' ? `${p.packet_size_ml}ml Milk` : 'Curd 1L'}
                    price={p.price}
                    count={packetCounts[p.id] || 0}
                    onChange={(newVal) =>
                      setPacketCounts({
                        ...packetCounts,
                        [p.id]: newVal,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {/* Live Automated Calculation Display Card */}
            {deliveryStatus === 'DELIVERED' && (
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Milk Litres:</span>
                  <span className="font-bold text-blue-300 text-base">{liveTotals.totalMilkLitres} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Curd Packets:</span>
                  <span className="font-bold text-amber-300">{liveTotals.totalCurdPackets} Pkts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Product Total:</span>
                  <span className="font-semibold">₹{liveTotals.productTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Delivery Charge (Milk Vol):</span>
                  <span className="font-semibold text-cyan-300">₹{liveTotals.deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-black text-white">
                  <span>DAILY GRAND TOTAL:</span>
                  <span className="text-emerald-400">₹{liveTotals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Remarks Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Delivery Remarks / Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Customer requested only 500ml today"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
            </div>

            {/* Big One-Handed Save Delivery Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-nandini-blue hover:bg-nandini-dark active:bg-blue-900 text-white py-4 rounded-xl font-extrabold text-base shadow-md transition flex items-center justify-center space-x-2 touch-manipulation select-none"
            >
              <Check className="w-6 h-6" />
              <span>{saving ? 'Saving Delivery...' : existingDelivery ? 'UPDATE TODAY\'S DELIVERY' : 'SAVE DELIVERY RECORD'}</span>
            </button>
          </form>
        )}
      </main>
    </Navigation>
  );
}

