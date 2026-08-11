import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  Bot,
  User,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Order, OrderStatus } from '../types';

export const OrderManagement: React.FC = () => {
  const { state, updateOrderStatus, createDraftOrder } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(state.orders[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New draft order form state
  const [custName, setCustName] = useState('Thiri Thaw');
  const [custPhone, setCustPhone] = useState('09798123456');
  const [selectedProdId, setSelectedProdId] = useState(state.products[1]?.id || state.products[0]?.id || '');
  const [address, setAddress] = useState('Yangon, Myanmar');

  const isMM = state.language === 'my';

  const statuses: OrderStatus[] = [
    'draft',
    'awaiting_confirmation',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  const filteredOrders = state.orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = state.products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const subtotal = prod.priceMMK;
    const delivery = 3000;
    const total = subtotal + delivery;

    const newOrd = createDraftOrder({
      customerId: state.customers[0]?.id || 'cust_01',
      customerName: custName,
      customerPhone: custPhone,
      channel: 'web_chat',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 1,
          unitPriceMMK: prod.priceMMK,
          unitPriceUSD: prod.priceUSD,
          totalMMK: prod.priceMMK,
        },
      ],
      subtotalMMK: subtotal,
      discountMMK: 0,
      deliveryFeeMMK: delivery,
      totalMMK: total,
      totalUSD: Math.round(total / 1900),
      status: 'draft',
      paymentMethod: 'kpay',
      paymentStatus: 'pending',
      deliveryAddress: address,
      createdViaAI: false,
    });

    setSelectedOrder(newOrd);
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'အမှာစာ မန်နေဂျာ' : 'Order Pipeline & Management'}</h2>
          <p className="text-xs text-slate-500">Track orders, AI-generated draft orders, payment status, and inventory updates</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-1.5 neu-gold text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{isMM ? 'အမှာစာ မူကြမ်း ဖန်တီးမည်' : 'Create Draft Order'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 neu-flat p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, customer, phone..."
            className="w-full pl-9 pr-3 py-1.5 neu-inset rounded-lg text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              statusFilter === 'all' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
            }`}
          >
            All Orders ({state.orders.length})
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition shrink-0 ${
                statusFilter === s ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Split Order View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order List Table */}
        <div className="lg:col-span-2 neu-flat rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE5DC] text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total (MMK)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`hover:bg-[#C5A880]/10 cursor-pointer transition ${isSelected ? 'neu-inset font-bold text-[#886D49]' : ''}`}
                  >
                    <td className="p-3 font-mono font-bold text-[#222222] flex items-center gap-1.5">
                      {ord.createdViaAI && (
                        <span title="Created by AI Agent">
                          <Bot className="w-3.5 h-3.5 text-[#C5A880]" />
                        </span>
                      )}
                      #{ord.id}
                    </td>
                    <td className="p-3 text-[#222222]">{ord.customerName}</td>
                    <td className="p-3 text-slate-600 truncate max-w-[150px]">{ord.items.map((i) => i.productName).join(', ')}</td>
                    <td className="p-3 font-bold text-[#222222]">{ord.totalMMK.toLocaleString()} MMK</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase neu-pill text-[#A98C63]">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-[#A98C63] hover:underline font-bold text-xs">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Order Details Panel */}
        {selectedOrder && (
          <div className="neu-flat rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#A98C63] uppercase">Order Details</span>
                <h3 className="font-bold text-[#222222] text-base">Order #{selectedOrder.id}</h3>
              </div>
              <span className="neu-pill text-[#A98C63] font-bold text-xs px-2.5 py-1 rounded-full capitalize">
                {selectedOrder.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-[#222222]">{selectedOrder.customerName} ({selectedOrder.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="uppercase font-semibold text-[#222222]">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-right max-w-[180px] text-[#222222]">{selectedOrder.deliveryAddress}</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="border-t border-b border-[#EAE5DC] py-3 space-y-2">
              <span className="font-bold text-xs text-[#222222]">Line Items:</span>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 neu-inset rounded-lg">
                  <div>
                    <p className="font-bold text-[#222222]">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">Qty: {item.quantity} x {item.unitPriceMMK.toLocaleString()} MMK</p>
                  </div>
                  <span className="font-bold text-[#222222]">{item.totalMMK.toLocaleString()} MMK</span>
                </div>
              ))}
            </div>

            {/* Total Calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{selectedOrder.subtotalMMK.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee:</span>
                <span>{selectedOrder.deliveryFeeMMK.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between font-bold text-[#222222] text-sm pt-1 border-t border-[#EAE5DC]">
                <span>Total Amount:</span>
                <span className="text-[#A98C63]">{selectedOrder.totalMMK.toLocaleString()} MMK</span>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Update Order Status:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg text-xs transition shadow-sm"
                >
                  Confirm & Deduct Stock
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  className="neu-gold text-white font-semibold py-1.5 rounded-lg text-xs transition shadow-sm"
                >
                  Mark Delivered
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Draft Order */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#222222] text-base">Create Manual Draft Order</h3>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Select Product</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none"
                >
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.priceMMK.toLocaleString()} MMK)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full neu-inset rounded-lg p-2 text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg neu-button text-[#222222] font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg neu-gold text-white font-semibold">
                  Create Draft Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
