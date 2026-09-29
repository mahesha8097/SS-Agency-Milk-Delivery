'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import {
  Customer,
  AppUser,
  Product,
  CustomerType,
  PaymentType,
  PaymentMethod,
  DailyDelivery,
  MonthlyInvoice,
  Payment,
  CustomerProductRequirement,
} from '@/lib/types';
import {
  Search,
  Plus,
  Edit2,
  UserX,
  Eye,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Truck,
  IndianRupee,
  FileText,
  CreditCard,
  Building2,
  Home,
  Check,
  Calendar,
  AlertCircle,
  Navigation as NavIcon,
  Users,
  ShoppingBag,
} from 'lucide-react';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'HOUSE' | 'BULK'>('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'ALL' | 'PREPAID' | 'POSTPAID'>('ALL');
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Customer Form Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formHouseNumber, setFormHouseNumber] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formCustomerType, setFormCustomerType] = useState<CustomerType>('HOUSE');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formPaymentType, setFormPaymentType] = useState<PaymentType>('PREPAID');
  const [formDeliveryBoyId, setFormDeliveryBoyId] = useState('');
  const [formOpeningCredit, setFormOpeningCredit] = useState('0');
  const [formOpeningPending, setFormOpeningPending] = useState('0');
  const [formDeliveryOrder, setFormDeliveryOrder] = useState('0');
  const [formProducts, setFormProducts] = useState<{ product_id: string; quantity: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Customer Detail Drawer / Modal State
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'OVERVIEW' | 'DELIVERIES' | 'BILLS' | 'PAYMENTS'>('OVERVIEW');

  // Quick Payment Modal from Customer Detail
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentMethod>('UPI');
  const [quickPayRef, setQuickPayRef] = useState('');
  const [quickPayNotes, setQuickPayNotes] = useState('');

  const reloadData = () => {
    setCustomers(store.getCustomers());
    setDeliveryBoys(store.getDeliveryBoys().filter((db) => db.status === 'ACTIVE'));
    setProducts(store.getProducts().filter((p) => p.active));
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, []);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return customers.filter((c) => {
      const matchSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.customer_code.toLowerCase().includes(term) ||
        (c.business_name && c.business_name.toLowerCase().includes(term)) ||
        (c.location && c.location.toLowerCase().includes(term));

      const matchType = typeFilter === 'ALL' || c.customer_type === typeFilter;
      const matchPayType = paymentTypeFilter === 'ALL' || c.payment_type === paymentTypeFilter;
      const matchBoy = deliveryBoyFilter === 'ALL' || c.assigned_delivery_boy_id === deliveryBoyFilter || c.delivery_boy_id === deliveryBoyFilter;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchSearch && matchType && matchPayType && matchBoy && matchStatus;
    });
  }, [customers, searchTerm, typeFilter, paymentTypeFilter, deliveryBoyFilter, statusFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormHouseNumber('');
    setFormLocation('');
    setFormLandmark('');
    setFormLatitude('');
    setFormLongitude('');
    setFormCustomerType('HOUSE');
    setFormBusinessName('');
    setFormPaymentType('PREPAID');
    setFormDeliveryBoyId(deliveryBoys[0]?.id || '');
    setFormOpeningCredit('0');
    setFormOpeningPending('0');
    setFormDeliveryOrder('0');

    // Default with first milk product
    const defaultProd = products[0];
    setFormProducts(defaultProd ? [{ product_id: defaultProd.id, quantity: 1 }] : []);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormAddress(c.address || '');
    setFormHouseNumber(c.house_number || '');
    setFormLocation(c.location || '');
    setFormLandmark(c.landmark || '');
    setFormLatitude(c.latitude ? c.latitude.toString() : '');
    setFormLongitude(c.longitude ? c.longitude.toString() : '');
    setFormCustomerType(c.customer_type || 'HOUSE');
    setFormBusinessName(c.business_name || '');
    setFormPaymentType(c.payment_type || 'PREPAID');
    setFormDeliveryBoyId(c.assigned_delivery_boy_id || c.delivery_boy_id || '');
    setFormOpeningCredit(c.opening_credit ? c.opening_credit.toString() : '0');
    setFormOpeningPending(c.opening_pending ? c.opening_pending.toString() : '0');
    setFormDeliveryOrder(c.delivery_order ? c.delivery_order.toString() : '0');

    const reqs = store.getCustomerProducts(c.id);
    setFormProducts(
      reqs.length > 0
        ? reqs.map((r) => ({ product_id: r.product_id, quantity: r.quantity }))
        : products[0]
        ? [{ product_id: products[0].id, quantity: 1 }]
        : []
    );

    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!formName.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    const payload = {
      name: formName.trim(),
      phone: cleanPhone,
      address: formAddress.trim() || formLocation.trim() || 'Bangalore',
      house_number: formHouseNumber.trim(),
      location: formLocation.trim(),
      landmark: formLandmark.trim(),
      latitude: formLatitude ? parseFloat(formLatitude) : undefined,
      longitude: formLongitude ? parseFloat(formLongitude) : undefined,
      customer_type: formCustomerType,
      business_name: formCustomerType === 'BULK' ? formBusinessName.trim() : undefined,
      payment_type: formPaymentType,
      billing_type: formPaymentType,
      assigned_delivery_boy_id: formDeliveryBoyId || undefined,
      delivery_boy_id: formDeliveryBoyId || undefined,
      opening_credit: parseFloat(formOpeningCredit) || 0,
      opening_pending: parseFloat(formOpeningPending) || 0,
      delivery_order: parseInt(formDeliveryOrder, 10) || 0,
      status: 'ACTIVE' as const,
    };

    let savedCust: Customer;
    if (editingCustomer) {
      savedCust = store.updateCustomer(editingCustomer.id, payload)!;
    } else {
      const code = `C${(customers.length + 1).toString().padStart(3, '0')}`;
      savedCust = store.addCustomer({ ...payload, customer_code: code });
    }

    // Save product subscriptions
    store.setCustomerProducts(savedCust.id, formProducts);
    setShowModal(false);
    reloadData();
  };

  const handleDeactivate = (c: Customer) => {
    if (confirm(`Are you sure you want to deactivate customer "${c.name}"? Historical delivery and billing records will remain safely preserved.`)) {
      store.deactivateCustomer(c.id);
      if (viewingCustomer?.id === c.id) {
        setViewingCustomer(null);
      }
      reloadData();
    }
  };

  // Helper to compute balance display without negative numbers
  const getCustomerBalanceDisplay = (c: Customer) => {
    const invoices = store.getInvoices().filter((inv) => inv.customer_id === c.id);
    const latestInvoice = invoices[invoices.length - 1];

    const credit = latestInvoice ? latestInvoice.remaining_credit || 0 : c.opening_credit || 0;
    const pending = latestInvoice ? latestInvoice.remaining_pending || 0 : c.opening_pending || 0;

    if (credit > 0) {
      return <span className="text-emerald-700 font-bold">Credit: ₹{credit.toFixed(0)}</span>;
    }
    if (pending > 0) {
      return <span className="text-rose-600 font-bold">Pending: ₹{pending.toFixed(0)}</span>;
    }
    return <span className="text-slate-500 font-semibold">Cleared</span>;
  };

  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer) return;
    const amt = parseFloat(quickPayAmount);
    if (!amt || amt <= 0) return;

    store.recordPayment({
      customer_id: viewingCustomer.id,
      amount: amt,
      payment_method: quickPayMethod,
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: quickPayRef.trim() || undefined,
      notes: quickPayNotes.trim() || undefined,
    });

    setQuickPayAmount('');
    setQuickPayRef('');
    setQuickPayNotes('');
    setShowQuickPayModal(false);
    reloadData();
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Customer Management</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage residential and bulk subscribers, assign delivery routes, and track ledger balances.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-nandini-blue hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-2 shadow-sm transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, code, address..."
                className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="HOUSE">House Customers</option>
              <option value="BULK">Bulk / Commercial</option>
            </select>

            {/* Payment Type Filter */}
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Billing Modes</option>
              <option value="PREPAID">Prepaid</option>
              <option value="POSTPAID">Postpaid</option>
            </select>

            {/* Delivery Boy Filter */}
            <select
              value={deliveryBoyFilter}
              onChange={(e) => setDeliveryBoyFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
            >
              <option value="ALL">All Delivery Boys</option>
              {deliveryBoys.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customers Table / Card View */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No customers found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm ? 'Try adjusting your search or filters.' : 'Add your first customer to start dispatching daily milk.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-nandini-blue text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  + Add First Customer
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Delivery Boy</th>
                    <th className="py-3 px-4">Daily Subscription</th>
                    <th className="py-3 px-4">Balance Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => {
                    const assignedBoy = deliveryBoys.find((db) => db.id === c.assigned_delivery_boy_id || db.id === c.delivery_boy_id);
                    const reqs = store.getCustomerProducts(c.id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{c.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                              {c.customer_code}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                            {c.house_number && <span>• {c.house_number}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              c.customer_type === 'BULK'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.customer_type === 'BULK' ? '🏨 Bulk' : '🏠 House'} ({c.payment_type})
                          </span>
                          {c.business_name && (
                            <div className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]">
                              {c.business_name}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">
                            {assignedBoy ? assignedBoy.name : <span className="text-amber-600 text-xs">Unassigned</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {reqs.length === 0 ? (
                            <span className="text-slate-400 text-xs">No items configured</span>
                          ) : (
                            <div className="space-y-0.5">
                              {reqs.map((r) => {
                                const prod = products.find((p) => p.id === r.product_id);
                                return (
                                  <div key={r.id} className="text-xs text-slate-700 font-medium">
                                    {prod?.name || 'Product'} × <strong>{r.quantity}</strong>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getCustomerBalanceDisplay(c)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => {
                              setViewingCustomer(c);
                              setActiveDetailTab('OVERVIEW');
                            }}
                            title="View Customer 360"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Customer Details"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(c)}
                            title="Deactivate Customer"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          >
                            <UserX className="w-4 h-4" />
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

      {/* Customer Form Modal (Add / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-base font-black text-slate-900">
                {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Customer Type & Billing Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCustomerType('HOUSE')}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        formCustomerType === 'HOUSE' ? 'bg-nandini-blue text-white shadow-xs' : 'bg-white border text-slate-700'
                      }`}
                    >
                      🏠 House
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCustomerType('BULK')}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        formCustomerType === 'BULK' ? 'bg-nandini-blue text-white shadow-xs' : 'bg-white border text-slate-700'
                      }`}
                    >
                      🏨 Bulk / Hotel
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaymentType('PREPAID')}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        formPaymentType === 'PREPAID' ? 'bg-nandini-blue text-white shadow-xs' : 'bg-white border text-slate-700'
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentType('POSTPAID')}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        formPaymentType === 'POSTPAID' ? 'bg-nandini-blue text-white shadow-xs' : 'bg-white border text-slate-700'
                      }`}
                    >
                      Postpaid
                    </button>
                  </div>
                </div>
              </div>

              {formCustomerType === 'BULK' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business / Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="e.g. Udupi Grand Restaurant"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              )}

              {/* Address, House Number & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">House/Flat Number</label>
                  <input
                    type="text"
                    value={formHouseNumber}
                    onChange={(e) => setFormHouseNumber(e.target.value)}
                    placeholder="e.g. Flat #302, Tower B"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location / Society</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Orchid Enclave"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Landmark</label>
                  <input
                    type="text"
                    value={formLandmark}
                    onChange={(e) => setFormLandmark(e.target.value)}
                    placeholder="e.g. Near Community Hall"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Boy Assignment & Route Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Delivery Boy</label>
                  <select
                    value={formDeliveryBoyId}
                    onChange={(e) => setFormDeliveryBoyId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                  >
                    <option value="">Unassigned</option>
                    {deliveryBoys.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name} ({db.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Order Sequence</label>
                  <input
                    type="number"
                    value={formDeliveryOrder}
                    onChange={(e) => setFormDeliveryOrder(e.target.value)}
                    placeholder="e.g. 1, 2, 3"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Opening Credit and Pending */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opening Credit Available (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formOpeningCredit}
                    onChange={(e) => setFormOpeningCredit(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-semibold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opening Pending Due (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formOpeningPending}
                    onChange={(e) => setFormOpeningPending(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-semibold text-rose-600"
                  />
                </div>
              </div>

              {/* Product Subscriptions Selection */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-slate-700">Daily Product Requirements</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length > 0) {
                        setFormProducts([...formProducts, { product_id: products[0].id, quantity: 1 }]);
                      }
                    }}
                    className="text-xs text-nandini-blue font-bold hover:underline"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {formProducts.map((item, idx) => {
                    const selProd = products.find((p) => p.id === item.product_id);
                    return (
                      <div key={idx} className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200">
                        {/* Thumbnail */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {selProd?.image_url ? (
                            <img src={selProd.image_url} alt={selProd.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        <select
                          value={item.product_id}
                          onChange={(e) => {
                            const updated = [...formProducts];
                            updated[idx].product_id = e.target.value;
                            setFormProducts(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.price}/{p.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...formProducts];
                            updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                            setFormProducts(updated);
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-center font-bold"
                          title="Quantity in packets"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setFormProducts(formProducts.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 360 Detail View Drawer / Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <span>{viewingCustomer.name}</span>
                  <span className="text-xs font-mono bg-blue-50 text-nandini-blue px-2 py-0.5 rounded-lg">
                    {viewingCustomer.customer_code}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">{viewingCustomer.address}</p>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Navigation Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center space-x-3 text-xs font-bold">
                <span>Account Balance:</span>
                {getCustomerBalanceDisplay(viewingCustomer)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowQuickPayModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
                {viewingCustomer.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      viewingCustomer.latitude && viewingCustomer.longitude
                        ? `${viewingCustomer.latitude},${viewingCustomer.longitude}`
                        : `${viewingCustomer.address} ${viewingCustomer.location || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-nandini-blue font-bold text-xs rounded-xl flex items-center space-x-1"
                  >
                    <NavIcon className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </a>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              {(['OVERVIEW', 'DELIVERIES', 'BILLS', 'PAYMENTS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    activeDetailTab === tab ? 'bg-nandini-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="py-2 text-xs sm:text-sm">
              {activeDetailTab === 'OVERVIEW' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Customer Type</span>
                      <div className="font-bold text-slate-900">{viewingCustomer.customer_type} ({viewingCustomer.payment_type})</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Assigned Delivery Boy</span>
                      <div className="font-bold text-slate-900">
                        {deliveryBoys.find((db) => db.id === viewingCustomer.assigned_delivery_boy_id || db.id === viewingCustomer.delivery_boy_id)?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-[11px] text-slate-500 font-bold uppercase">Active Product Subscriptions</span>
                    {store.getCustomerProducts(viewingCustomer.id).map((req) => {
                      const prod = products.find((p) => p.id === req.product_id);
                      return (
                        <div key={req.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 font-medium text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {prod?.image_url ? (
                                <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <span className="font-semibold text-slate-800">{prod?.name || 'Product'}</span>
                          </div>
                          <span className="text-slate-700"><strong>{req.quantity}</strong> pkts (₹{prod?.price})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeDetailTab === 'DELIVERIES' && (
                <div className="space-y-2">
                  {store.getDeliveries().filter((d) => d.customer_id === viewingCustomer.id).length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No delivery records found for this customer.</div>
                  ) : (
                    store
                      .getDeliveries()
                      .filter((d) => d.customer_id === viewingCustomer.id)
                      .slice(0, 15)
                      .map((del) => (
                        <div key={del.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{del.delivery_date}</div>
                            <div className="text-slate-500 text-[11px]">{del.status} • {del.delivered_at || 'Delivered'}</div>
                          </div>
                          <div className="font-bold text-slate-800">₹{del.grand_total.toFixed(0)}</div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeDetailTab === 'BILLS' && (
                <div className="space-y-2">
                  {store.getInvoices().filter((inv) => inv.customer_id === viewingCustomer.id).length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No bills generated yet for this customer.</div>
                  ) : (
                    store
                      .getInvoices()
                      .filter((inv) => inv.customer_id === viewingCustomer.id)
                      .map((inv) => (
                        <div key={inv.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                          <div>
                            <div className="font-bold text-slate-900">{inv.month_year} ({inv.invoice_number})</div>
                            <div className="text-[11px] text-slate-500">Status: {inv.status}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">Total: ₹{inv.grand_total.toFixed(0)}</div>
                            <div className="text-[11px] text-rose-600 font-semibold">Payable: ₹{inv.total_payable?.toFixed(0) || inv.amount_payable.toFixed(0)}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeDetailTab === 'PAYMENTS' && (
                <div className="space-y-2">
                  {store.getPayments(undefined, viewingCustomer.id).length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No payments recorded yet.</div>
                  ) : (
                    store.getPayments(undefined, viewingCustomer.id).map((pay) => (
                      <div key={pay.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-900">{pay.payment_date} ({pay.payment_method})</div>
                          {pay.reference_number && <div className="text-[11px] text-slate-500 font-mono">Ref: {pay.reference_number}</div>}
                        </div>
                        <div className="text-emerald-700 font-black text-sm">
                          +₹{pay.amount.toFixed(0)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {showQuickPayModal && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Record Payment: {viewingCustomer.name}</h3>
              <button onClick={() => setShowQuickPayModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPaymentSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={quickPayMethod}
                  onChange={(e) => setQuickPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer / IMPS</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / Notes (Optional)</label>
                <input
                  type="text"
                  value={quickPayRef}
                  onChange={(e) => setQuickPayRef(e.target.value)}
                  placeholder="UPI Ref ID or Note"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickPayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
