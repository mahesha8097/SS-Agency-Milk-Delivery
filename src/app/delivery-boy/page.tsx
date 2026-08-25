'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Customer, Product, DeliveryStatus, DailyDelivery, Route } from '@/lib/types';
import { calculateDeliveryTotals } from '@/lib/calculations';
import {
  Search,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Plus,
  Minus,
  MapPin,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  Copy,
  Info,
} from 'lucide-react';

export default function DeliveryBoyPage() {
  const currentUser = store.getCurrentUser();

  const [dateStr, setDateStr] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);

  // Selection & Search State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);

  // Delivery Form State
  const [packetCounts, setPacketCounts] = useState<{ [productId: string]: number }>({});
  const [additionalProductIds, setAdditionalProductIds] = useState<string[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('DELIVERED');
  const [remarks, setRemarks] = useState('');
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [showMoreStatus, setShowMoreStatus] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isPastDate = dateStr !== '' && dateStr < todayStr;

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

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.house_number.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term) ||
        c.customer_code.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }, [customers, searchTerm]);

  // Select initial customer if none selected
  useEffect(() => {
    if (filteredCustomers.length > 0 && !selectedCustomerId) {
      const firstPending = filteredCustomers.find((c) => !store.getExistingDelivery(c.id, dateStr));
      setSelectedCustomerId((firstPending || filteredCustomers[0]).id);
    }
  }, [filteredCustomers, selectedCustomerId, dateStr]);

  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null;
  }, [customers, filteredCustomers, selectedCustomerId]);

  // Load customer form state when active customer or dateStr changes
  useEffect(() => {
    if (activeCustomer) {
      loadCustomerFormData(activeCustomer);
    }
  }, [activeCustomer?.id, dateStr]);

  const loadCustomerFormData = (cust: Customer) => {
    setToastMessage(null);
    setShowMoreStatus(false);
    setShowAddProductModal(false);

    const date = dateStr || new Date().toISOString().split('T')[0];
    const existing = store.getExistingDelivery(cust.id, date);
    const allProds = store.getProducts().filter((p) => p.active);
    const defaults: { [key: string]: number } = {};
    const extraIds: string[] = [];

    if (existing) {
      setDeliveryStatus(existing.status);
      setRemarks(existing.remarks || '');
      setShowRemarksInput(!!existing.remarks);

      const items = store.getDeliveryItems(existing.id);
      allProds.forEach((p) => {
        const item = items.find((i) => i.product_id === p.id);
        defaults[p.id] = item ? item.packets_count : 0;
        if (item && item.packets_count > 0) {
          const custReqs = store.getCustomerProducts(cust.id);
          const isReq = custReqs.some((cr) => cr.product_id === p.id && cr.default_packets > 0);
          if (!isReq) extraIds.push(p.id);
        }
      });
    } else {
      setDeliveryStatus('DELIVERED');
      setRemarks('');
      setShowRemarksInput(false);

      const custReqs = store.getCustomerProducts(cust.id);
      allProds.forEach((p) => {
        const req = custReqs.find((cr) => cr.product_id === p.id);
        defaults[p.id] = req ? req.default_packets : 0;
      });
    }

    setPacketCounts(defaults);
    setAdditionalProductIds(extraIds);
  };

  const activeExistingDelivery = activeCustomer
    ? store.getExistingDelivery(activeCustomer.id, dateStr)
    : undefined;

  const assignedRoute = routes.find((r) => r.assigned_delivery_boy_id === currentUser?.id);

  // Compute regular products to show
  const displayedProducts = useMemo(() => {
    if (!activeCustomer) return [];
    const custReqs = store.getCustomerProducts(activeCustomer.id);
    const regularIds = new Set<string>();

    custReqs.forEach((cr) => {
      if (cr.default_packets > 0) regularIds.add(cr.product_id);
    });

    additionalProductIds.forEach((id) => regularIds.add(id));

    if (regularIds.size === 0) {
      products.forEach((p) => {
        if (p.category === 'MILK') regularIds.add(p.id);
      });
    }

    return products.filter((p) => regularIds.has(p.id));
  }, [activeCustomer, additionalProductIds, products]);

  // Non-displayed products for "+ Add Product" modal
  const availableExtraProducts = useMemo(() => {
    const displayedSet = new Set(displayedProducts.map((p) => p.id));
    return products.filter((p) => !displayedSet.has(p.id));
  }, [products, displayedProducts]);

  // Live Calculations
  const packetEntries = useMemo(() => {
    return Object.entries(packetCounts).map(([productId, packetsCount]) => ({
      productId,
      packetsCount,
    }));
  }, [packetCounts]);

  const isBulk = activeCustomer?.customer_category === 'BULK_ORDER' || activeCustomer?.is_bulk_order;
  const liveTotals = calculateDeliveryTotals(packetEntries, products, !!isBulk);

  // Navigation Index Helpers
  const currentIndex = useMemo(() => {
    if (!activeCustomer) return 0;
    return filteredCustomers.findIndex((c) => c.id === activeCustomer.id);
  }, [filteredCustomers, activeCustomer]);

  const handlePrevCustomer = () => {
    if (currentIndex > 0) {
      setSelectedCustomerId(filteredCustomers[currentIndex - 1].id);
    }
  };

  const handleNextCustomer = () => {
    if (currentIndex < filteredCustomers.length - 1) {
      setSelectedCustomerId(filteredCustomers[currentIndex + 1].id);
    }
  };

  const getNextPendingCustomerId = (fromIdx: number): string | null => {
    for (let i = fromIdx + 1; i < filteredCustomers.length; i++) {
      const del = store.getExistingDelivery(filteredCustomers[i].id, dateStr);
      if (!del) return filteredCustomers[i].id;
    }
    for (let i = 0; i < fromIdx; i++) {
      const del = store.getExistingDelivery(filteredCustomers[i].id, dateStr);
      if (!del) return filteredCustomers[i].id;
    }
    return fromIdx < filteredCustomers.length - 1 ? filteredCustomers[fromIdx + 1].id : null;
  };

  // Save Delivery Record & Fast Auto-Next
  const handleSaveDelivery = async (statusOverride?: DeliveryStatus, customPacketEntries?: { productId: string; packetsCount: number }[]) => {
    if (!activeCustomer || !currentUser) return;
    const targetStatus = statusOverride || deliveryStatus;
    const entriesToSave = customPacketEntries || (targetStatus === 'DELIVERED' ? packetEntries : []);

    setSaving(true);
    try {
      await store.saveDailyDelivery(
        activeCustomer.id,
        currentUser.id,
        activeCustomer.route_id,
        dateStr,
        targetStatus,
        entriesToSave,
        remarks,
        activeExistingDelivery?.id
      );

      setSaving(false);
      setToastMessage(`✓ Saved for ${activeCustomer.name}`);

      // Fast auto-advance to next customer after 400ms
      setTimeout(() => {
        setToastMessage(null);
        const nextId = getNextPendingCustomerId(currentIndex);
        if (nextId) {
          setSelectedCustomerId(nextId);
        }
      }, 400);
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert('Error saving delivery record');
    }
  };

  // SINGLE UNIFIED "COPY YESTERDAY" BUTTON HANDLER
  const handleCopyYesterday = () => {
    if (!activeCustomer) return;
    const yesterday = new Date(Date.parse(dateStr || new Date().toISOString()) - 86400000)
      .toISOString()
      .split('T')[0];
    const prevDelivery = store.getExistingDelivery(activeCustomer.id, yesterday);
    const allProds = store.getProducts().filter((p) => p.active);
    const defaults: { [key: string]: number } = {};
    const extraIds: string[] = [];

    if (prevDelivery) {
      const items = store.getDeliveryItems(prevDelivery.id);
      allProds.forEach((p) => {
        const item = items.find((i) => i.product_id === p.id);
        defaults[p.id] = item ? item.packets_count : 0;
        if (item && item.packets_count > 0) {
          const custReqs = store.getCustomerProducts(activeCustomer.id);
          const isReq = custReqs.some((cr) => cr.product_id === p.id && cr.default_packets > 0);
          if (!isReq) extraIds.push(p.id);
        }
      });
      setPacketCounts(defaults);
      setAdditionalProductIds(extraIds);
      setDeliveryStatus('DELIVERED');
      setToastMessage(`✓ Copied yesterday's packets for ${activeCustomer.name}`);
      setTimeout(() => setToastMessage(null), 1500);
    } else {
      const custReqs = store.getCustomerProducts(activeCustomer.id);
      allProds.forEach((p) => {
        const req = custReqs.find((cr) => cr.product_id === p.id);
        defaults[p.id] = req ? req.default_packets : 0;
      });
      setPacketCounts(defaults);
      setToastMessage(`No delivery recorded yesterday; reset to regular requirements.`);
      setTimeout(() => setToastMessage(null), 1500);
    }
  };

  const handleAddExtraProduct = (prodId: string) => {
    setAdditionalProductIds((prev) => [...prev, prodId]);
    setPacketCounts((prev) => ({ ...prev, [prodId]: prev[prodId] || 1 }));
    setShowAddProductModal(false);
  };

  // Header Progress Calculations
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const totalCount = customers.length;
  const progressPercent = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  return (
    <Navigation>
      <div className="min-h-screen bg-slate-100 text-slate-800 antialiased pb-16 lg:pb-6">
        
        {/* TOP COMPACT HEADER BAR WITH CALENDAR DATE PICKER */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
            
            {/* Title & Route Info + Calendar Date Picker */}
            <div className="flex items-center space-x-2 min-w-0">
              {/* Mobile Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowCustomerDrawer(true)}
                className="lg:hidden p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 shrink-0 font-bold text-xs"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Customers</span>
              </button>

              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base md:text-lg font-bold text-nandini-blue leading-tight truncate">
                    {assignedRoute?.name || 'Assigned Route'}
                  </h1>
                </div>

                {/* Calendar Date Picker Control */}
                <div className="flex items-center space-x-1 text-[11px] text-slate-600 mt-0.5">
                  <span className="font-semibold hidden sm:inline">Date:</span>
                  <div className="flex items-center space-x-1 bg-slate-100 border border-slate-300 rounded-md px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const prevDate = new Date(Date.parse(dateStr || todayStr) - 86400000)
                          .toISOString()
                          .split('T')[0];
                        setDateStr(prevDate);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold px-0.5"
                      title="Previous Day"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <CalendarIcon className="w-3.5 h-3.5 text-nandini-blue shrink-0" />
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-900 focus:outline-none cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const nextDate = new Date(Date.parse(dateStr || todayStr) + 86400000)
                          .toISOString()
                          .split('T')[0];
                        setDateStr(nextDate);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-bold px-0.5"
                      title="Next Day"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Badge */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="text-right">
                <div className="text-sm md:text-base font-black text-slate-900 leading-none">
                  {deliveredCount} / {totalCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Completed ({progressPercent}%)
                </div>
              </div>
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full bg-slate-200 h-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* MAIN CONTAINER: TWO-COLUMN RESPONSIVE LAYOUT */}
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            
            {/* =================================================== */}
            {/* DESKTOP LEFT COLUMN: CUSTOMER SIDEBAR (Hidden on Mobile) */}
            {/* =================================================== */}
            <div className="hidden lg:block lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3 sticky top-20 max-h-[calc(100vh-100px)] flex flex-col shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <span>Customers ({dateStr})</span>
                  <span className="text-xs bg-blue-50 text-nandini-blue px-2 py-0.5 rounded-full font-mono">
                    {filteredCustomers.length}
                  </span>
                </h2>
              </div>

              {/* Sidebar Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, house..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50 font-medium"
                />
              </div>

              {/* Sidebar Customer Item List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredCustomers.map((cust) => {
                  const del = store.getExistingDelivery(cust.id, dateStr);
                  const isDone = !!del;
                  const isActive = activeCustomer?.id === cust.id;

                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-blue-50/90 border-nandini-blue shadow-2xs font-semibold'
                          : isDone
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-700 hover:border-emerald-300'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 truncate">{cust.name}</span>
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                            {cust.house_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{cust.location}</div>
                      </div>

                      {/* Status Icon Indicator */}
                      <div className="shrink-0 font-bold text-[11px]">
                        {isDone ? (
                          <span className="text-emerald-700 flex items-center space-x-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            <span>Done ({del.total_milk_litres}L)</span>
                          </span>
                        ) : isActive ? (
                          <span className="text-nandini-blue font-bold">→ Active</span>
                        ) : (
                          <span className="text-slate-400 font-mono">○ Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =================================================== */}
            {/* RIGHT COLUMN: COMPACT DELIVERY CARD & ACTIONS */}
            {/* =================================================== */}
            <div className="w-full lg:col-span-8 space-y-3">
              
              {/* Past Date Warning Indicator Banner */}
              {isPastDate && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-amber-700" />
                    <span>Viewing Past Delivery Details for <b>{dateStr}</b></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDateStr(todayStr)}
                    className="text-nandini-blue underline text-[11px] hover:text-blue-900"
                  >
                    Go to Today
                  </button>
                </div>
              )}

              {/* Toast Confirmation Message */}
              {toastMessage && (
                <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-md animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{toastMessage}</span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-mono">Auto-advancing ➔</span>
                </div>
              )}

              {activeCustomer ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  
                  {/* Top Customer Header Card & Stepper Navigation */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                          {activeCustomer.name}
                        </h2>
                        <span className="bg-nandini-blue text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                          {activeCustomer.house_number}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          ({activeCustomer.customer_code})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center space-x-2 mt-0.5 flex-wrap">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{activeCustomer.location}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{activeCustomer.phone}</span>
                        </span>
                      </div>

                      {/* Customer Note if present */}
                      {activeCustomer.notes && (
                        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mt-2 font-medium inline-block">
                          📌 <b>Note:</b> {activeCustomer.notes}
                        </div>
                      )}
                    </div>

                    {/* Compact Previous / Next Navigation Arrows */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={handlePrevCustomer}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs transition flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      <button
                        type="button"
                        disabled={currentIndex === filteredCustomers.length - 1}
                        onClick={handleNextCustomer}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs transition flex items-center space-x-1"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recorded Delivery Status Banner for Selected Date */}
                  {activeExistingDelivery && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Delivery recorded for <b>{dateStr}</b> (<b>{activeExistingDelivery.total_milk_litres}L Milk</b>). Editing updates record.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* REGULAR PRODUCTS ONLY SECTION */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Items for {dateStr} (Packet Qty)
                      </span>

                      <div className="flex items-center space-x-2">
                        {/* SINGLE UNIFIED COPY YESTERDAY BUTTON */}
                        <button
                          type="button"
                          onClick={handleCopyYesterday}
                          className="text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300 transition"
                          title="Copy yesterday's packet counts for this customer"
                        >
                          <Copy className="w-3.5 h-3.5 text-nandini-blue" />
                          <span>📋 Copy Yesterday</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(true)}
                          className="text-nandini-blue hover:underline font-bold text-xs flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Product</span>
                        </button>
                      </div>
                    </div>

                    {/* Product Quantity Control Rows */}
                    <div className="space-y-2">
                      {displayedProducts.map((p) => {
                        const count = packetCounts[p.id] || 0;

                        return (
                          <div
                            key={p.id}
                            className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                              <div className="text-[11px] text-slate-500">
                                ₹{p.price}/pkt • {p.category === 'MILK' ? `${p.packet_size_ml}ml Milk` : 'Curd'}
                              </div>
                            </div>

                            {/* Touch-Friendly Compact Steppers [-] 1 [+] */}
                            <div className="flex items-center space-x-2 bg-white border border-slate-300 p-1 rounded-lg shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  setPacketCounts((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(0, count - 1),
                                  }))
                                }
                                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-sm flex items-center justify-center transition touch-manipulation"
                              >
                                -
                              </button>

                              <span className="w-8 text-center font-mono font-black text-sm text-slate-900">
                                {count}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setPacketCounts((prev) => ({
                                    ...prev,
                                    [p.id]: count + 1,
                                  }))
                                }
                                className="w-7 h-7 rounded bg-nandini-blue hover:bg-nandini-dark active:bg-blue-900 text-white font-bold text-sm flex items-center justify-center transition touch-manipulation"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REMARKS TOGGLE & INPUT */}
                  <div>
                    {!showRemarksInput ? (
                      <button
                        type="button"
                        onClick={() => setShowRemarksInput(true)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Add Remark / Note</span>
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Delivery Remark
                        </label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Customer requested only 500ml today"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-slate-50 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* COMPACT LIGHT-THEMED BILLING SUMMARY */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 font-medium">
                      <div>
                        Milk: <b className="text-slate-900 font-bold">{liveTotals.totalMilkLitres} L</b>
                      </div>
                      <div>
                        Curd: <b className="text-slate-900 font-bold">{liveTotals.totalCurdPackets} Pkts</b>
                      </div>
                      <div>
                        Products: <b className="text-slate-900 font-bold">₹{liveTotals.productTotal.toFixed(2)}</b>
                      </div>
                      <div>
                        Delivery: <b className="text-slate-900 font-bold">₹{liveTotals.deliveryCharge.toFixed(2)}</b>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm md:text-base font-black text-slate-900">
                      <span>DAILY GRAND TOTAL:</span>
                      <span className="text-nandini-blue">₹{liveTotals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* MAIN ACTION BUTTONS: [ ✓ DELIVERED ] + [ More ▼ ] */}
                  <div className="pt-2 relative">
                    <div className="flex items-center space-x-2">
                      {/* Main Save & Deliver Button */}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveDelivery('DELIVERED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3.5 px-4 rounded-xl font-black text-sm md:text-base shadow-md transition flex items-center justify-center space-x-2 touch-manipulation"
                      >
                        <Check className="w-5 h-5" />
                        <span>
                          {saving
                            ? 'Saving...'
                            : activeExistingDelivery
                            ? `✓ UPDATE DELIVERY (${dateStr})`
                            : '✓ DELIVERED'}
                        </span>
                      </button>

                      {/* Dropdown toggle for alternative statuses */}
                      <button
                        type="button"
                        onClick={() => setShowMoreStatus((prev) => !prev)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-3.5 rounded-xl font-bold text-xs border border-slate-300 flex items-center space-x-1 shrink-0"
                      >
                        <span>More</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alternative Delivery Status Popup Dropdown */}
                    {showMoreStatus && (
                      <div className="absolute right-0 bottom-14 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Alternative Status:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreStatus(false);
                            handleSaveDelivery('SKIPPED_BY_CUSTOMER');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-lg transition"
                        >
                          Skipped by Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreStatus(false);
                            handleSaveDelivery('CUSTOMER_UNAVAILABLE');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          Customer Unavailable
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreStatus(false);
                            handleSaveDelivery('DELIVERY_ISSUE');
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          Delivery Issue / Incident
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                  No customer selected or assigned.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE OVERLAY DRAWER: CUSTOMER LIST */}
        {showCustomerDrawer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-start lg:hidden">
            <div className="w-4/5 max-w-xs bg-white h-full p-4 space-y-3 flex flex-col shadow-2xl animate-slideRight">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  Select Customer ({filteredCustomers.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomerDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Drawer Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, house..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50"
                />
              </div>

              {/* Mobile Customer List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredCustomers.map((cust) => {
                  const del = store.getExistingDelivery(cust.id, dateStr);
                  const isDone = !!del;
                  const isActive = activeCustomer?.id === cust.id;

                  return (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setShowCustomerDrawer(false);
                      }}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-blue-50 border-nandini-blue font-bold text-nandini-blue'
                          : isDone
                          ? 'bg-emerald-50 border-emerald-200 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-900 truncate">
                          {cust.name} <span className="font-mono text-xs text-slate-500">({cust.house_number})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{cust.location}</div>
                      </div>
                      {isDone && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: + ADD EXTRA PRODUCT */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-nandini-blue" />
                  <span>Add Extra Product Today</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {availableExtraProducts.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs font-medium">
                    All active products are already added to today's list.
                  </div>
                ) : (
                  availableExtraProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddExtraProduct(p.id)}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-nandini-blue hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">₹{p.price} / packet</div>
                      </div>
                      <span className="text-nandini-blue font-bold text-xs flex items-center space-x-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </Navigation>
  );
}
