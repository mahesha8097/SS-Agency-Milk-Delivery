'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Expense, ExpenseCategory, PaymentMethod } from '@/lib/types';
import {
  Receipt,
  Plus,
  Calendar,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Ban,
  Edit2,
  TrendingDown,
  Tag,
  Fuel,
  Home,
  Zap,
  Wrench,
  ShoppingBag,
} from 'lucide-react';

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'VOIDED'>('ACTIVE');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form State
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('CASH');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // New Category State
  const [newCatName, setNewCatName] = useState('');

  // Void Reason State
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const reloadData = () => {
    setExpenses(store.getExpenses());
    const cats = store.getExpenseCategories();
    setCategories(cats);
    if (cats.length > 0 && !formCategoryId) {
      setFormCategoryId(cats[0].id);
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = store.subscribe(reloadData);
    return () => {
      unsub();
    };
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // Dashboard Metrics
  const activeExpenses = expenses.filter((e) => e.status === 'ACTIVE');
  const todayTotal = activeExpenses.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = activeExpenses.filter((e) => e.date.startsWith(currentMonthStr)).reduce((sum, e) => sum + e.amount, 0);

  const deliveryBoyExpenses = activeExpenses
    .filter((e) => e.category_name?.includes('Delivery Boy') || categoryMap.get(e.category_id)?.includes('Delivery Boy'))
    .reduce((sum, e) => sum + e.amount, 0);

  const otherExpenses = monthTotal - deliveryBoyExpenses;

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return expenses.filter((e) => {
      const catName = e.category_name || categoryMap.get(e.category_id) || '';
      const matchSearch =
        !term ||
        e.paid_to.toLowerCase().includes(term) ||
        catName.toLowerCase().includes(term) ||
        (e.description && e.description.toLowerCase().includes(term));

      const matchCat = categoryFilter === 'ALL' || e.category_id === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter, categoryMap]);

  const openAddExpense = () => {
    setFormCategoryId(categories[0]?.id || '');
    setFormAmount('');
    setFormDate(todayStr);
    setFormPaidTo('');
    setFormMethod('CASH');
    setFormDesc('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formAmount);
    if (!formCategoryId || isNaN(amt) || amt <= 0 || !formPaidTo.trim()) {
      setFormError('Please select a category, enter a valid amount and paid to recipient.');
      return;
    }

    store.addExpense({
      category_id: formCategoryId,
      amount: amt,
      date: formDate,
      paid_to: formPaidTo.trim(),
      payment_method: formMethod,
      description: formDesc.trim() || undefined,
    });

    setShowAddModal(false);
    reloadData();
  };

  const openEditExpense = (exp: Expense) => {
    setSelectedExpense(exp);
    setFormCategoryId(exp.category_id);
    setFormAmount(exp.amount.toString());
    setFormDate(exp.date);
    setFormPaidTo(exp.paid_to);
    setFormMethod(exp.payment_method);
    setFormDesc(exp.description || '');
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setFormError(null);

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0 || !formPaidTo.trim()) {
      setFormError('Please enter valid expense details.');
      return;
    }

    store.updateExpense(selectedExpense.id, {
      category_id: formCategoryId,
      category_name: categoryMap.get(formCategoryId) || selectedExpense.category_name,
      amount: amt,
      date: formDate,
      paid_to: formPaidTo.trim(),
      payment_method: formMethod,
      description: formDesc.trim() || undefined,
    });

    setShowEditModal(false);
    reloadData();
  };

  const openVoidExpense = (exp: Expense) => {
    setSelectedExpense(exp);
    setVoidReason('');
    setVoidError(null);
    setShowVoidModal(true);
  };

  const handleSaveVoidExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    if (!voidReason.trim()) {
      setVoidError('Please specify the reason for voiding this expense.');
      return;
    }

    store.voidExpense(selectedExpense.id, voidReason.trim());
    setShowVoidModal(false);
    reloadData();
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    store.addExpenseCategory(newCatName.trim());
    setNewCatName('');
    setShowAddCatModal(false);
    reloadData();
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Shop Expenses</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Track operational costs, delivery boy salaries, fuel, rent, and supplies with category controls.
            </p>
          </div>

          <div className="flex space-x-2 self-start md:self-auto">
            <button
              onClick={() => setShowAddCatModal(true)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Tag className="w-4 h-4 text-blue-600" />
              <span>+ Add Category</span>
            </button>
            <button
              onClick={openAddExpense}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Expense</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Expenses</span>
              <Receipt className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">₹{todayTotal.toFixed(0)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Recorded for {todayStr}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{monthTotal.toFixed(0)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Total operational cost</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Delivery Boy Payouts</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">₹{deliveryBoyExpenses.toFixed(0)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Delivery boy salaries & charges</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Other Expenses</span>
              <ShoppingBag className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-black text-slate-700">₹{otherExpenses.toFixed(0)}</div>
            <div className="text-[11px] text-slate-400 font-medium">Rent, petrol, maintenance</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search paid to, category, notes..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Expense Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
          >
            <option value="ACTIVE">Active Expenses Only</option>
            <option value="VOIDED">Voided Expenses Only</option>
            <option value="ALL">All Records</option>
          </select>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No expenses recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Record operational costs, fuel bills, and delivery boy payouts here.
              </p>
              <button
                onClick={openAddExpense}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                + Record First Expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => {
                    const isVoided = exp.status === 'VOIDED';
                    const catName = exp.category_name || categoryMap.get(exp.category_id) || 'Expense';

                    return (
                      <tr key={exp.id} className={`hover:bg-slate-50/70 transition ${isVoided ? 'bg-slate-50/50 opacity-60' : ''}`}>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {exp.date}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
                            {catName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{exp.paid_to}</div>
                          {exp.description && <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{exp.description}</div>}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`font-black text-sm ${isVoided ? 'line-through text-slate-400' : 'text-amber-700'}`}>
                            ₹{exp.amount.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {exp.payment_method}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isVoided ? (
                            <div>
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-bold">
                                VOIDED
                              </span>
                              {exp.void_reason && <div className="text-[10px] text-rose-600 italic mt-0.5">{exp.void_reason}</div>}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          {!isVoided && (
                            <>
                              <button
                                onClick={() => openEditExpense(exp)}
                                title="Edit Expense Details"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openVoidExpense(exp)}
                                title="Void Expense"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Record Shop Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddExpense} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Category *</label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold text-base text-amber-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paid To (Recipient) *</label>
                <input
                  type="text"
                  required
                  value={formPaidTo}
                  onChange={(e) => setFormPaidTo(e.target.value)}
                  placeholder="e.g. Ramesh (Delivery Boy), Landlord, Petrol Bunk"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Weekly petrol allowance"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Expense</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-bold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paid To *</label>
                <input
                  type="text"
                  required
                  value={formPaidTo}
                  onChange={(e) => setFormPaidTo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
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
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Expense Modal */}
      {showVoidModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-rose-700 flex items-center space-x-2">
                <Ban className="w-5 h-5" />
                <span>Void Expense</span>
              </h3>
              <button onClick={() => setShowVoidModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
              <div>Are you sure you want to void this expense of <strong>₹{selectedExpense.amount}</strong> paid to <strong>{selectedExpense.paid_to}</strong>?</div>
              <div className="text-[11px] text-rose-700">Voided expenses will be excluded from monthly expense reports.</div>
            </div>

            {voidError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs">
                {voidError}
              </div>
            )}

            <form onSubmit={handleSaveVoidExpense} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Voiding *
                </label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Duplicate entry, Cancelled order"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Confirm Void Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Expense Category</h3>
              <button onClick={() => setShowAddCatModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Vehicle Insurance, Packaging Bags"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
