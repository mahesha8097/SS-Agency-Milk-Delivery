'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Route, AppUser, Customer } from '@/lib/types';
import { MapPin, Plus, Edit, X, Check, Users } from 'lucide-react';

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assigned_delivery_boy_id: '',
  });

  const reload = () => {
    setRoutes(store.getRoutes());
    setDeliveryBoys(store.getDeliveryBoys());
    setCustomers(store.getCustomers());
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);


  const openAddModal = () => {
    setEditingRoute(null);
    setFormData({
      name: '',
      description: '',
      assigned_delivery_boy_id: deliveryBoys[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (r: Route) => {
    setEditingRoute(r);
    setFormData({
      name: r.name,
      description: r.description || '',
      assigned_delivery_boy_id: r.assigned_delivery_boy_id || '',
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a route name');
      return;
    }

    store.saveRoute({
      id: editingRoute?.id,
      name: formData.name,
      description: formData.description,
      assigned_delivery_boy_id: formData.assigned_delivery_boy_id,
    });

    setShowModal(false);
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Route Management</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Create delivery routes, assign delivery boys, and group customer locations
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Route</span>
          </button>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => {
            const assignedDboy = deliveryBoys.find((d) => d.id === route.assigned_delivery_boy_id);
            const routeCustomers = customers.filter((c) => c.route_id === route.id && c.status === 'ACTIVE');

            return (
              <div key={route.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-nandini-light text-nandini-blue flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{route.name}</h3>
                      <p className="text-xs text-slate-500">{route.description || 'No description'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(route)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-500 block">Assigned Delivery Boy</span>
                    <span className="font-bold text-slate-900">{assignedDboy?.name || 'Unassigned'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Active Customers</span>
                    <span className="font-bold text-nandini-blue flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{routeCustomers.length} houses</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 uppercase block mb-1">
                    Route Customer Preview ({routeCustomers.length})
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {routeCustomers.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No active customers on this route.</span>
                    ) : (
                      routeCustomers.map((c) => (
                        <span key={c.id} className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-700">
                          {c.name} ({c.house_number})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingRoute ? 'Edit Route' : 'Create Route'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Route Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Route 1 - Orchid Enclave"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Covers Phase 1 houses"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Delivery Boy</label>
                  <select
                    value={formData.assigned_delivery_boy_id}
                    onChange={(e) => setFormData({ ...formData, assigned_delivery_boy_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white"
                  >
                    <option value="">Unassigned</option>
                    {deliveryBoys.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
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
                    className="px-5 py-2 bg-nandini-blue text-white rounded-lg text-sm font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Route</span>
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

