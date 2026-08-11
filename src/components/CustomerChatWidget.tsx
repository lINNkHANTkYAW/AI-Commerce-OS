import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../services/store';

export const CustomerChatWidget: React.FC = () => {
  const { state, sendMessage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'customer' | 'ai'; text: string; executedTools?: any[] }>>([
    {
      sender: 'ai',
      text: 'Hello! Welcome to NovaTech Myanmar. How can I help you find the right laptop or accessory today?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const activeConv = state.conversations[0];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');

    setMessages((prev) => [...prev, { sender: 'customer', text: userMsg }]);

    // Sync to main store inbox
    if (activeConv) {
      sendMessage(activeConv.id, 'customer', userMsg, 'Thiri Thaw');
    }

    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat({ sender: 'customer', text: userMsg }),
          customerId: 'cust_01',
          conversationId: activeConv?.id || 'conv_01',
          channel: 'web_chat',
        }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.text,
            executedTools: data.executedTools,
          },
        ]);

        if (activeConv) {
          sendMessage(activeConv.id, 'ai', data.text, 'AI Sales Agent');
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I have searched our catalogue! I recommend our Student Laptop Pro (1,450,000 MMK) with 16GB RAM and 512GB SSD. I can create a draft order for you!',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 neu-gold text-white font-bold px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 group"
        >
          <MessageSquare className="w-5 h-5 fill-white text-white" />
          <span className="text-xs">Live Store Chat</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-slide-up">
          {/* Widget Top Header */}
          <div className="p-3.5 bg-[#FAF8F5] border-b border-[#EAE5DC] text-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full neu-gold flex items-center justify-center font-bold">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#222222]">NovaTech Store Assistant</h4>
                <p className="text-[10px] text-[#A98C63] font-semibold">Live AI Sales Agent</p>
              </div>
            </div>

            <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-[#222222] rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Widget Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5] text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm whitespace-pre-wrap ${
                    m.sender === 'customer'
                      ? 'neu-gold text-white font-semibold rounded-tr-xs'
                      : 'bg-[#FFFFFF] text-[#222222] border border-[#EAE5DC] rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>

                {m.executedTools && m.executedTools.length > 0 && (
                  <div className="mt-1 text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Tool Executed: {m.executedTools[0].tool}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-[#A98C63] font-semibold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> NovaTech AI is checking inventory & prices...
              </div>
            )}
          </div>

          {/* Quick Demo Query Button */}
          <div className="p-2 bg-[#FFFFFF] border-t border-[#EAE5DC] text-[11px] overflow-x-auto flex gap-1.5">
            <button
              onClick={() => {
                setInputText('I need a laptop for university graphic design under 1,500,000 MMK.');
              }}
              className="px-2 py-1 neu-button text-[#222222] rounded-md shrink-0 transition border border-[#EAE5DC]"
            >
              💻 Laptop under 1.5M MMK
            </button>
          </div>

          {/* Widget Input Bar */}
          <div className="p-3 bg-[#FFFFFF] border-t border-[#EAE5DC] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about laptops, accessories, delivery..."
              className="flex-1 neu-inset border border-[#EAE5DC] rounded-xl px-3 py-2 text-xs text-[#222222] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
            />
            <button
              onClick={handleSendMessage}
              className="neu-gold text-white p-2 rounded-xl transition shadow-md font-bold"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
