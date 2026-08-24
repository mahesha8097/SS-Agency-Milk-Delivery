'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Product, ProductCategory } from '@/lib/types';
import {
  Package,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
  Plus,
  Milk,
  Droplets,
  Box,
  GlassWater,
  Coffee,
  Heart,
  Sparkles,
  ShoppingBag,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { id: 'Milk', label: 'Milk', Icon: Milk },
  { id: 'Droplets', label: 'Curd / Liquid', Icon: Droplets },
  { id: 'Package', label: 'Package', Icon: Package },
  { id: 'Box', label: 'Box', Icon: Box },
  { id: 'GlassWater', label: 'Glass', Icon: GlassWater },
  { id: 'Coffee', label: 'Beverage', Icon: Coffee },
  { id: 'Heart', label: 'Health', Icon: Heart },
  { id: 'Sparkles', label: 'Premium', Icon: Sparkles },
  { id: 'ShoppingBag', label: 'Bag', Icon: ShoppingBag },
];

function ProductIcon({ iconName, className = "w-5 h-5" }: { iconName?: string; className?: string }) {
  const found = AVAILABLE_ICONS.find((i) => i.id === iconName);
  const IconComponent = found ? found.Icon : Package;
  return <IconComponent className={className} />;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('MILK');
  const [formSize, setFormSize] = useState<number>(1000);
  const [formPrice, setFormPrice] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('Milk');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  const reload = () => setProducts(store.getProducts());

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('MILK');
    setFormSize(1000);
    setFormPrice('');
    setFormIcon('Milk');
    setFormImageUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormSize(p.packet_size_ml);
    setFormPrice(p.price.toString());
    setFormIcon(p.icon || (p.category === 'MILK' ? 'Milk' : 'Droplets'));
    setFormImageUrl(p.image_url || '');
    setShowAddModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a valid product name');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid unit price');
      return;
    }

    store.saveProduct({
      id: editingProduct?.id,
      name: formName.trim(),
      category: formCategory,
      packet_size_ml: Number(formSize),
      price: priceNum,
      icon: formIcon,
      image_url: formImageUrl || undefined,
    });

    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to delete product "${p.name}"?\nThis action will also clear default requirements for this product.`)) {
      store.deleteProduct(p.id);
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Product Catalog & Pricing</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Manage Nandini Milk & Curd products, upload product images, select icons, and update prices.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 bg-nandini-blue hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs transition text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Informational Alert */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs md:text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-nandini-blue shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Historical Price Integrity Protection</div>
            <div>
              When you edit a product price here, existing historical delivery records and past monthly bills retain their original price at delivery time.
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs bg-slate-50 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-nandini-blue border border-blue-100 flex items-center justify-center font-bold shadow-xs shrink-0">
                      <ProductIcon iconName={p.icon || (p.category === 'MILK' ? 'Milk' : 'Droplets')} className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{p.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Category: <span className="font-semibold text-slate-700">{p.category}</span> • Size: {p.packet_size_ml}ml
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Unit Price</div>
                  <div className="text-2xl font-extrabold text-slate-900">₹{p.price.toFixed(2)}</div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p)}
                    title="Delete Product"
                    className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nandini Curd 500g"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    >
                      <option value="MILK">MILK</option>
                      <option value="CURD">CURD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Packet Size (ml)</label>
                    <input
                      type="number"
                      required
                      placeholder="500 or 1000"
                      value={formSize}
                      onChange={(e) => setFormSize(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 24"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>

                {/* Product Image Upload / URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Product Image (Optional)</label>
                  <div className="flex items-center space-x-3">
                    {formImageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 group">
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Or paste image URL (e.g. https://...)"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Icon Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Or Select Fallback Vector Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComp = item.Icon;
                      const isSelected = formIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormIcon(item.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <IconComp className="w-4 h-4 mb-1" />
                          <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-nandini-blue hover:bg-blue-800 text-white rounded-lg shadow-xs"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
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
