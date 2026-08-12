import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../services/store';

export const CustomerChatWidget: React.FC = () => {
  const { state, sendMessage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Dynamic session identity (stored in sessionStorage)
  const [session, setSession] = useState<{ visitorId: string; conversationId: string; visitorName: string }>(() => {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('web_chat_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
      const randomId = Math.random().toString(36).substring(2, 8);
      const newSess = {
        visitorId: `visitor_${randomId}`,
        conversationId: `conv_web_${randomId}`,
        visitorName: `Web Visitor #${randomId.substring(0, 4)}`,
      };
      sessionStorage.setItem('web_chat_session', JSON.stringify(newSess));
      return newSess;
    }
    return {
      visitorId: 'visitor_demo',
      conversationId: 'conv_web_demo',
      visitorName: 'Web Visitor',
    };
  });

  const orgName = state.currentOrg?.name || 'NovaTech Store';

  const [messages, setMessages] = useState<Array<{ sender: 'customer' | 'ai'; text: string; executedTools?: any[] }>>([
    {
      sender: 'ai',
      text: `Hello! Welcome to ${orgName}. How can I help you find products, prices, or delivery details today?`,
    },
  ]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');

    setMessages((prev) => [...prev, { sender: 'customer', text: userMsg }]);

    // Sync to main store inbox with dynamic conversation ID & visitor name
    sendMessage(session.conversationId, 'customer', userMsg, session.visitorName);

    setIsTyping(true);

    try {
      // Native Web Chat flow: Web Chat -> /api/webhooks/web -> Supabase -> AI -> Supabase -> Inbox
      const res = await fetch('/api/webhooks/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: userMsg,
          customerId: session.visitorId,
          customerName: session.visitorName,
          conversationId: session.conversationId,
          channel: 'web',
          orgId: state.currentOrg?.id,
        }),
      });

      const data = await res.json();
      if (data.aiReply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.aiReply,
            executedTools: data.executedTools,
          },
        ]);

        // Sync AI reply to store inbox
        sendMessage(session.conversationId, 'ai', data.aiReply, 'AI Sales Agent');
      } else {
        throw new Error('No AI reply returned');
      }
    } catch (e) {
      console.warn('[Web Chat AI Fallback]:', e);
      // Safe fallback when AI request fails (No fake recommendations)
      const safeFallback = 'Our AI sales assistant is temporarily unavailable. A human team member will assist you shortly!';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: safeFallback,
        },
      ]);
      sendMessage(session.conversationId, 'ai', safeFallback, 'AI Sales Agent');
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
                <h4 className="font-bold text-xs text-[#222222]">{orgName} Assistant</h4>
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
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> AI is querying products & stock...
              </div>
            )}
          </div>

          {/* Quick Prompt Button */}
          <div className="p-2 bg-[#FFFFFF] border-t border-[#EAE5DC] text-[11px] overflow-x-auto flex gap-1.5">
            <button
              onClick={() => {
                setInputText('What are your best available products and current prices?');
              }}
              className="px-2 py-1 neu-button text-[#222222] rounded-md shrink-0 transition border border-[#EAE5DC]"
            >
              🛍️ Check Available Products
            </button>
          </div>

          {/* Widget Input Bar */}
          <div className="p-3 bg-[#FFFFFF] border-t border-[#EAE5DC] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about products, prices, delivery..."
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
