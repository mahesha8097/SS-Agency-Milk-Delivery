'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { ShopSettings, ExpenseCategory, Product } from '@/lib/types';
import {
  Settings,
  Store,
  Package,
  Truck,
  FileText,
  Users,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Lock,
  Key,
  Edit2,
  Trash2,
  Search,
  Image as ImageIcon,
  Upload,
  X,
  Milk,
  Eye,
  EyeOff,
  ShoppingBag,
} from 'lucide-react';

type SettingsTab =
  | 'PROFILE'
  | 'PRODUCTS'
  | 'DELIVERY_CHARGES'
  | 'BILLING'
  | 'EXPENSES'
  | 'ACCOUNT';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [settings, setSettings] = useState<ShopSettings>(() => store.getShopSettings());
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => store.getExpenseCategories());
  const [products, setProducts] = useState<Product[]>(() => store.getProducts());

  // Product Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('MILK');
  const [prodUnit, setProdUnit] = useState('1L');
  const [prodPacketSize, setProdPacketSize] = useState<number>(1000);
  const [prodPrice, setProdPrice] = useState('');
  const [prodDeliveryCharge, setProdDeliveryCharge] = useState(true);
  const [prodActive, setProdActive] = useState(true);
  const [prodImageUrl, setProdImageUrl] = useState<string>('');
  const [productModalError, setProductModalError] = useState<string | null>(null);

  // Shop Profile Fields
  const [shopName, setShopName] = useState(settings.shop_name);
  const [adminName, setAdminName] = useState(settings.admin_name);
  const [phone, setPhone] = useState(settings.phone);
  const [alternatePhone, setAlternatePhone] = useState(settings.alternate_phone || '');
  const [address, setAddress] = useState(settings.address);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);
  const [footerMessage, setFooterMessage] = useState(settings.footer_message || '');

  // Delivery Charges Fields
  const [milk500Charge, setMilk500Charge] = useState(settings.milk_500ml_charge.toString());
  const [milk1LCharge, setMilk1LCharge] = useState(settings.milk_1L_charge.toString());
  const [curd1stCharge, setCurd1stCharge] = useState(settings.curd_first_packet_charge.toString());
  const [curdAddCharge, setCurdAddCharge] = useState(settings.curd_additional_packet_charge.toString());

  // Category State
  const [newCatName, setNewCatName] = useState('');

  // Password Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();

  const reload = () => {
    const s = store.getShopSettings();
    setSettings(s);
    setCategories(store.getExpenseCategories());
    setProducts(store.getProducts());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'PRODUCTS') setActiveTab('PRODUCTS');
      else if (tabParam === 'DELIVERY_CHARGES') setActiveTab('DELIVERY_CHARGES');
      else if (tabParam === 'BILLING') setActiveTab('BILLING');
      else if (tabParam === 'EXPENSES') setActiveTab('EXPENSES');
      else if (tabParam === 'ACCOUNT') setActiveTab('ACCOUNT');
    }

    reload();
    const unsub = store.subscribe(reload);
    return () => {
      unsub();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.product_code.toLowerCase().includes(productSearch.toLowerCase());
      const matchCategory =
        productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
      const matchStatus =
        productStatusFilter === 'ALL' ||
        (productStatusFilter === 'ACTIVE' && p.active) ||
        (productStatusFilter === 'INACTIVE' && !p.active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(null);

    store.updateShopSettings({
      shop_name: shopName.trim(),
      admin_name: adminName.trim(),
      phone: phone.replace(/\D/g, ''),
      alternate_phone: alternatePhone.replace(/\D/g, ''),
      address: address.trim(),
      invoice_prefix: invoicePrefix.trim().toUpperCase() || 'SS',
      footer_message: footerMessage.trim(),
      milk_500ml_charge: parseFloat(milk500Charge) || 2,
      milk_1L_charge: parseFloat(milk1LCharge) || 3,
      curd_first_packet_charge: parseFloat(curd1stCharge) || 2,
      curd_additional_packet_charge: parseFloat(curdAddCharge) || 1,
    });

    setSavedSuccess('Settings saved successfully!');
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    store.addExpenseCategory(newCatName.trim());
    setNewCatName('');
    reload();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentUser) return;
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    const res = await store.changePassword(currentUser.id, currentPass, newPass);
    if (res.success) {
      setPassSuccess(res.message);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassError(res.message);
    }
  };

  // Product Modal Handlers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('MILK');
    setProdUnit('1L');
    setProdPacketSize(1000);
    setProdPrice('');
    setProdDeliveryCharge(true);
    setProdActive(true);
    setProdImageUrl('');
    setProductModalError(null);
    setShowProductModal(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category || 'MILK');
    setProdUnit(p.unit || '1L');
    setProdPacketSize(p.packet_size_ml || 1000);
    setProdPrice(p.price.toString());
    setProdDeliveryCharge(p.delivery_charge_applicable !== false);
    setProdActive(p.active !== false);
    setProdImageUrl(p.image_url || '');
    setProductModalError(null);
    setShowProductModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProductModalError('Image size should be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setProdImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductModalError(null);

    const priceNum = parseFloat(prodPrice);
    if (!prodName.trim() || isNaN(priceNum) || priceNum <= 0) {
      setProductModalError('Please enter a valid product name and positive selling price.');
      return;
    }

    if (editingProduct) {
      store.updateProduct(editingProduct.id, {
        name: prodName.trim(),
        category: prodCategory,
        unit: prodUnit.trim(),
        packet_size_ml: prodPacketSize,
        price: priceNum,
        delivery_charge_applicable: prodDeliveryCharge,
        active: prodActive,
        image_url: prodImageUrl || undefined,
      });
      setSavedSuccess(`Product "${prodName.trim()}" updated successfully!`);
    } else {
      const code = `P${(products.length + 1).toString().padStart(3, '0')}`;
      store.addProduct({
        product_code: code,
        name: prodName.trim(),
        category: prodCategory,
        unit: prodUnit.trim(),
        packet_size_ml: prodPacketSize,
        price: priceNum,
        delivery_charge_applicable: prodDeliveryCharge,
        active: prodActive,
        image_url: prodImageUrl || undefined,
      });
      setSavedSuccess(`Product "${prodName.trim()}" added to catalog successfully!`);
    }

    setShowProductModal(false);
    setTimeout(() => setSavedSuccess(null), 3000);
    reload();
  };

  const handleToggleProductStatus = (p: Product) => {
    store.toggleProductStatus(p.id);
    reload();
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to remove or deactivate "${p.name}"?`)) {
      const res = store.deleteProduct(p.id);
      if (res.deactivated) {
        alert(res.message);
      } else {
        setSavedSuccess(res.message);
        setTimeout(() => setSavedSuccess(null), 3000);
      }
      reload();
    }
  };

  return (
    <Navigation>
      <main className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Shop & System Settings</h2>
          <p className="text-xs md:text-sm text-slate-500">
            Configure your shop identity, products, delivery charges, invoice headers, and account security.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{savedSuccess}</span>
          </div>
        )}

        {/* Settings Navigation Tabs: EXACT ORDER REQUESTED */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'PROFILE', label: 'Shop Profile', icon: Store },
            { id: 'PRODUCTS', label: 'Products', icon: Package },
            { id: 'DELIVERY_CHARGES', label: 'Delivery Charges', icon: Truck },
            { id: 'BILLING', label: 'Billing & Invoice', icon: FileText },
            { id: 'EXPENSES', label: 'Expense Categories', icon: Receipt },
            { id: 'ACCOUNT', label: 'Security & Password', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-nandini-blue text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. SHOP PROFILE SETTINGS */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
            <h3 className="text-base font-black text-slate-900">Nandini Shop Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proprietor / Admin Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alternate Phone (Optional)</label>
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shop Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Profile</span>
            </button>
          </form>
        )}

        {/* 2. PRODUCT MANAGEMENT */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            {/* Products Header & Action */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Product Catalog & Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage Nandini milk, curd, ghee, and sweets with custom prices, images, and delivery charge applicability.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddProductModal}
                className="px-4 py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 self-start sm:self-auto transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Product</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search products by name or code..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-slate-50"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="flex-1 md:flex-initial px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-nandini-blue"
                >
                  <option value="ALL">All Categories</option>
                  <option value="MILK">Milk</option>
                  <option value="CURD">Curd</option>
                  <option value="BUTTERMILK">Buttermilk</option>
                  <option value="PANEER">Paneer</option>
                  <option value="GHEE">Ghee</option>
                  <option value="SWEETS">Sweets</option>
                  <option value="OTHER">Other</option>
                </select>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="flex-1 md:flex-initial px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-nandini-blue"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Products Card Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No products found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {productSearch || productCategoryFilter !== 'ALL' || productStatusFilter !== 'ALL'
                    ? 'Try adjusting your search query or filters to find products.'
                    : 'Click "+ Add Product" above to create your first shop product.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between space-y-4 ${
                        p.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50/60'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          {/* Product Image Thumbnail */}
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Deactivate / Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {p.product_code}
                            </span>
                            <span className="text-[11px] font-bold text-nandini-blue uppercase">
                              {p.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1 line-clamp-1">{p.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Pack size: {p.unit || `${p.packet_size_ml}ml`} ({p.packet_size_ml} ml/g)
                          </p>
                        </div>

                        {/* Delivery Charge Indicator */}
                        <div className="pt-1">
                          <span
                            className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.delivery_charge_applicable
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <Truck className="w-3 h-3" />
                            <span>
                              {p.delivery_charge_applicable ? 'Delivery Charge: YES' : 'Delivery Charge: NO (₹0)'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Price & Status Toggle */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Selling Price</div>
                          <div className="text-lg font-black text-slate-900">₹{p.price.toFixed(2)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                            p.active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {p.active ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. DELIVERY CHARGES CONFIGURATION */}
        {activeTab === 'DELIVERY_CHARGES' && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 max-w-2xl text-xs sm:text-sm">
            <div>
              <h3 className="text-base font-black text-slate-900">Delivery Charge Calculation Rules</h3>
              <p className="text-xs text-slate-500">Configured rates for House customers. Bulk customers are always ₹0.00.</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs uppercase text-blue-900">Milk Delivery Charges (House Customers)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">500ml Milk Packet (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={milk500Charge}
                    onChange={(e) => setMilk500Charge(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Standard: ₹2.00</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1.0 Litre Milk (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={milk1LCharge}
                    onChange={(e) => setMilk1LCharge(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Combined milk volume (e.g. 500ml + 500ml = 1L -&gt; ₹3)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs uppercase text-emerald-900">Curd Delivery Charges (House Customers)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1st Curd Packet (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={curd1stCharge}
                    onChange={(e) => setCurd1stCharge(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Standard: ₹2.00</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Each Additional Packet (+₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={curdAddCharge}
                    onChange={(e) => setCurdAddCharge(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500">2 pkts = ₹3, 3 pkts = ₹4</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Delivery Charge Rules</span>
            </button>
          </form>
        )}

        {/* 3. BILLING SETTINGS */}
        {activeTab === 'BILLING' && (
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs sm:text-sm">
            <h3 className="text-base font-black text-slate-900">Customer Bill & Invoice Format</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Number Prefix *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="e.g. SS, NANDINI"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Bills will be generated like: {invoicePrefix}-202609-C001</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Footer Message</label>
              <textarea
                rows={2}
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-800">Automatic Credit & Due Carry Forward</div>
              <p className="text-slate-500 text-[11px]">
                Prepaid customer credit and postpaid unpaid debts are automatically carried forward from previous months to ensure 100% financial transparency.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Billing Settings</span>
            </button>
          </form>
        )}

        {/* 4. EXPENSE CATEGORIES */}
        {activeTab === 'EXPENSES' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 max-w-2xl text-xs sm:text-sm">
            <h3 className="text-base font-black text-slate-900">Custom Expense Categories</h3>

            <form onSubmit={handleAddCategory} className="flex space-x-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Enter new category name (e.g. Vehicle Insurance)"
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                + Add Category
              </button>
            </form>

            <div className="space-y-1.5 pt-2">
              {categories.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ACCOUNT & SECURITY */}
        {activeTab === 'ACCOUNT' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 max-w-2xl text-xs sm:text-sm">
            <h3 className="text-base font-black text-slate-900">Admin Account Security</h3>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">Logged in as: {currentUser?.name}</div>
              <div className="text-slate-500 font-mono">Username: @{currentUser?.username} • Role: {currentUser?.role}</div>
            </div>

            {passSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase text-slate-700">Change Admin Password</h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </form>
          </div>
        )}

        {/* Add / Edit Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-nandini-blue flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {productModalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{productModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
                {/* Product Image Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Product Image (Optional)
                  </label>
                  <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {prodImageUrl ? (
                        <img src={prodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-nandini-blue text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition">
                        <Upload className="w-3.5 h-3.5 text-nandini-blue" />
                        <span>{prodImageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {prodImageUrl && (
                        <button
                          type="button"
                          onClick={() => setProdImageUrl('')}
                          className="block text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Remove Photo
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">PNG, JPG or WEBP up to 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Special Toned Milk 1L, Curd 500g, Nandini Ghee 500ml"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-medium"
                  />
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Category *
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdCategory(val);
                        if (val === 'MILK' || val === 'CURD') {
                          setProdDeliveryCharge(true);
                        }
                      }}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none bg-white font-medium"
                    >
                      <option value="MILK">Milk</option>
                      <option value="CURD">Curd</option>
                      <option value="BUTTERMILK">Buttermilk</option>
                      <option value="PANEER">Paneer</option>
                      <option value="GHEE">Ghee</option>
                      <option value="SWEETS">Sweets</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Unit / Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodUnit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdUnit(val);
                        if (val.includes('500')) setProdPacketSize(500);
                        else if (val.includes('1L') || val.includes('1000') || val.includes('1kg')) setProdPacketSize(1000);
                        else if (val.includes('200')) setProdPacketSize(200);
                      }}
                      placeholder="e.g. 1L, 500ml, 200g, 500g, 1kg"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pack Size & Selling Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Pack Volume / Size (ml or g) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={prodPacketSize}
                      onChange={(e) => setProdPacketSize(parseInt(e.target.value, 10) || 1000)}
                      placeholder="1000"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="e.g. 48.00"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-black text-slate-900"
                    />
                  </div>
                </div>

                {/* Delivery Charge Rule Checkbox */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodDeliveryCharge}
                      onChange={(e) => setProdDeliveryCharge(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-nandini-blue rounded-sm focus:ring-nandini-blue"
                    />
                    <div className="text-xs text-slate-700">
                      <span className="font-bold block">Apply Delivery Charge Rule</span>
                      <span className="text-[11px] text-slate-500">
                        Enable to calculate delivery charges for House customers based on milk/curd volume rules.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Active Status Checkbox */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodActive}
                      onChange={(e) => setProdActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                    />
                    <div className="text-xs text-slate-700">
                      <span className="font-bold block">Product is Active</span>
                      <span className="text-[11px] text-slate-500">Active products appear for subscriptions and delivery.</span>
                    </div>
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-nandini-blue hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Product</span>
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
