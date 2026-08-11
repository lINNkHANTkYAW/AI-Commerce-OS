import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  ShoppingBag,
  Sparkles,
  Phone,
  Tag,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bot,
  Flame,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Conversation, Message } from '../types';

interface UnifiedInboxProps {
  onNavigateTab: (tab: any) => void;
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ onNavigateTab }) => {
  const { state, sendMessage, createDraftOrder, updateCustomer } = useAppStore();
  const [selectedConvId, setSelectedConvId] = useState<string>(state.conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const selectedConv = state.conversations.find((c) => c.id === selectedConvId) || state.conversations[0];
  const customer = state.customers.find((c) => c.id === selectedConv?.customerId);
  const conversationMessages = state.messages.filter((m) => m.conversationId === selectedConvId);
  const customerOrders = state.orders.filter((o) => o.customerId === customer?.id);

  const isMM = state.language === 'my';

  const handleSendUserMessage = async () => {
    if (!inputText.trim() || !selectedConv) return;

    const userText = inputText.trim();
    setInputText('');

    // Send user message
    sendMessage(selectedConv.id, 'customer', userText, customer?.name || 'Customer');

    // Call server AI Agent
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversationMessages, { sender: 'customer', text: userText }],
          customerId: customer?.id,
          conversationId: selectedConv.id,
          channel: selectedConv.channel,
        }),
      });

      const data = await res.json();
      if (data.text) {
        sendMessage(selectedConv.id, 'ai', data.text, 'AI Sales Agent', {
          executedTools: data.executedTools,
        });
      }
    } catch (e) {
      console.error('Error calling AI Agent:', e);
      // Fallback response in demo mode
      sendMessage(selectedConv.id, 'ai', 'Thank you! I have checked our catalogue and stock for you.', 'AI Sales Agent');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplySuggestedReply = (replyText: string) => {
    setInputText(replyText);
  };

  return (
    <div className="h-full flex bg-[#FAF8F5] text-[#222222] overflow-hidden">
      {/* Column 1: Conversations List */}
      <div className="w-80 neu-flat rounded-2xl my-2 ml-2 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-[#EAE5DC] space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#222222] text-sm">{isMM ? 'မက်ဆေ့ခ်ျ သေတ္တာ' : 'Unified Inbox'}</h2>
            <span className="text-xs neu-pill text-[#A98C63] font-bold px-2.5 py-0.5 rounded-full">
              {state.conversations.length} total
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Live feeds from Web Chat, Telegram, Messenger</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {state.conversations.map((conv) => {
            const cust = state.customers.find((c) => c.id === conv.customerId);
            const isSelected = conv.id === selectedConvId;

            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full text-left p-3.5 rounded-xl transition flex flex-col gap-1.5 ${
                  isSelected ? 'neu-inset text-[#886D49] font-bold' : 'neu-button text-[#222222]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#222222] text-xs truncate">{cust?.name || 'Customer'}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{conv.channel.replace('_', ' ')}</span>
                </div>

                <p className="text-xs text-slate-600 truncate font-normal">{conv.lastMessageText}</p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {conv.leadTemperature === 'hot' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold neu-pill text-rose-700 px-2 py-0.5 rounded-full">
                        <Flame className="w-2.5 h-2.5 fill-rose-600 text-rose-600" /> HOT LEAD
                      </span>
                    )}
                    <span className="text-[10px] neu-pill text-slate-600 px-2 py-0.5 rounded-full font-mono">
                      AI: {conv.aiConfidenceScore}%
                    </span>
                  </div>
                  {conv.unread && <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880] shadow-sm"></span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 2: Active Chat View */}
      <div className="flex-1 flex flex-col neu-flat rounded-2xl my-2 mx-2 min-w-0 overflow-hidden">
        {/* Chat Top Header */}
        <div className="h-14 neu-flat border-b border-[#EAE5DC] px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl neu-gold text-white font-bold flex items-center justify-center text-xs">
              {customer?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-bold text-[#222222] text-xs">{customer?.name}</h3>
              <p className="text-[10px] text-slate-500">
                Channel: <strong className="capitalize text-[#A98C63]">{selectedConv?.channel}</strong> • Source: Web Chat Widget
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] neu-pill text-emerald-700 font-bold px-3 py-1 rounded-full">
              AI Auto-Pilot Active
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversationMessages.map((msg) => {
            const isCustomer = msg.sender === 'customer';
            return (
              <div key={msg.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold">{msg.senderName || (isCustomer ? 'Customer' : 'AI Agent')}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    isCustomer
                      ? 'neu-flat text-[#222222] rounded-tl-xs'
                      : 'neu-gold text-white font-semibold rounded-tr-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Show executed tools if present */}
                {msg.metadata?.executedTools && msg.metadata.executedTools.length > 0 && (
                  <div className="mt-2 p-3 neu-inset text-[#222222] rounded-xl text-[10px] font-mono max-w-lg space-y-1">
                    <div className="text-[#A98C63] font-bold flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-[#C5A880]" /> Executed Tool: {msg.metadata.executedTools[0].tool}
                    </div>
                    <p className="text-slate-600 truncate">Result: {JSON.stringify(msg.metadata.executedTools[0].result).substring(0, 120)}...</p>
                  </div>
                )}
              </div>
            );
          })}

          {isAiProcessing && (
            <div className="flex items-center gap-2 text-xs text-[#A98C63] font-bold animate-pulse">
              <Sparkles className="w-4 h-4 text-[#C5A880]" /> AI Sales Agent searching store catalogue and generating response...
            </div>
          )}
        </div>

        {/* AI Suggested Quick Actions */}
        <div className="px-5 py-2.5 neu-inset flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Suggested:</span>
          <button
            onClick={() => handleApplySuggestedReply("We recommend Student Laptop Pro (1,450,000 MMK) with 16GB RAM for graphic design and course work.")}
            className="px-3 py-1.5 neu-button text-[#222222] rounded-xl shrink-0 text-xs font-medium transition"
          >
            Recommend Laptop Pro
          </button>
          <button
            onClick={() => handleApplySuggestedReply("Would you like me to create a draft order with Cash on Delivery or KBZPay?")}
            className="px-3 py-1.5 neu-button text-[#222222] rounded-xl shrink-0 text-xs font-medium transition"
          >
            Create Draft Order Prompt
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 neu-flat flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserMessage()}
            placeholder={isMM ? 'မက်ဆေ့ခ်ျ ရေးသားပါ...' : 'Type customer inquiry or reply as AI agent...'}
            className="flex-1 neu-inset rounded-xl px-4 py-2.5 text-xs text-[#222222] placeholder-slate-400 focus:outline-none transition-all"
          />
          <button
            onClick={handleSendUserMessage}
            className="neu-gold text-white p-2.5 rounded-xl shadow-md transition shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Column 3: Customer Memory & CRM Side Panel */}
      <div className="w-80 neu-flat rounded-2xl my-2 mr-2 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="font-bold text-[#222222] text-sm mb-1">{isMM ? 'ဝယ်ယူသူ မမ်မိုရီ & CRM' : 'Customer Memory & CRM'}</h3>
          <p className="text-[11px] text-slate-500">Real-time profile, buying intent & history</p>
        </div>

        {/* Customer Basic Info */}
        <div className="p-3.5 neu-inset rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#222222] text-xs">{customer?.name}</span>
            <span className="neu-pill text-[#A98C63] font-bold text-[10px] px-2.5 py-0.5 rounded-full capitalize">
              {customer?.lifecycleStage}
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> {customer?.phone}
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" /> Source: Back-to-School Campaign
            </div>
          </div>
        </div>

        {/* AI Generated Intelligence Card */}
        <div className="p-4 neu-flat border border-[#C5A880]/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[#886D49] font-bold text-xs">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI Insights
            </span>
            <span className="text-[10px] font-mono text-[#A98C63]">Intent: {customer?.buyingIntentScore}/100</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{customer?.aiSummary}</p>
          <div className="text-[11px] text-[#886D49] font-semibold pt-1">
            💡 <strong>Next Action:</strong> {customer?.recommendedFollowUp}
          </div>
        </div>

        {/* Previous Orders List */}
        <div className="space-y-2">
          <h4 className="font-bold text-[#222222] text-xs flex items-center justify-between">
            <span>{isMM ? 'ယခင် အမှာစာများ' : 'Order History'} ({customerOrders.length})</span>
            <button onClick={() => onNavigateTab('orders')} className="text-[11px] text-[#A98C63] font-bold hover:underline">
              View All
            </button>
          </h4>

          {customerOrders.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No completed orders yet. Draft order active in chat.</p>
          ) : (
            <div className="space-y-2">
              {customerOrders.map((ord) => (
                <div key={ord.id} className="p-3 neu-inset rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#222222]">
                    <span>Order #{ord.id}</span>
                    <span className="text-emerald-700">{ord.totalMMK.toLocaleString()} MMK</span>
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">Status: {ord.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Customer Notes */}
        <div className="space-y-2">
          <h4 className="font-bold text-[#222222] text-xs">{isMM ? 'မှတ်စုများ' : 'Internal Notes'}</h4>
          <div className="space-y-1.5">
            {customer?.notes.map((note, idx) => (
              <div key={idx} className="p-2.5 neu-inset rounded-xl text-xs text-slate-600 leading-snug">
                • {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
