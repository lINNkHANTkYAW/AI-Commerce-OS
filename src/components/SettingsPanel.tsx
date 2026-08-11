import React, { useState } from 'react';
import { Settings, Store, Palette, Users, Bot, MessageSquare, ShieldCheck, Copy, Check } from 'lucide-react';
import { useAppStore } from '../services/store';

export const SettingsPanel: React.FC = () => {
  const { state, switchOrganization } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'channels' | 'team'>('profile');
  const [telegramToken, setTelegramToken] = useState('6987123450:AAEb1x839_DemoTelegramBotToken_Myanmar');
  const [copiedCode, setCopiedCode] = useState(false);

  const isMM = state.language === 'my';

  const embedScript = `<script src="${window.location.origin}/chat-widget.js" data-org="${state.currentOrg.id}"></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'ပြင်ဆင်ချက်များ' : 'Organization & AI Settings'}</h2>
        <p className="text-xs text-slate-500">Configure business info, AI agent personality, guardrails, and channel adapters</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EAE5DC] text-xs font-bold gap-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 transition ${activeTab === 'profile' ? 'border-b-2 border-[#C5A880] text-[#A98C63]' : 'text-slate-500 hover:text-[#222222]'}`}
        >
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-2.5 transition ${activeTab === 'ai' ? 'border-b-2 border-[#C5A880] text-[#A98C63]' : 'text-slate-500 hover:text-[#222222]'}`}
        >
          AI Agent Guardrails
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`pb-2.5 transition ${activeTab === 'channels' ? 'border-b-2 border-[#C5A880] text-[#A98C63]' : 'text-slate-500 hover:text-[#222222]'}`}
        >
          Channel Integration & Embed
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="neu-flat rounded-2xl p-6 shadow-sm space-y-4 max-w-xl text-xs">
          <div>
            <label className="block text-[#222222] font-semibold mb-1">Organization Name</label>
            <div className="neu-inset rounded-lg p-2.5">
              <input
                type="text"
                value={state.currentOrg.name}
                onChange={(e) => switchOrganization({ ...state.currentOrg, name: e.target.value })}
                className="w-full bg-transparent text-[#222222] font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Country</label>
              <div className="neu-inset rounded-lg p-2.5">
                <input
                  type="text"
                  value={state.currentOrg.country}
                  className="w-full bg-transparent text-slate-700 font-medium focus:outline-none"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Currency</label>
              <div className="neu-inset rounded-lg p-2.5">
                <input
                  type="text"
                  value={state.currentOrg.currency}
                  className="w-full bg-transparent text-slate-700 font-medium focus:outline-none"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="neu-flat rounded-2xl p-6 shadow-sm space-y-4 max-w-xl text-xs">
          <div className="space-y-2">
            <span className="font-bold text-[#222222] block">AI Personality & Tone</span>
            <div className="neu-inset rounded-lg p-2.5">
              <textarea
                value={state.currentOrg.toneOfVoice || 'Friendly, tech-savvy, professional, helpful'}
                rows={3}
                className="w-full bg-transparent text-[#222222] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="p-3 neu-inset rounded-xl space-y-1 text-slate-700">
            <span className="font-bold text-[#A98C63] block">Action Enforcement Rules</span>
            <p>• Prices and stock MUST be checked via live tool calling.</p>
            <p>• Draft orders require name and phone number.</p>
            <p>• Discounts & refunds require human approval.</p>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="neu-flat rounded-2xl p-6 shadow-sm space-y-5 max-w-xl text-xs">
          {/* Website Chat Widget Embed Code */}
          <div className="space-y-2">
            <span className="font-bold text-[#222222] block">Website Chat Widget Embed Code</span>
            <div className="p-3 neu-inset text-[#222222] font-mono rounded-xl flex items-center justify-between">
              <span className="truncate text-xs">{embedScript}</span>
              <button onClick={copyScript} className="text-[#A98C63] hover:text-black ml-2">
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Telegram Bot Token */}
          <div className="space-y-2">
            <span className="font-bold text-[#222222] block">Telegram Bot Credential Token</span>
            <div className="neu-inset rounded-lg p-2.5">
              <input
                type="text"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="w-full bg-transparent font-mono text-slate-800 text-xs focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">Used by Channel Adapter to send/receive messages on Telegram</p>
          </div>
        </div>
      )}
    </div>
  );
};
