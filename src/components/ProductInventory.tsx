import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit,
  Tag,
  CheckCircle2,
  Boxes,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Product } from '../types';

export const ProductInventory: React.FC = () => {
  const { state, addProduct, updateProduct, adjustInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustReason, setAdjustReason] = useState('restock');

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Laptops');
  const [newProdPrice, setNewProdPrice] = useState('950000');
  const [newProdStock, setNewProdStock] = useState('15');
  const [newProdDesc, setNewProdDesc] = useState('');

  const isMM = state.language === 'my';

  const categories = Array.from(new Set(state.products.map((p) => p.category)));

  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = state.products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const price = parseInt(newProdPrice) || 500000;
    addProduct({
      sku: `NT-PROD-${Math.floor(100 + Math.random() * 900)}`,
      name: newProdName,
      category: newProdCategory,
      description: newProdDesc || 'High quality tech product for students and professionals.',
      priceMMK: price,
      priceUSD: Math.round(price / 1900),
      stockQuantity: parseInt(newProdStock) || 10,
      lowStockThreshold: 5,
      reservedQuantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
      tags: ['new-arrival', newProdCategory.toLowerCase()],
      isActive: true,
    });

    setShowAddModal(false);
    setNewProdName('');
  };

  const handleApplyStockAdjustment = (productId: string) => {
    adjustInventory(productId, adjustAmount, adjustReason);
    setShowStockModal(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'ကုန်ပစ္စည်း & လက်ကျန် စာရင်း' : 'Products & Inventory Management'}</h2>
          <p className="text-xs text-slate-500">Manage catalogue, pricing in MMK/USD, stock levels, and AI inventory intelligence</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 neu-gold text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{isMM ? 'ကုန်ပစ္စည်း အသစ်ထည့်မည်' : 'Add New Product'}</span>
        </button>
      </div>

      {/* AI Inventory Intelligence Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-800">
              AI Inventory Warning: {lowStockItems.length} product(s) below reorder threshold
            </span>
            <p className="text-amber-700 leading-relaxed">
              {lowStockItems.map((p) => `${p.name} (Only ${p.stockQuantity} left, Threshold: ${p.lowStockThreshold})`).join(' • ')}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 neu-flat p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU, name, tags..."
            className="w-full pl-9 pr-3 py-1.5 neu-inset rounded-lg text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="neu-button text-xs font-semibold text-[#222222] px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => {
          const isLow = prod.stockQuantity <= prod.lowStockThreshold;
          return (
            <div
              key={prod.id}
              className="neu-flat rounded-2xl p-4 shadow-sm hover:border-[#C5A880]/40 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative h-40 rounded-xl neu-inset overflow-hidden">
                  <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#222222]/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {prod.sku}
                  </span>
                  {isLow && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      LOW STOCK
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#A98C63] tracking-wider">{prod.category}</span>
                    <span className="text-xs font-bold text-[#222222]">{prod.priceMMK.toLocaleString()} MMK</span>
                  </div>
                  <h3 className="font-bold text-[#222222] text-sm tracking-tight">{prod.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-normal">{prod.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">In Stock:</span>
                  <span className={`font-bold ${isLow ? 'text-amber-600 font-mono' : 'text-[#222222]'}`}>
                    {prod.stockQuantity} units ({prod.reservedQuantity} reserved)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowStockModal(prod.id)}
                    className="flex-1 neu-button text-[#222222] font-semibold py-1.5 rounded-lg text-xs transition"
                  >
                    Adjust Stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#222222] text-base">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Student Laptop Slim 14"
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Price (MMK)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Description</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows={3}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg neu-button text-[#222222] font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg neu-gold text-white font-semibold">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Inventory Stock */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#222222] text-sm">Adjust Stock Quantity</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Adjustment Amount (+ or -)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full neu-inset rounded-lg p-2 font-mono font-bold text-[#222222] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                >
                  <option value="restock">New Shipment / Restock</option>
                  <option value="adjustment">Inventory Correction</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowStockModal(null)}
                  className="px-3 py-1.5 rounded-lg neu-button text-[#222222] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyStockAdjustment(showStockModal)}
                  className="px-3 py-1.5 rounded-lg neu-gold text-white font-semibold"
                >
                  Apply Stock Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
