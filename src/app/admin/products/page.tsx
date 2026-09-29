'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Product } from '@/lib/types';
import {
  Package,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Milk,
  Check,
  Search,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Truck,
  Save,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('MILK');
  const [formUnit, setFormUnit] = useState('1L');
  const [formPacketSizeMl, setFormPacketSizeMl] = useState<number>(1000);
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDeliveryChargeApplicable, setFormDeliveryChargeApplicable] = useState(true);
  const [formActive, setFormActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reload = () => setProducts(store.getProducts());

  useEffect(() => {
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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('MILK');
    setFormUnit('1L');
    setFormPacketSizeMl(1000);
    setFormPrice('');
    setFormDeliveryChargeApplicable(true);
    setFormActive(true);
    setFormImageUrl('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category || 'MILK');
    setFormUnit(p.unit || '1L');
    setFormPacketSizeMl(p.packet_size_ml || 1000);
    setFormPrice(p.price.toString());
    setFormDeliveryChargeApplicable(p.delivery_charge_applicable !== false);
    setFormActive(p.active !== false);
    setFormImageUrl(p.image_url || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image size should be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formPrice);
    if (!formName.trim() || isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid product name and positive selling price.');
      return;
    }

    if (editingProduct) {
      store.updateProduct(editingProduct.id, {
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        packet_size_ml: formPacketSizeMl,
        price: priceNum,
        delivery_charge_applicable: formDeliveryChargeApplicable,
        active: formActive,
        image_url: formImageUrl || undefined,
      });
      setToastMessage(`Product "${formName.trim()}" updated successfully!`);
    } else {
      const code = `P${(products.length + 1).toString().padStart(3, '0')}`;
      store.addProduct({
        product_code: code,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        packet_size_ml: formPacketSizeMl,
        price: priceNum,
        delivery_charge_applicable: formDeliveryChargeApplicable,
        active: formActive,
        image_url: formImageUrl || undefined,
      });
      setToastMessage(`Product "${formName.trim()}" added to catalog successfully!`);
    }

    setShowModal(false);
    setTimeout(() => setToastMessage(null), 3000);
    reload();
  };

  const handleToggleStatus = (p: Product) => {
    store.toggleProductStatus(p.id);
    reload();
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to remove or deactivate "${p.name}"?`)) {
      const res = store.deleteProduct(p.id);
      if (res.deactivated) {
        alert(res.message);
      } else {
        setToastMessage(res.message);
        setTimeout(() => setToastMessage(null), 3000);
      }
      reload();
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Configure Nandini milk, curd, ghee, paneer, and sweets with custom prices, images, and delivery charge rules.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-nandini-blue hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center space-x-2 shadow-sm transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

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

        {/* Products Grid */}
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
                      {/* Product Image */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
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

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {p.product_code}
                        </span>
                        <span className="text-[11px] font-bold text-nandini-blue uppercase">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Pack size: {p.unit || `${p.packet_size_ml}ml`} ({p.packet_size_ml} ml/g)
                      </p>
                    </div>

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

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Selling Price</div>
                      <div className="text-lg font-black text-slate-900">₹{p.price.toFixed(2)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(p)}
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

      </main>

      {/* Add / Edit Product Modal */}
      {showModal && (
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
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Product Image (Optional)
                </label>
                <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {formImageUrl ? (
                      <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-nandini-blue text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition">
                      <Upload className="w-3.5 h-3.5 text-nandini-blue" />
                      <span>{formImageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="block text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400">PNG, JPG or WEBP up to 2MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Special Toned Milk 1L"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value === 'MILK' || e.target.value === 'CURD') {
                        setFormDeliveryChargeApplicable(true);
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit / Volume</label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => {
                      setFormUnit(e.target.value);
                      if (e.target.value.includes('500')) setFormPacketSizeMl(500);
                      else if (e.target.value.includes('1L') || e.target.value.includes('1000')) setFormPacketSizeMl(1000);
                      else if (e.target.value.includes('200')) setFormPacketSizeMl(200);
                    }}
                    placeholder="e.g. 1L, 500ml, 200g, 500g"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pack Size (ml or g)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPacketSizeMl}
                    onChange={(e) => setFormPacketSizeMl(parseInt(e.target.value, 10) || 1000)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 48"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-nandini-blue focus:outline-none font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDeliveryChargeApplicable}
                    onChange={(e) => setFormDeliveryChargeApplicable(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-nandini-blue rounded-sm focus:ring-nandini-blue"
                  />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold block">Apply Delivery Charge</span>
                    <span className="text-[11px] text-slate-500">Calculate delivery charges for house customers based on volume</span>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold block">Product is Active</span>
                    <span className="text-[11px] text-slate-500">Active products appear for customer subscriptions and delivery.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm transition flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Navigation>
  );
}
