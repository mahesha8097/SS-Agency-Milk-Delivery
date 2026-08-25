'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Customer, Product, DeliveryStatus, DailyDelivery, Route, DeliveryItem } from '@/lib/types';
import { calculateDeliveryTotals } from '@/lib/calculations';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  History,
  Navigation as NavIcon,
  X,
  CreditCard,
  Milk,
  Package,
} from 'lucide-react';

export default function DeliveryBoyPage() {
  const currentUser = store.getCurrentUser();

  const [dateStr, setDateStr] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);

  // Navigation & Search State
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Delivery Form State
  const [packetCounts, setPacketCounts] = useState<{ [productId: string]: number }>({});
  const [isSkipDay, setIsSkipDay] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('DELIVERED');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    setDateStr(new Date().toISOString().split('T')[0]);
  }, []);

  const reloadData = () => {
    if (!currentUser) return;
    const date = dateStr || new Date().toISOString().split('T')[0];
    const assignedCusts = store.getCustomersByDeliveryBoy(currentUser.id);
    setCustomers(assignedCusts);
    setProducts(store.getProducts().filter((p) => p.active));
    setRoutes(store.getRoutes());
    setDeliveries(store.getDeliveries(date));
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, [currentUser, dateStr]);

  // Filter customers by selected area/route and search term
  const filteredCustomers = customers.filter((c) => {
    if (selectedRouteId !== 'ALL' && c.route_id !== selectedRouteId) return false;
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.house_number.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term) ||
      c.customer_code.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  });

  // Safe slide index calculation
  const safeIndex = Math.min(
    Math.max(0, currentSlideIndex),
    Math.max(0, filteredCustomers.length - 1)
  );
  const activeCustomer = filteredCustomers[safeIndex] || null;

  // Load customer form state when active customer slide changes
  useEffect(() => {
    if (activeCustomer) {
      loadCustomerFormData(activeCustomer);
    }
  }, [safeIndex, filteredCustomers.length]);

  const loadCustomerFormData = (cust: Customer) => {
    setSuccessMessage(null);
    const date = dateStr || new Date().toISOString().split('T')[0];
    const existing = store.getExistingDelivery(cust.id, date);
    const prods = store.getProducts().filter((p) => p.active);
    const defaults: { [key: string]: number } = {};

    if (existing) {
      setDeliveryStatus(existing.status);
      setIsSkipDay(existing.status === 'SKIPPED_BY_CUSTOMER' || existing.status === 'CUSTOMER_UNAVAILABLE');
      setRemarks(existing.remarks || '');
      const items = store.getDeliveryItems(existing.id);
      prods.forEach((p) => {
        const item = items.find((i) => i.product_id === p.id);
        defaults[p.id] = item ? item.packets_count : 0;
      });
    } else {
      setDeliveryStatus('DELIVERED');
      setIsSkipDay(false);
      setRemarks('');
      const custReqs = store.getCustomerProducts(cust.id);
      prods.forEach((p) => {
        const req = custReqs.find((cr) => cr.product_id === p.id);
        defaults[p.id] = req ? req.default_packets : 0;
      });
    }

    setPacketCounts(defaults);
  };

  const activeCustomerExistingDelivery = activeCustomer
    ? store.getExistingDelivery(activeCustomer.id, dateStr)
    : undefined;

  // Calculate total items count for active customer
  const totalItemCount = Object.values(packetCounts).reduce((acc, qty) => acc + qty, 0);

  // Packet entries for calculations
  const packetEntries = Object.entries(packetCounts).map(([productId, packetsCount]) => ({
    productId,
    packetsCount,
  }));

  // Handle Save & Next
  const handleSaveAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !currentUser) return;

    setSaving(true);
    try {
      const finalStatus: DeliveryStatus = isSkipDay ? 'SKIPPED_BY_CUSTOMER' : deliveryStatus;
      await store.saveDailyDelivery(
        activeCustomer.id,
        currentUser.id,
        activeCustomer.route_id,
        dateStr,
        finalStatus,
        isSkipDay ? [] : packetEntries,
        remarks,
        activeCustomerExistingDelivery?.id
      );

      setSaving(false);
      setSuccessMessage(`Saved for ${activeCustomer.name}!`);

      // Auto advance to next customer after short delay
      setTimeout(() => {
        setSuccessMessage(null);
        if (safeIndex < filteredCustomers.length - 1) {
          setCurrentSlideIndex((prev) => prev + 1);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert('Error saving delivery record');
    }
  };

  // Copy Yesterday's Delivery
  const handleCopyYesterday = () => {
    if (!activeCustomer) return;
    const yesterday = new Date(Date.parse(dateStr || new Date().toISOString()) - 86400000)
      .toISOString()
      .split('T')[0];
    const prevDelivery = store.getExistingDelivery(activeCustomer.id, yesterday);
    const prods = store.getProducts().filter((p) => p.active);
    const defaults: { [key: string]: number } = {};

    if (prevDelivery) {
      const items = store.getDeliveryItems(prevDelivery.id);
      prods.forEach((p) => {
        const item = items.find((i) => i.product_id === p.id);
        defaults[p.id] = item ? item.packets_count : 0;
      });
      setPacketCounts(defaults);
      setIsSkipDay(false);
      setDeliveryStatus('DELIVERED');
    } else {
      // Fallback to customer regular requirements
      const custReqs = store.getCustomerProducts(activeCustomer.id);
      prods.forEach((p) => {
        const req = custReqs.find((cr) => cr.product_id === p.id);
        defaults[p.id] = req ? req.default_packets : 0;
      });
      setPacketCounts(defaults);
      setIsSkipDay(false);
    }
  };

  // Delivery Counts
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const noDeliveryCount = deliveries.filter((d) => d.status !== 'DELIVERED').length;
  const pendingCount = Math.max(0, filteredCustomers.length - (deliveredCount + noDeliveryCount));

  // Product color mappings
  const getProductColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-600', icon: 'bg-blue-500/20 text-blue-400' },
      { bg: 'bg-emerald-600', icon: 'bg-emerald-500/20 text-emerald-400' },
      { bg: 'bg-amber-600', icon: 'bg-amber-500/20 text-amber-400' },
      { bg: 'bg-purple-600', icon: 'bg-purple-500/20 text-purple-400' },
      { bg: 'bg-cyan-600', icon: 'bg-cyan-500/20 text-cyan-400' },
      { bg: 'bg-indigo-600', icon: 'bg-indigo-500/20 text-indigo-400' },
      { bg: 'bg-amber-500', icon: 'bg-amber-500/20 text-amber-300' },
      { bg: 'bg-yellow-600', icon: 'bg-yellow-500/20 text-yellow-400' },
      { bg: 'bg-rose-600', icon: 'bg-rose-500/20 text-rose-400' },
    ];
    return colors[index % colors.length];
  };

  // Google Maps Navigation
  const handleOpenNavigation = () => {
    if (!activeCustomer) return;
    const destination = encodeURIComponent(`${activeCustomer.house_number}, ${activeCustomer.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank');
  };

  return (
    <Navigation>
      <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-12 antialiased selection:bg-sky-500 selection:text-white">
        
        {/* Top Dark Header Navigation Bar */}
        <div className="bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-3 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            
            {/* Left Controls: Date Picker & Route Selector */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
              {/* Date Input Box */}
              <div className="flex items-center space-x-1.5 bg-[#0f172a] border border-slate-700/70 px-2.5 py-1.5 rounded-xl text-slate-200 font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const prevDate = new Date(Date.parse(dateStr) - 86400000).toISOString().split('T')[0];
                    setDateStr(prevDate);
                  }}
                  className="hover:text-sky-400 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px]">{dateStr}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => {
                    const nextDate = new Date(Date.parse(dateStr) + 86400000).toISOString().split('T')[0];
                    setDateStr(nextDate);
                  }}
                  className="hover:text-sky-400 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Area / Route Filter Dropdown */}
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="bg-[#0f172a] border border-slate-700/70 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer shrink-0"
              >
                <option value="ALL">All areas</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700/70 text-slate-200 pl-8 pr-2 py-1.5 rounded-xl text-xs focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Right Status Counters */}
            <div className="flex items-center space-x-3 text-[11px] font-bold shrink-0 justify-end">
              <span className="text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>{deliveredCount} delivered</span>
              </span>
              <span className="text-slate-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                <span>{noDeliveryCount} no delivery</span>
              </span>
              <span className="text-amber-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>{pendingCount} pending</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subheader Index Indicator */}
        <div className="max-w-md mx-auto px-4 pt-3 pb-1 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div>
            Today - <b className="text-white">{filteredCustomers.length > 0 ? safeIndex + 1 : 0} of {filteredCustomers.length}</b>
          </div>
          {activeCustomerExistingDelivery && (
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
              ✓ Delivered ({activeCustomerExistingDelivery.total_milk_litres}L)
            </span>
          )}
        </div>

        {/* MAIN SLIDE CAROUSEL CONTAINER */}
        <div className="max-w-xl mx-auto px-2 flex items-center justify-center space-x-1 md:space-x-3">
          
          {/* Left Carousel Arrow */}
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            className="w-10 h-10 rounded-full bg-[#1e293b] border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition shadow-lg touch-manipulation"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* CENTRAL CARD CONTAINER (Fitted Mobile Card) */}
          <div className="max-w-md w-full bg-[#1e293b] border border-slate-700/70 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden transition-all">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No customers found matching your filter.
              </div>
            ) : activeCustomer ? (
              <form onSubmit={handleSaveAndNext} className="space-y-3">
                
                {/* 1. Customer Details Header */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        {activeCustomer.name}
                      </h2>
                      <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{activeCustomer.phone}</span>
                      </div>
                    </div>

                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-mono font-bold text-xs px-2.5 py-1 rounded-lg shrink-0">
                      {totalItemCount} items
                    </span>
                  </div>

                  {/* Location & Payment Terms */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center space-x-1 text-sky-400">
                      <MapPin className="w-3 h-3" />
                      <span>{activeCustomer.house_number}, {activeCustomer.location}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-slate-300">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>
                        {activeCustomer.payment_type === 'WEEKLY'
                          ? 'Weekly Payment'
                          : activeCustomer.payment_type === 'MONTHLY_ADVANCE'
                          ? 'Pays end of month'
                          : 'Daily Cash'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 2. Balance Due Alert Box */}
                <div className="bg-rose-950/40 border border-rose-800/40 text-rose-300 px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium">
                  <div className="flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Balance Due:</span>
                  </div>
                  <span className="font-bold text-rose-400 font-mono">- ₹0.00 Outstanding</span>
                </div>

                {/* 3. Navigation Action Button */}
                <button
                  type="button"
                  onClick={handleOpenNavigation}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm touch-manipulation"
                >
                  <NavIcon className="w-3.5 h-3.5" />
                  <span>Navigate to Location</span>
                </button>

                {/* 4. Quick Option Preset Banner */}
                {activeCustomer.notes && (
                  <div className="bg-sky-950/40 border border-sky-800/40 text-sky-200 px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium">
                    <span className="truncate pr-2">📌 <b>Note:</b> {activeCustomer.notes}</span>
                  </div>
                )}

                {/* 5. Daily Products Header & Skip Day Toggle */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Daily Products (Packet Qty)
                  </span>

                  <label className="inline-flex items-center cursor-pointer select-none space-x-2">
                    <span className="text-xs text-slate-400 font-medium">Skip day</span>
                    <input
                      type="checkbox"
                      checked={isSkipDay}
                      onChange={(e) => setIsSkipDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 relative"></div>
                  </label>
                </div>

                {/* 6. Product Grid (3x3 Grid of Compact Cards) */}
                {!isSkipDay ? (
                  <div className="grid grid-cols-3 gap-2">
                    {products.map((p, idx) => {
                      const colorScheme = getProductColor(idx);
                      const currentQty = packetCounts[p.id] || 0;

                      return (
                        <div
                          key={p.id}
                          className="bg-[#0f172a] border border-slate-700/70 p-2 rounded-xl flex flex-col justify-between space-y-1.5"
                        >
                          {/* Product Title Row */}
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-4 h-4 rounded-md ${colorScheme.bg} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                              {p.name.charAt(0)}
                            </span>
                            <span className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                              {p.name}
                            </span>
                          </div>

                          {/* Stepper Buttons Row */}
                          <div className="flex items-center justify-between bg-[#1e293b] border border-slate-700/80 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() =>
                                setPacketCounts({
                                  ...packetCounts,
                                  [p.id]: Math.max(0, currentQty - 1),
                                })
                              }
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center transition border border-slate-700 active:scale-95 touch-manipulation"
                            >
                              -
                            </button>

                            <span className="text-xs font-bold text-white font-mono text-center px-1">
                              {currentQty} <span className="text-[9px] text-slate-400 font-normal">pkt</span>
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setPacketCounts({
                                  ...packetCounts,
                                  [p.id]: currentQty + 1,
                                })
                              }
                              className="w-6 h-6 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center transition active:scale-95 touch-manipulation"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-amber-950/30 border border-amber-800/40 text-amber-300 p-4 rounded-xl text-center text-xs font-semibold space-y-1">
                    <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
                    <div>Marked as Skipped / No Delivery Today</div>
                  </div>
                )}

                {/* 7. Remarks Field */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="📝 Add a note / remark..."
                    className="w-full bg-[#0f172a] border border-slate-700/70 text-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
                  />
                </div>

                {/* 8. Secondary Utility Action Buttons Bar */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleCopyYesterday}
                    className="bg-[#0f172a] hover:bg-slate-800 text-slate-300 py-2 px-3 rounded-xl border border-slate-700/80 font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 touch-manipulation"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>Copy Yesterday</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-[#0f172a] hover:bg-slate-800 text-slate-300 py-2 px-3 rounded-xl border border-slate-700/80 font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 touch-manipulation"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>View History</span>
                  </button>
                </div>

                {/* Success Toast Banner */}
                {successMessage && (
                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* 9. Primary Bottom Action Button: Save & Next */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white py-3.5 rounded-xl font-black text-sm shadow-lg transition flex items-center justify-center space-x-2 touch-manipulation disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  <span>
                    {saving
                      ? 'Saving Record...'
                      : activeCustomerExistingDelivery
                      ? '✓ Update & Next'
                      : '✓ Save & Next'}
                  </span>
                </button>
              </form>
            ) : null}
          </div>

          {/* Right Carousel Arrow */}
          <button
            type="button"
            disabled={safeIndex === filteredCustomers.length - 1}
            onClick={() =>
              setCurrentSlideIndex((prev) =>
                Math.min(filteredCustomers.length - 1, prev + 1)
              )
            }
            className="w-10 h-10 rounded-full bg-[#1e293b] border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition shadow-lg touch-manipulation"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* HISTORY MODAL OVERLAY */}
        {showHistoryModal && activeCustomer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <h3 className="font-extrabold text-base text-white">
                    History - {activeCustomer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {deliveries
                  .filter((d) => d.customer_id === activeCustomer.id)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{d.delivery_date}</div>
                        <div className="text-slate-400">
                          {d.total_milk_litres}L Milk • {d.total_curd_packets} Curd
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{d.grand_total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                {deliveries.filter((d) => d.customer_id === activeCustomer.id).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No recent delivery history recorded for today.
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
