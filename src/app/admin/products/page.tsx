'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { Product } from '@/lib/types';
import { Package, Edit2, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const reload = () => setProducts(store.getProducts());

  useEffect(() => {
    reload();
    const unsub = store.subscribe(reload);
    return () => { unsub(); };
  }, []);


  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditPrice(p.price.toString());
  };

  const handleSavePrice = (productId: string) => {
    const numericPrice = parseFloat(editPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    store.updateProductPrice(productId, numericPrice);
    setEditingId(null);
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Product & Price Catalog</h2>
          <p className="text-xs md:text-sm text-slate-500">
            Official Nandini Milk & Curd product catalog. Price edits only apply to new future deliveries.
          </p>
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
          {products.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-nandini-light text-nandini-blue flex items-center justify-center font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                      <div className="text-xs text-slate-500">
                        Category: <span className="font-semibold text-slate-700">{p.category}</span> • Packet Size: {p.packet_size_ml}ml
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Current Unit Price</div>
                    {isEditing ? (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="font-bold text-slate-700">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="text-2xl font-extrabold text-slate-900">₹{p.price.toFixed(2)}</div>
                    )}
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSavePrice(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Price</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </Navigation>
  );
}

