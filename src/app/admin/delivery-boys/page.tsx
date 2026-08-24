'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { AppUser, Route } from '@/lib/types';
import { UserCheck, Plus, Edit, UserX, X, Check } from 'lucide-react';

export default function AdminDeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });


  const reload = () => {
    setDeliveryBoys(store.getDeliveryBoys());
    setRoutes(store.getRoutes());
  };

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);


  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      phone: '',
      username: '',
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      phone: u.phone,
      username: u.username || '',
      status: u.status,
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.username) {
      alert('Please fill all fields');
      return;
    }

    store.saveUser({
      id: editingUser?.id,
      name: formData.name,
      phone: formData.phone,
      role: 'DELIVERY_BOY',
      status: formData.status,
      username: formData.username,
    });

    setShowModal(false);
  };

  const toggleStatus = (u: AppUser) => {
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (confirm(`Change status of ${u.name} to ${nextStatus}?`)) {
      store.saveUser({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: nextStatus,
        username: u.username,
      });
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Delivery Boys</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage delivery boy accounts, login credentials, and assigned delivery routes
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-nandini-blue hover:bg-nandini-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Delivery Boy</span>
          </button>
        </div>

        {/* Delivery Boys Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryBoys.map((dboy) => {
            const assignedRoutes = routes.filter((r) => r.assigned_delivery_boy_id === dboy.id);
            const customerCount = store
              .getCustomers()
              .filter((c) => c.delivery_boy_id === dboy.id && c.status === 'ACTIVE').length;

            return (
              <div key={dboy.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-nandini-light text-nandini-blue flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{dboy.name}</h3>
                      <div className="text-xs text-slate-500">{dboy.phone}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dboy.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {dboy.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                  <div>
                    Login Username: <span className="font-mono font-bold text-nandini-blue">{dboy.username}</span>
                  </div>
                  <div>
                    Assigned Customers: <span className="font-bold text-slate-800">{customerCount} houses</span>
                  </div>
                  <div>
                    Assigned Routes:
                    {assignedRoutes.length === 0 ? (
                      <span className="text-slate-400 italic"> None</span>
                    ) : (
                      assignedRoutes.map((r) => (
                        <span key={r.id} className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 ml-1 font-medium text-slate-700">
                          {r.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
                  <button
                    onClick={() => openEditModal(dboy)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => toggleStatus(dboy)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 font-semibold rounded flex items-center space-x-1"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{dboy.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
                  </button>
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
                  {editingUser ? 'Edit Delivery Boy' : 'Add Delivery Boy'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543211"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Username / Login ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. boy1"
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
                    className="px-5 py-2 bg-nandini-blue text-white rounded-lg text-sm font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Account</span>
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

