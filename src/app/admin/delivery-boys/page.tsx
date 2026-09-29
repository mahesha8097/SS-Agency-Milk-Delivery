'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { AppUser, Customer, DailyDelivery } from '@/lib/types';
import {
  UserCheck,
  Plus,
  Edit2,
  UserX,
  X,
  CheckCircle2,
  Key,
  Users,
  Search,
  Truck,
  CheckSquare,
  Square,
  AlertTriangle,
  History,
  Clock,
  Phone,
} from 'lucide-react';

export default function AdminDeliveryBoysPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<AppUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedBoy, setSelectedBoy] = useState<AppUser | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Customer Assignment State
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedCustIds, setSelectedCustIds] = useState<string[]>([]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const reloadData = () => {
    setDeliveryBoys(store.getDeliveryBoys());
    setCustomers(store.getCustomers());
    setDeliveries(store.getDeliveries(todayStr));
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, [todayStr]);

  const activeBoysCount = deliveryBoys.filter((db) => db.status === 'ACTIVE').length;
  const inactiveBoysCount = deliveryBoys.filter((db) => db.status === 'INACTIVE').length;

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormUsername('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveNewBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Mobile number must be 10 digits.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (formPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      await store.addDeliveryBoy({
        name: formName.trim(),
        phone: cleanPhone,
        username: formUsername.trim().toLowerCase(),
        passwordInput: formPassword,
      });
      setShowAddModal(false);
      reloadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create delivery boy.');
    }
  };

  const handleOpenEdit = (boy: AppUser) => {
    setSelectedBoy(boy);
    setFormName(boy.name);
    setFormPhone(boy.phone);
    setFormUsername(boy.username);
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveEditBoy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoy) return;

    store.updateDeliveryBoy(selectedBoy.id, {
      name: formName.trim(),
      phone: formPhone.replace(/\D/g, ''),
    });
    setShowEditModal(false);
    reloadData();
  };

  const handleOpenAssign = (boy: AppUser) => {
    setSelectedBoy(boy);
    setAssignSearch('');
    const assigned = customers
      .filter((c) => (c.assigned_delivery_boy_id === boy.id || c.delivery_boy_id === boy.id) && c.status === 'ACTIVE')
      .map((c) => c.id);
    setSelectedCustIds(assigned);
    setShowAssignModal(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedBoy) return;
    store.assignDeliveryBoyToCustomers(selectedCustIds, selectedBoy.id);
    setShowAssignModal(false);
    reloadData();
  };

  const handleOpenResetPass = (boy: AppUser) => {
    setSelectedBoy(boy);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError(null);
    setShowResetPassModal(true);
  };

  const handleSaveResetPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!selectedBoy) return;
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    await store.resetDeliveryBoyPassword(selectedBoy.id, newPassword);
    setShowResetPassModal(false);
    reloadData();
  };

  const handleDeactivate = (boy: AppUser) => {
    const assigned = customers.filter(
      (c) => (c.assigned_delivery_boy_id === boy.id || c.delivery_boy_id === boy.id) && c.status === 'ACTIVE'
    );

    let msg = `Are you sure you want to deactivate delivery boy "${boy.name}"?`;
    if (assigned.length > 0) {
      msg += `\n\nWARNING: ${assigned.length} customer(s) are currently assigned to this delivery boy. You may reassign them to another delivery boy.`;
    }

    if (confirm(msg)) {
      store.deactivateDeliveryBoy(boy.id);
      reloadData();
    }
  };

  const handleOpenHistory = (boy: AppUser) => {
    setSelectedBoy(boy);
    setShowHistoryModal(true);
  };

  // Filtered customer list for assignment modal
  const assignFilteredCustomers = useMemo(() => {
    const term = assignSearch.toLowerCase().trim();
    const activeCusts = customers.filter((c) => c.status === 'ACTIVE');
    if (!term) return activeCusts;
    return activeCusts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.customer_code.toLowerCase().includes(term) ||
        (c.location && c.location.toLowerCase().includes(term))
    );
  }, [customers, assignSearch]);

  const toggleSelectAllAssign = () => {
    const allFilteredIds = assignFilteredCustomers.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) => selectedCustIds.includes(id));

    if (allSelected) {
      setSelectedCustIds(selectedCustIds.filter((id) => !allFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedCustIds, ...allFilteredIds]));
      setSelectedCustIds(merged);
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Delivery Boys</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage delivery boys, set individual login credentials, and assign daily delivery routes.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-nandini-blue hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-2 shadow-sm transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Delivery Boy</span>
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Delivery Boys</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{deliveryBoys.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeBoysCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inactive</span>
            <div className="text-2xl font-black text-slate-400 mt-1">{inactiveBoysCount}</div>
          </div>
        </div>

        {/* Delivery Boys List Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {deliveryBoys.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No delivery boys found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your delivery boys to assign daily milk routes and allow them to log in.
              </p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-nandini-blue text-white rounded-xl text-xs font-bold shadow-sm"
              >
                + Add First Delivery Boy
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name & Login ID</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Assigned Customers</th>
                    <th className="py-3 px-4">Today's Deliveries</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveryBoys.map((boy) => {
                    const assignedCount = customers.filter(
                      (c) => (c.assigned_delivery_boy_id === boy.id || c.delivery_boy_id === boy.id) && c.status === 'ACTIVE'
                    ).length;

                    const boyDeliveries = deliveries.filter((d) => d.delivery_boy_id === boy.id);
                    const deliveredCount = boyDeliveries.filter((d) => d.status === 'DELIVERED').length;

                    return (
                      <tr key={boy.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{boy.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">@{boy.username}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {boy.phone}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleOpenAssign(boy)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-nandini-blue font-bold text-xs rounded-xl transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{assignedCount} Assigned</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-emerald-700">{deliveredCount}</span>
                          <span className="text-slate-400 font-semibold"> / {assignedCount} Delivered</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              boy.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {boy.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleOpenHistory(boy)}
                            title="View Delivery History"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenResetPass(boy)}
                            title="Reset Login Password"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(boy)}
                            title="Edit Profile"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {boy.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDeactivate(boy)}
                              title="Deactivate Account"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Add Delivery Boy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Delivery Boy</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewBoy} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 9876543211"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Login Username *</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. boy_ramesh"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && selectedBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Delivery Boy: {selectedBoy.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBoy} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Assignment Drawer / Modal */}
      {showAssignModal && selectedBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">Assign Customers to {selectedBoy.name}</h3>
                <p className="text-xs text-slate-500">Select which customers will appear on this delivery boy's daily app</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Select All */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search customer by name, phone, code..."
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={toggleSelectAllAssign}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl whitespace-nowrap"
              >
                Select / Deselect All
              </button>
            </div>

            {/* Customers Checkbox List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 space-y-1">
              {assignFilteredCustomers.map((c) => {
                const isSelected = selectedCustIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustIds([...selectedCustIds, c.id]);
                          } else {
                            setSelectedCustIds(selectedCustIds.filter((id) => id !== c.id));
                          }
                        }}
                        className="w-4 h-4 text-nandini-blue rounded-sm focus:ring-nandini-blue"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{c.name} <span className="font-mono text-slate-400">({c.customer_code})</span></div>
                        <div className="text-[11px] text-slate-500">{c.phone} • {c.house_number || c.location || 'Bangalore'}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                      {c.customer_type}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 font-bold">
                {selectedCustIds.length} customer(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  Save Customer Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassModal && selectedBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Reset Password: {selectedBoy.name}</h3>
              <button onClick={() => setShowResetPassModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResetPass} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery History Modal */}
      {showHistoryModal && selectedBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">Delivery History: {selectedBoy.name}</h3>
                <p className="text-xs text-slate-500">Historical delivery executions and timestamps</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-1">
              {store
                .getDeliveries()
                .filter((d) => d.delivery_boy_id === selectedBoy.id)
                .slice(0, 30).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No historical deliveries recorded yet for {selectedBoy.name}.
                </div>
              ) : (
                store
                  .getDeliveries()
                  .filter((d) => d.delivery_boy_id === selectedBoy.id)
                  .slice(0, 30)
                  .map((del) => {
                    const cust = customers.find((c) => c.id === del.customer_id);
                    return (
                      <div key={del.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-900">{cust?.name || 'Customer'}</div>
                          <div className="text-[11px] text-slate-500">
                            {del.delivery_date} • {del.delivered_at || 'Delivered'} • {del.status}
                          </div>
                        </div>
                        <div className="text-right font-bold text-slate-800">
                          ₹{del.grand_total.toFixed(0)}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </Navigation>
  );
}
