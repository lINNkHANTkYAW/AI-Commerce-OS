import React, { useState } from 'react';
import { Bot, Send, Sparkles, MessageSquare, Phone, RefreshCw, CheckCircle2, User, Globe } from 'lucide-react';
import { useAppStore } from '../services/store';
import { runAIAgentPipeline } from '../services/aiTools';

export const ChannelSimulator: React.FC = () => {
  const { state, sendMessage, createDraftOrder } = useAppStore();
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'facebook' | 'web'>('telegram');
  const [customerName, setCustomerName] = useState('Kyaw Kyaw');
  const [customerPhone, setCustomerPhone] = useState('09791234567');
  const [messageInput, setMessageInput] = useState('Hi, I want to order ASUS ROG Strix laptop. Is it available in stock?');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{ time: string; channel: string; text: string; role: 'user' | 'agent' | 'system' }[]>([
    {
      time: new Date().toLocaleTimeString(),
      channel: 'telegram',
      text: 'Channel Simulator Initialized. Select channel and send test customer message.',
      role: 'system',
    },
  ]);

  const isMM = state.language === 'my';

  const handleSimulateMessage = async () => {
    if (!messageInput.trim() || isProcessing) return;

    const userText = messageInput.trim();
    setMessageInput('');
    setIsProcessing(true);

    const timeStr = new Date().toLocaleTimeString();

    // Add user message log
    setLogs((prev) => [
      ...prev,
      { time: timeStr, channel: activeChannel, text: `${customerName} (${customerPhone}): "${userText}"`, role: 'user' },
    ]);

    // Find or create conversation in store
    let conv = state.conversations.find((c: any) => c.customerPhone === customerPhone || c.customerName === customerName);
    const convId = conv ? conv.id : state.conversations[0]?.id || 'conv_sim_1';

    // Add customer message to store
    sendMessage(convId, 'customer', userText, customerName);

    // Run AI Agent Tool Calling Pipeline
    const currentConv = state.conversations.find((c: any) => c.id === convId) || {
      id: convId,
      customerName,
      customerPhone,
      channel: activeChannel,
      unread: false,
      lastMessageAt: new Date().toISOString(),
      messages: [{ id: `msg_${Date.now()}`, conversationId: convId, sender: 'customer', senderName: customerName, text: userText }],
    };

    const aiResult = await runAIAgentPipeline(
      currentConv as any,
      state.products,
      state.currentOrg
    );

    // Save AI response message
    sendMessage(convId, 'ai', aiResult.replyText, 'Sale Brain AI', {
      executedTools: aiResult.executedTools,
    });

    // Check if draft order generated
    if (aiResult.draftOrder) {
      createDraftOrder(aiResult.draftOrder);
      setLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          channel: activeChannel,
          text: `⚡ AUTO-DRAFT ORDER CREATED: #${aiResult.draftOrder.id || 'NEW'} for ${aiResult.draftOrder.customerName || customerName}`,
          role: 'system',
        },
      ]);
    }

    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        channel: activeChannel,
        text: `Sale Brain AI (${activeChannel.toUpperCase()} Bot): "${aiResult.replyText}"`,
        role: 'agent',
      },
    ]);

    setIsProcessing(false);
  };


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[#A98C63] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#A98C63]" />
            <span>Interactive Multi-Channel Sandbox</span>
          </div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">
            {isMM ? 'စမ်းသပ်မှု စင်တာ (Channel Simulator)' : 'Social Channel Simulator & AI Testing'}
          </h2>
          <p className="text-xs text-slate-500">
            Simulate real customer messages across Telegram, Facebook & Web Chat to test live AI auto-responses and tool calling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogs([])}
            className="neu-button px-3 py-2 rounded-xl text-xs font-semibold text-[#222222] flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Generator Controls */}
        <div className="lg:col-span-5 neu-flat rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#222222] flex items-center gap-2 border-b border-[#EAE5DC] pb-3">
            <MessageSquare className="w-4 h-4 text-[#A98C63]" />
            <span>Simulate Customer Inquiry</span>
          </h3>

          {/* Select Channel */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 block">Select Social Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveChannel('telegram')}
                className={`p-3 rounded-xl text-xs font-semibold text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  activeChannel === 'telegram' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('facebook')}
                className={`p-3 rounded-xl text-xs font-semibold text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  activeChannel === 'facebook' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('web')}
                className={`p-3 rounded-xl text-xs font-semibold text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  activeChannel === 'web' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Web Chat</span>
              </button>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Customer Name</label>
              <div className="neu-inset rounded-xl p-2.5 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-transparent text-[#222222] font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Phone Number</label>
              <div className="neu-inset rounded-xl p-2.5 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-transparent text-[#222222] font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Quick Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMessageInput('Hi, do you have ASUS ROG Strix laptop in stock? What is the price?')}
                className="neu-button px-2.5 py-1.5 rounded-lg text-[11px] text-[#222222] hover:text-[#A98C63]"
              >
                Stock & Price Query
              </button>
              <button
                type="button"
                onClick={() => setMessageInput('I want to order 1 ASUS ROG Strix laptop. My address is Kamayut, Yangon. Phone: 09791234567')}
                className="neu-button px-2.5 py-1.5 rounded-lg text-[11px] text-[#222222] hover:text-[#A98C63]"
              >
                Create Draft Order
              </button>
              <button
                type="button"
                onClick={() => setMessageInput('Can I get a 20% discount on 2 MacBooks?')}
                className="neu-button px-2.5 py-1.5 rounded-lg text-[11px] text-[#222222] hover:text-[#A98C63]"
              >
                High-Risk Approval Trigger
              </button>
            </div>
          </div>

          {/* Message Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 block">Customer Message Text</label>
            <div className="neu-inset rounded-xl p-3">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={3}
                placeholder="Type customer message here..."
                className="w-full bg-transparent text-xs text-[#222222] placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSimulateMessage}
            disabled={isProcessing || !messageInput.trim()}
            className="w-full neu-gold text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>AI Agent Processing Tool Calls...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Send Simulated Message</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Real-time Execution Feed */}
        <div className="lg:col-span-7 neu-flat rounded-2xl p-6 flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3 mb-4">
            <h3 className="text-sm font-bold text-[#222222] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#A98C63]" />
              <span>Real-Time AI Agent Execution Feed</span>
            </h3>
            <span className="text-[10px] neu-pill px-2.5 py-1 rounded-full text-emerald-700 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sale Brain Engine Active
            </span>
          </div>

          {/* Log Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs leading-relaxed space-y-1 ${
                  log.role === 'user'
                    ? 'neu-button text-[#222222] border-l-4 border-[#C5A880]'
                    : log.role === 'agent'
                    ? 'neu-inset text-[#222222] border-l-4 border-emerald-600'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="uppercase font-mono font-bold text-slate-500">{log.channel}</span>
                  <span className="font-mono">{log.time}</span>
                </div>
                <p className="font-medium whitespace-pre-wrap">{log.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
