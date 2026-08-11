import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Tag,
  ShoppingBag,
  Sparkles,
  Edit2,
  Check,
  Flame,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { CustomerProfile, LifecycleStage } from '../types';

export const CustomerCRM: React.FC = () => {
  const { state, updateCustomer, addCustomerNote } = useAppStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(state.customers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [newNote, setNewNote] = useState('');
  const [isEditingAiSummary, setIsEditingAiSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');

  const isMM = state.language === 'my';

  const selectedCustomer = state.customers.find((c) => c.id === selectedCustomerId) || state.customers[0];

  const filteredCustomers = state.customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = filterStage === 'all' || c.lifecycleStage === filterStage;
    return matchesSearch && matchesStage;
  });

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCustomer) return;
    addCustomerNote(selectedCustomer.id, newNote.trim());
    setNewNote('');
  };

  const handleSaveAiSummary = () => {
    if (!selectedCustomer) return;
    updateCustomer(selectedCustomer.id, { aiSummary: editedSummary });
    setIsEditingAiSummary(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'ဝယ်ယူသူများ CRM စနစ်' : 'Customer CRM & Memory'}</h2>
          <p className="text-xs text-slate-500">AI-powered customer profiles, lifecycle tracking, and memory timeline</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, tags..."
              className="w-full pl-9 pr-3 py-1.5 neu-inset rounded-lg text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
            />
          </div>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="neu-button text-xs font-semibold text-[#222222] px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
            <option value="repeat">Repeat Customer</option>
            <option value="at_risk">At Risk</option>
          </select>
        </div>
      </div>

      {/* Main CRM Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List Column */}
        <div className="neu-flat rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
            <span className="font-bold text-xs text-[#222222]">Customers ({filteredCustomers.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Real-Time Sync</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerId(cust.id);
                    setEditedSummary(cust.aiSummary);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                    isSelected ? 'neu-inset border-[#C5A880] text-[#886D49]' : 'neu-button text-[#222222]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#222222] text-xs">{cust.name}</span>
                    <span className="text-[10px] neu-pill font-bold px-2 py-0.5 rounded-full capitalize text-[#A98C63]">
                      {cust.lifecycleStage.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{cust.phone}</span>
                    <span className="font-bold text-[#222222]">{cust.totalSpentMMK.toLocaleString()} MMK</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cust.tags.map((t, idx) => (
                      <span key={idx} className="neu-pill text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Details & Memory Column */}
        {selectedCustomer && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header Profile Box */}
            <div className="neu-flat rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full neu-gold text-white font-bold flex items-center justify-center text-lg shadow-md">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#222222] text-base">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{selectedCustomer.phone}</span> • <span>{selectedCustomer.country}</span> •
                      <span className="uppercase text-[#A98C63] font-semibold">{selectedCustomer.language}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 neu-pill text-[#A98C63] font-bold text-xs rounded-full capitalize">
                    {selectedCustomer.lifecycleStage.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Key CRM Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 neu-inset rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Total Spending</span>
                  <p className="font-bold text-[#222222]">{selectedCustomer.totalSpentMMK.toLocaleString()} MMK</p>
                </div>
                <div className="p-2.5 neu-inset rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Buying Intent</span>
                  <p className="font-bold text-[#A98C63]">{selectedCustomer.buyingIntentScore} / 100</p>
                </div>
                <div className="p-2.5 neu-inset rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Price Sensitivity</span>
                  <p className="font-bold text-[#222222] capitalize">{selectedCustomer.priceSensitivity}</p>
                </div>
                <div className="p-2.5 neu-inset rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Churn Risk</span>
                  <p className={`font-bold capitalize ${selectedCustomer.churnRisk === 'high' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedCustomer.churnRisk}
                  </p>
                </div>
              </div>

              {/* AI Generated Memory & Summary Box (Editable) */}
              <div className="neu-flat border border-[#C5A880]/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#886D49] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI Customer Memory & Summary
                  </span>
                  {!isEditingAiSummary ? (
                    <button
                      onClick={() => {
                        setEditedSummary(selectedCustomer.aiSummary);
                        setIsEditingAiSummary(true);
                      }}
                      className="text-[11px] text-[#A98C63] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" /> Edit AI Summary
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveAiSummary}
                      className="text-[11px] neu-gold text-white font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                  )}
                </div>

                {!isEditingAiSummary ? (
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedCustomer.aiSummary}</p>
                ) : (
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="w-full neu-inset border border-[#C5A880]/40 rounded-lg p-2 text-xs text-[#222222] focus:outline-none"
                    rows={3}
                  />
                )}
              </div>

              {/* Internal Notes Section */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-[#222222]">Interaction Timeline & Notes</h4>
                <div className="space-y-2">
                  {selectedCustomer.notes.map((n, idx) => (
                    <div key={idx} className="p-3 neu-inset rounded-xl text-xs text-slate-700 leading-relaxed">
                      • {n}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add internal staff note..."
                    className="flex-1 neu-inset rounded-lg px-3 py-1.5 text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                  />
                  <button
                    onClick={handleAddNote}
                    className="neu-gold text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" /> Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
