'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Customer, Route, AppUser, Product, PaymentType } from '@/lib/types';
import { Search, Plus, Edit, UserX, Eye, X, Check, Trash2 } from 'lucide-react';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    house_number: '',
    location: '',
    route_id: '',
    delivery_boy_id: '',
    payment_type: 'MONTHLY_ADVANCE' as PaymentType,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    notes: '',
  });

  const [productDefaults, setProductDefaults] = useState<{ [productId: string]: number }>({});
  
  // History Modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const reloadData = () => {
    setCustomers(store.getCustomers());
    const rList = store.getRoutes();
    setRoutes(rList);
    const dBoys = store.getDeliveryBoys();
    setDeliveryBoys(dBoys);
    const pList = store.getProducts();
    setProducts(pList);
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => { unsub(); };
  }, []);

  // Check URL query for add customer trigger
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('add=true')) {
      openAddModal();
    }
  }, [routes, deliveryBoys]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      house_number: '',
      location: '',
      route_id: routes[0]?.id || '',
      delivery_boy_id: deliveryBoys[0]?.id || '',
      payment_type: 'MONTHLY_ADVANCE',
      status: 'ACTIVE',
      notes: '',
    });

    const initDefaults: { [key: string]: number } = {};
    products.forEach((p) => {
      initDefaults[p.id] = 0;
    });
    setProductDefaults(initDefaults);
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      house_number: cust.house_number,
      location: cust.location,
      route_id: cust.route_id,
      delivery_boy_id: cust.delivery_boy_id,
      payment_type: cust.payment_type,
      status: cust.status,
      notes: cust.notes || '',
    });

    const custProds = store.getCustomerProducts(cust.id);
    const defaults: { [key: string]: number } = {};
    products.forEach((p) => {
      const match = custProds.find((cp) => cp.product_id === p.id);
      defaults[p.id] = match ? match.default_packets : 0;
    });
    setProductDefaults(defaults);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.house_number || !formData.location) {
      alert('Please fill out all required customer fields');
      return;
    }

    const reqs = Object.entries(productDefaults).map(([productId, defaultPackets]) => ({
      productId,
      defaultPackets,
    }));

    store.saveCustomer(
      {
        id: editingCustomer?.id,
        ...formData,
      },
      reqs
    );

    setShowModal(false);
  };

  const toggleCustomerStatus = (cust: Customer) => {
    const newStatus = cust.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (confirm(`Change status of ${cust.name} to ${newStatus}?`)) {
      store.saveCustomer(
        {
          id: cust.id,
          name: cust.name,
          phone: cust.phone,
          house_number: cust.house_number,
          location: cust.location,
          route_id: cust.route_id,
          delivery_boy_id: cust.delivery_boy_id,
          payment_type: cust.payment_type,
          status: newStatus,
          notes: cust.notes,
        },
        []
      );
    }
  };

  const handleDeleteCustomer = (cust: Customer) => {
    if (
      confirm(
        `Are you sure you want to delete customer "${cust.name}" (${cust.customer_code})?\nThis will remove their profile and default product requirements.`
      )
    ) {
      store.deleteCustomer(cust.id);
    }
  };

  // Filter customers by search term and route
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.house_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRoute = !selectedRouteFilter || c.route_id === selectedRouteFilter;
    return matchesSearch && matchesRoute;
  });

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Customer Management</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage customers, house numbers, routes, and regular daily milk requirements
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Customer</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Phone, Customer ID (e.g. C001), House (A-103), Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue"
            />
          </div>

          <select
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-white"
          >
            <option value="">All Routes ({routes.length})</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">House / Flat</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Delivery Boy</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const routeName = routes.find((r) => r.id === cust.route_id)?.name || 'N/A';
                    const dboyName = deliveryBoys.find((d) => d.id === cust.delivery_boy_id)?.name || 'N/A';
                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-nandini-blue">{cust.customer_code}</td>
                        <td className="p-3 font-semibold text-slate-900">
                          {cust.name}
                          <div className="text-[11px] text-slate-500 font-normal">{cust.phone}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{cust.house_number}</td>
                        <td className="p-3 text-slate-600">{cust.location}</td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate">{routeName}</td>
                        <td className="p-3 text-slate-600">{dboyName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {cust.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setHistoryCustomer(cust)}
                              title="View History"
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(cust)}
                              title="Edit Customer"
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-nandini-blue"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleCustomerStatus(cust)}
                              title={cust.status === 'ACTIVE' ? 'Disable Customer' : 'Enable Customer'}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-amber-600"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust)}
                              title="Delete Customer"
                              className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-4 sm:p-6 my-auto max-h-[90vh] sm:max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingCustomer ? `Edit Customer (${editingCustomer.customer_code})` : 'Add New Customer'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pr-1 mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9845012345"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      House / Flat Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.house_number}
                      onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                      placeholder="e.g. A-103"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Location / Apartment *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Orchid Enclave"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Assigned Route *
                    </label>
                    <select
                      value={formData.route_id}
                      onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                    >
                      <option value="">-- Assign Later (Unassigned Route) --</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Assigned Delivery Boy *
                    </label>
                    <select
                      value={formData.delivery_boy_id}
                      onChange={(e) => setFormData({ ...formData, delivery_boy_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
                    >
                      {deliveryBoys.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Default Regular Product Requirements */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                    Default / Regular Daily Product Requirements (Packets)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {products.map((p) => (
                      <div key={p.id} className="bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-slate-500 text-[11px] mb-1">₹{p.price}/pkt</div>
                        <input
                          type="number"
                          min="0"
                          value={productDefaults[p.id] || 0}
                          onChange={(e) =>
                            setProductDefaults({
                              ...productDefaults,
                              [p.id]: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-center font-bold text-sm bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Leave milk at door step box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 shrink-0 sticky bottom-0 bg-white z-10 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-nandini-blue text-white rounded-lg text-sm font-semibold hover:bg-nandini-dark shadow-xs flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Customer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Customer Delivery History Modal */}
        {historyCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Delivery History: {historyCustomer.name} ({historyCustomer.customer_code})
                  </h3>
                  <p className="text-xs text-slate-500">
                    House {historyCustomer.house_number}, {historyCustomer.location}
                  </p>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain space-y-3 pr-1">
                {store.getDeliveries(undefined, historyCustomer.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No delivery records found for this customer.
                  </div>
                ) : (
                  store
                    .getDeliveries(undefined, historyCustomer.id)
                    .sort((a, b) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime())
                    .map((del) => {
                      const items = store.getDeliveryItems(del.id);
                      return (
                        <div key={del.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs md:text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900">{del.delivery_date}</span>
                            <span className="font-semibold text-nandini-blue">Daily Total: ₹{del.grand_total}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-2">
                            {items.map((item) => (
                              <span key={item.id} className="bg-white px-2 py-1 rounded border border-slate-200">
                                {item.product_name}: <b>{item.packets_count} pkts</b> (₹{item.total_amount})
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200 pt-1">
                            <span>Milk Volume: {del.total_milk_litres}L • Delivery Charge: ₹{del.delivery_charge}</span>
                            <span className="font-bold text-emerald-700">{del.status}</span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
