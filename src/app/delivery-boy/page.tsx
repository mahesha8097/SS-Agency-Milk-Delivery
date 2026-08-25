'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PacketCounter from '@/components/PacketCounter';
import { store } from '@/lib/store';
import { Customer, Product, DeliveryStatus, DailyDelivery, Route } from '@/lib/types';
import { calculateDeliveryTotals } from '@/lib/calculations';
import {
  Search,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Check,
  Edit2,
  ShieldAlert,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  MapPin,
  Home,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function DeliveryBoyPage() {
  const currentUser = store.getCurrentUser();

  const [dateStr, setDateStr] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);

  // View mode: SLIDE (card carousel) or LIST (vertical list)
  const [viewMode, setViewMode] = useState<'SLIDE' | 'LIST'>('SLIDE');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Delivery Entry Form State for Active Slide / Selected Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [packetCounts, setPacketCounts] = useState<{ [productId: string]: number }>({});
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('DELIVERED');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDateStr(new Date().toISOString().split('T')[0]);
  }, []);

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
    return () => {
      unsub();
    };
  }, [currentUser]);

  // Filter customers by search term
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.house_number.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term) ||
      c.customer_code.toLowerCase().includes(term)
    );
  });

  // Ensure valid slide index
  const safeSlideIndex = Math.min(
    Math.max(0, currentSlideIndex),
    Math.max(0, filteredCustomers.length - 1)
  );

  const activeCustomer = filteredCustomers[safeSlideIndex] || null;

  // Load customer form defaults whenever active customer changes in Slide mode
  useEffect(() => {
    if (viewMode === 'SLIDE' && activeCustomer) {
      loadCustomerFormData(activeCustomer);
    }
  }, [safeSlideIndex, filteredCustomers.length, viewMode]);

  const loadCustomerFormData = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setSuccessMessage(null);

    const date = dateStr || new Date().toISOString().split('T')[0];
    const existing = store.getExistingDelivery(cust.id, date);
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

  const handleSelectCustomerFromList = (cust: Customer) => {
    const idx = filteredCustomers.findIndex((c) => c.id === cust.id);
    if (idx !== -1) {
      setCurrentSlideIndex(idx);
    }
    loadCustomerFormData(cust);
    if (viewMode === 'LIST') {
      // In list view, clicking opens detailed form overlay
    }
  };

  const activeCustomerExistingDelivery = activeCustomer
    ? store.getExistingDelivery(activeCustomer.id, dateStr)
    : undefined;

  const assignedRoute = routes.find(
    (r) => r.assigned_delivery_boy_id === currentUser?.id
  );

  // Live totals for active customer form
  const packetEntries = Object.entries(packetCounts).map(([productId, packetsCount]) => ({
    productId,
    packetsCount,
  }));
  const isBulk = activeCustomer?.customer_category === 'BULK_ORDER' || activeCustomer?.is_bulk_order;
  const liveTotals = calculateDeliveryTotals(packetEntries, products, !!isBulk);

  // Find next pending customer slide index
  const getNextPendingIndex = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < filteredCustomers.length; i++) {
      const del = store.getExistingDelivery(filteredCustomers[i].id, dateStr);
      if (!del) return i;
    }
    // Wrap around to start if needed
    for (let i = 0; i < fromIndex; i++) {
      const del = store.getExistingDelivery(filteredCustomers[i].id, dateStr);
      if (!del) return i;
    }
    return Math.min(fromIndex + 1, filteredCustomers.length - 1);
  };

  const handleSaveActiveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !currentUser) return;

    setSaving(true);
    try {
      await store.saveDailyDelivery(
        activeCustomer.id,
        currentUser.id,
        activeCustomer.route_id,
        dateStr,
        deliveryStatus,
        packetEntries,
        remarks,
        activeCustomerExistingDelivery?.id
      );

      setSaving(false);
      const houseCode = activeCustomer.house_number;
      setSuccessMessage(`✓ Recorded delivery for House ${houseCode}!`);

      // Auto slide to next pending customer after 700ms
      setTimeout(() => {
        setSuccessMessage(null);
        if (viewMode === 'SLIDE') {
          const nextIdx = getNextPendingIndex(safeSlideIndex);
          setCurrentSlideIndex(nextIdx);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert('Error saving delivery record');
    }
  };

  const doneCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const totalCount = customers.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Navigation>
      <main className="max-w-3xl w-full mx-auto p-3 md:p-6 space-y-4">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-nandini-blue via-blue-700 to-indigo-800 text-white p-4 md:p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-[11px] uppercase font-bold tracking-wider text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Today's Delivery Route</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {assignedRoute?.name || 'Assigned Route'}
              </h2>
              <div className="text-xs text-blue-100 mt-0.5 font-medium">
                Date: <b>{dateStr}</b> • Delivery Boy: <b>{currentUser?.name}</b>
              </div>
            </div>

            {/* Progress Badge */}
            <div className="text-right bg-white/10 backdrop-blur-md p-2.5 px-3.5 rounded-xl border border-white/20">
              <div className="text-lg md:text-xl font-black text-white">
                {doneCount} / {totalCount}
              </div>
              <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                Delivered ({progressPercent}%)
              </div>
            </div>
          </div>

          {/* Route Progress Bar */}
          <div className="w-full bg-blue-900/50 h-2 rounded-full overflow-hidden border border-blue-400/20">
            <div
              className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="text-blue-200 font-semibold flex items-center space-x-1">
              <span>View Format:</span>
            </div>

            <div className="bg-slate-900/40 p-1 rounded-xl flex items-center space-x-1 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('SLIDE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                  viewMode === 'SLIDE'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>🎴 Slide Card View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                  viewMode === 'LIST'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>📋 Route List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search & Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search house, name (e.g. A-103, Ravi)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-white shadow-2xs font-medium"
          />
        </div>

        {/* Quick House Navigation Bar (Horizontal Scrollable Badges) */}
        {filteredCustomers.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Houses on Route ({filteredCustomers.length}):
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
              {filteredCustomers.map((c, idx) => {
                const del = store.getExistingDelivery(c.id, dateStr);
                const isDelivered = !!del;
                const isActive = viewMode === 'SLIDE' && idx === safeSlideIndex;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      if (viewMode === 'LIST') setViewMode('SLIDE');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 transition flex items-center space-x-1 border ${
                      isActive
                        ? 'bg-nandini-blue text-white border-nandini-blue ring-2 ring-blue-400/40 shadow-sm scale-105'
                        : isDelivered
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{c.house_number}</span>
                    {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 1: SLIDE CARD CAROUSEL VIEW */}
        {viewMode === 'SLIDE' && (
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-sm border border-slate-200 shadow-2xs">
                No customers found matching your search.
              </div>
            ) : activeCustomer ? (
              <div className="bg-white border-2 border-nandini-blue/30 rounded-2xl p-4 md:p-6 shadow-lg space-y-4 relative transition-all">
                {/* Slide Card Stepper Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <button
                    type="button"
                    disabled={safeSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center space-x-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="text-center">
                    <span className="text-xs font-black text-nandini-blue uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      Customer {safeSlideIndex + 1} of {filteredCustomers.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={safeSlideIndex === filteredCustomers.length - 1}
                    onClick={() =>
                      setCurrentSlideIndex((prev) =>
                        Math.min(filteredCustomers.length - 1, prev + 1)
                      )
                    }
                    className="flex items-center space-x-1 text-xs font-bold px-3 py-2 rounded-xl bg-nandini-blue text-white hover:bg-nandini-dark disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Customer Details Header Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900">
                        {activeCustomer.name}
                      </h3>
                      <span className="bg-nandini-blue text-white font-mono font-bold text-xs px-2.5 py-1 rounded-md shadow-2xs">
                        House {activeCustomer.house_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeCustomer.location}</span>
                      <span className="text-slate-400">• Phone: {activeCustomer.phone}</span>
                    </div>
                  </div>

                  {/* Delivery Status Badge */}
                  {activeCustomerExistingDelivery ? (
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 self-start md:self-auto">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Done ({activeCustomerExistingDelivery.total_milk_litres}L)</span>
                    </div>
                  ) : (
                    <div className="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1 rounded-xl font-bold text-xs flex items-center space-x-1 self-start md:self-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Pending Morning Delivery</span>
                    </div>
                  )}
                </div>

                {/* Customer Notes */}
                {activeCustomer.notes && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-semibold">
                    📌 <b>Customer Note:</b> {activeCustomer.notes}
                  </div>
                )}

                {/* Success Message Notification */}
                {successMessage && (
                  <div className="bg-emerald-600 text-white p-3.5 rounded-xl text-sm font-black flex items-center justify-between shadow-md animate-bounce">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{successMessage}</span>
                    </div>
                    <span className="text-xs bg-emerald-700 px-2 py-1 rounded text-emerald-100 font-medium">
                      Sliding to next ➔
                    </span>
                  </div>
                )}

                {/* Delivery Form */}
                <form onSubmit={handleSaveActiveDelivery} className="space-y-4">
                  {/* Delivery Status Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
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
                          className={`py-2.5 px-3 text-xs font-extrabold rounded-xl border transition touch-manipulation ${
                            deliveryStatus === st.id
                              ? st.id === 'DELIVERED'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Packet Steppers */}
                  {deliveryStatus === 'DELIVERED' && (
                    <div className="space-y-2.5 pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
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

                  {/* Live Automated Calculations Card */}
                  {deliveryStatus === 'DELIVERED' && (
                    <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs md:text-sm shadow-inner">
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
                        <span className="text-slate-300">
                          Delivery Charge ({isBulk ? 'Bulk ₹0' : 'Milk Vol'}):
                        </span>
                        <span className="font-semibold text-cyan-300">
                          ₹{liveTotals.deliveryCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-black text-white">
                        <span>DAILY GRAND TOTAL:</span>
                        <span className="text-emerald-400">₹{liveTotals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Remarks Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Remarks / Notes
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Leave milk at door step box"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-nandini-blue hover:bg-nandini-dark active:bg-blue-900 text-white py-4 rounded-xl font-black text-base shadow-md transition flex items-center justify-center space-x-2 touch-manipulation"
                    >
                      <Check className="w-6 h-6" />
                      <span>
                        {saving
                          ? 'Saving...'
                          : activeCustomerExistingDelivery
                          ? 'UPDATE DELIVERY'
                          : 'MARK DELIVERED & NEXT ➔'}
                      </span>
                    </button>

                    {activeCustomerExistingDelivery && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = getNextPendingIndex(safeSlideIndex);
                          setCurrentSlideIndex(nextIdx);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-base shadow-md transition flex items-center justify-center space-x-2 touch-manipulation"
                      >
                        <span>NEXT DELIVERY ➔</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 2: ROUTE LIST VIEW */}
        {viewMode === 'LIST' && (
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-sm border border-slate-200">
                No assigned customers found for this route.
              </div>
            ) : (
              filteredCustomers.map((cust, idx) => {
                const del = store.getExistingDelivery(cust.id, dateStr);
                const isDone = !!del;

                return (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomerFromList(cust)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-nandini-blue'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-base md:text-lg">
                          {cust.name}
                        </span>
                        <span className="font-mono font-bold text-xs bg-slate-100 text-nandini-blue px-2 py-0.5 rounded">
                          House {cust.house_number}
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
                        <div className="flex items-center space-x-1 text-emerald-800 font-extrabold text-xs bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Update ({del.total_milk_litres}L)</span>
                        </div>
                      ) : (
                        <button className="bg-nandini-blue text-white px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-2xs flex items-center space-x-1">
                          <span>+ Record</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </Navigation>
  );
}
