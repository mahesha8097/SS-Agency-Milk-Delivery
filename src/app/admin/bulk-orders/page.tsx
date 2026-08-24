'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Customer, Route, AppUser, Product, PaymentType } from '@/lib/types';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  Truck,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Package,
  ShieldAlert,
  Receipt,
} from 'lucide-react';

export default function AdminBulkOrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    establishment_type: 'Hotel',
    phone: '',
    house_number: '',
    location: '',
    route_id: '',
    delivery_boy_id: '',
    payment_type: 'MONTHLY_ADVANCE' as PaymentType,
    notes: '',
    default_products: {} as Record<string, number>,
  });

  const reloadData = () => {
    const allCusts = store.getCustomers();
    const bulkCusts = allCusts.filter(
      (c) => c.customer_category === 'BULK_ORDER' || c.is_bulk_order
    );
    setCustomers(bulkCusts);
    setRoutes(store.getRoutes());
    setDeliveryBoys(store.getDeliveryBoys());
    setProducts(store.getProducts().filter((p) => p.active));
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      establishment_type: 'Hotel',
      phone: '',
      house_number: 'Main Premises',
      location: '',
      route_id: routes[0]?.id || '',
      delivery_boy_id: deliveryBoys[0]?.id || '',
      payment_type: 'MONTHLY_ADVANCE',
      notes: 'Bulk order account - ₹0 Delivery Charge',
      default_products: {},
    });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingId(customer.id);
    const existingProducts = store.getCustomerProducts(customer.id);
    const prodMap: Record<string, number> = {};
    existingProducts.forEach((cp) => {
      prodMap[cp.product_id] = cp.default_packets;
    });

    setFormData({
      name: customer.name,
      establishment_type: customer.establishment_type || 'Hotel',
      phone: customer.phone,
      house_number: customer.house_number,
      location: customer.location,
      route_id: customer.route_id,
      delivery_boy_id: customer.delivery_boy_id,
      payment_type: customer.payment_type,
      notes: customer.notes || '',
      default_products: prodMap,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.route_id) {
      alert('Please fill out all required fields.');
      return;
    }

    // Save default products
    const productReqs = Object.entries(formData.default_products)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => ({ productId: prodId, defaultPackets: qty }));

    const savedCustomer = store.saveCustomer(
      {
        id: editingId || undefined,
        name: formData.name,
        phone: formData.phone,
        house_number: formData.house_number || 'Main Gate',
        location: formData.location || 'City Area',
        route_id: formData.route_id,
        delivery_boy_id: formData.delivery_boy_id,
        payment_type: formData.payment_type,
        customer_category: 'BULK_ORDER',
        establishment_type: formData.establishment_type,
        is_bulk_order: true,
        status: 'ACTIVE',
        notes: formData.notes,
      },
      productReqs
    );

    setShowModal(false);
    reloadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete bulk account "${name}"?`)) {
      store.deleteCustomer(id);
      reloadData();
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.location.toLowerCase().includes(searchTerm);
    const matchesType =
      typeFilter === 'ALL' || c.establishment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const routeMap = new Map(routes.map((r) => [r.id, r.name]));
  const boyMap = new Map(deliveryBoys.map((b) => [b.id, b.name]));

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-nandini-blue font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Bulk Order Management</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Hotels, Restaurants & Institutional Customers
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage high-volume commercial accounts (Hotels, Schools, Restaurants, Caterers) with <b>₹0 Delivery Charges</b>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/bulk-orders/billing"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate Bulk Bills (Weekly / Monthly)</span>
            </Link>

            <button
              onClick={openAddModal}
              className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hotel / Bulk Account</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-start space-x-3 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-nandini-blue shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Zero Delivery Charge Policy:</span> All bulk order customers listed in this section automatically receive <b>₹0 Delivery Charges</b> on all daily milk and curd deliveries regardless of volume.
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hotel, school, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Filter Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Hotel">Hotels</option>
              <option value="Restaurant">Restaurants</option>
              <option value="School">Schools & Colleges</option>
              <option value="Caterer">Caterers</option>
              <option value="Office">Offices & Canteens</option>
            </select>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-base text-slate-700">No Bulk Accounts Added Yet</div>
              <p className="text-xs text-slate-500 mt-1">
                Click <b>Add Hotel / Bulk Account</b> above to add hotels, restaurants, or schools.
              </p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const reqs = store.getCustomerProducts(cust.id);
              return (
                <div
                  key={cust.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold uppercase tracking-wider mb-1">
                          {cust.establishment_type || 'Bulk Order'}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {cust.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ₹0 Delivery
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{cust.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cust.house_number}, {cust.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{routeMap.get(cust.route_id) || 'Unassigned Route'}</span>
                      </div>
                    </div>

                    {/* Product Requirement Summary */}
                    {reqs.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                          Daily Default Order
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reqs.map((r) => {
                            const prod = products.find((p) => p.id === r.product_id);
                            return (
                              <span
                                key={r.id}
                                className="bg-white px-2 py-0.5 border border-slate-200 rounded font-semibold text-slate-800 text-[11px]"
                              >
                                {prod?.name || 'Product'}: <b>{r.default_packets} pkts</b>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(cust)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id, cust.name)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
                <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                  <Building2 className="w-5 h-5" />
                  <span>{editingId ? 'Edit Bulk Order Account' : 'Add New Bulk Order Account'}</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Establishment Type *
                    </label>
                    <select
                      value={formData.establishment_type}
                      onChange={(e) => setFormData({ ...formData, establishment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                    >
                      <option value="Hotel">Hotel</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="School">School / College</option>
                      <option value="Caterer">Caterer / Party</option>
                      <option value="Office">Office Canteen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Establishment / Hotel Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Hotel Taj Residency"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Premises / Street Details
                    </label>
                    <input
                      type="text"
                      value={formData.house_number}
                      onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                      placeholder="e.g. Main Kitchen Gate"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Area / Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. MG Road Junction"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Assigned Route *
                    </label>
                    <select
                      value={formData.route_id}
                      onChange={(e) => {
                        const route = routes.find((r) => r.id === e.target.value);
                        setFormData({
                          ...formData,
                          route_id: e.target.value,
                          delivery_boy_id: route?.assigned_delivery_boy_id || formData.delivery_boy_id,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
                    >
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Default Daily Quantities */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="font-bold text-xs text-slate-800 uppercase">
                    Daily Default Order Quantities (Packets)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <span className="font-medium text-slate-700">{prod.name} (₹{prod.price})</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.default_products[prod.id] || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              default_products: {
                                ...formData.default_products,
                                [prod.id]: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center font-bold bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 sticky bottom-0 bg-white pt-3 border-t border-slate-200 flex justify-end space-x-3 z-10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-nandini-blue text-white font-semibold rounded-lg text-xs hover:bg-nandini-dark shadow-xs"
                  >
                    {editingId ? 'Update Account' : 'Save Bulk Account'}
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
