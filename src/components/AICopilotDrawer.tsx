import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Lightbulb, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../services/store';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { state } = useAppStore();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello Aung Kyaw! I am your Sale Brain Business Copilot. How can I assist your business decisions today?',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    setInputQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setIsQuerying(true);

    try {
      const totalRevenueMMK = state.orders.reduce((sum, o) => sum + (o.totalMMK || 0), 0);
      const lowStockProducts = state.products.filter((p) => p.stockQuantity <= p.lowStockThreshold).map((p) => `${p.name} (${p.stockQuantity} remaining)`);
      const topIntentCustomers = state.customers.filter((c) => c.buyingIntentScore >= 70).map((c) => `${c.name} (Score: ${c.buyingIntentScore})`);

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          storeContext: {
            orgName: state.currentOrg?.name,
            productsCount: state.products.length,
            ordersCount: state.orders.length,
            totalRevenueMMK,
            pendingOrdersCount: state.orders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length,
            leadsCount: state.conversations.length,
            lowStockProducts,
            topIntentCustomers,
            productsList: state.products.map(p => `${p.name}: ${p.priceMMK} MMK (Stock: ${p.stockQuantity})`).join('; '),
          },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'ai', text: data.answer || 'Analysis complete.' }]);
    } catch (e) {
      const totalRevenueMMK = state.orders.reduce((sum, o) => sum + (o.totalMMK || 0), 0);
      const lowStockList = state.products.filter((p) => p.stockQuantity <= p.lowStockThreshold).map((p) => p.name).join(', ') || 'None';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Based on real DB state for ${state.currentOrg?.name || 'your store'}: You currently have ${state.products.length} products, ${state.orders.length} total orders generating ${totalRevenueMMK.toLocaleString()} MMK. Low stock items requiring restock: ${lowStockList}.`,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const samplePrompts = [
    'What were my best-selling products this week?',
    'Show customers with high buying intent who did not order yet.',
    'Which product should I restock first?',
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
      <div className="w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col border-l border-[#EAE5DC] animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#EAE5DC] text-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg neu-gold flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#222222]">Sale Brain Copilot</h3>
              <p className="text-[10px] text-[#A98C63] font-semibold">Action-Taking AI Assistant</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-[#222222] p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                  m.sender === 'user'
                    ? 'neu-gold text-white font-semibold rounded-tr-xs'
                    : 'bg-[#FFFFFF] text-[#222222] border border-[#EAE5DC] rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isQuerying && (
            <div className="flex items-center gap-2 text-xs text-[#A98C63] font-semibold animate-pulse">
              <Sparkles className="w-4 h-4 text-[#C5A880]" /> Analyzing real store database metrics...
            </div>
          )}
        </div>

        {/* Quick Sample Prompts */}
        <div className="p-3 bg-[#FFFFFF] border-t border-[#EAE5DC] space-y-1.5 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Suggested Questions:</span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(sp)}
              className="w-full text-left p-2 neu-button rounded-lg text-[#222222] text-xs transition border border-[#EAE5DC] flex items-center justify-between"
            >
              <span className="truncate">{sp}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#FFFFFF] border-t border-[#EAE5DC] flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder="Ask anything about sales, products, or campaigns..."
            className="flex-1 neu-inset border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
          />
          <button
            onClick={() => handleSendQuery()}
            className="neu-gold text-white p-2 rounded-xl shadow-md transition font-bold"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
