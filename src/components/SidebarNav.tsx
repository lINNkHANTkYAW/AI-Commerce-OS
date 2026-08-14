import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Package,
  ShoppingBag,
  Sparkles,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Settings,
  Bot,
  Store,
  Globe,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { useAppStore } from '../services/store';

export type NavTab =
  | 'overview'
  | 'inbox'
  | 'customers'
  | 'products'
  | 'orders'
  | 'campaigns'
  | 'calendar'
  | 'analytics'
  | 'approvals'
  | 'settings'
  | 'onboarding'
  | 'simulator';

interface SidebarNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCopilot: () => void;
  onRunDemoScenario: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenCopilot,
  onRunDemoScenario,
}) => {
  const { state, setLanguage } = useAppStore();

  const unreadConversations = state.conversations.filter((c) => c.unread).length;
  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending').length;
  const lowStockCount = state.products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;

  const isMM = state.language === 'my';

  const navItems = [
    { id: 'overview', label: isMM ? 'ပင်မ စာမျက်နှာ' : 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: isMM ? 'မက်ဆေ့ခ်ျများ' : 'Unified Inbox', icon: MessageSquare, badge: unreadConversations },
    { id: 'customers', label: isMM ? 'ဝယ်ယူသူများ (CRM)' : 'Customers CRM', icon: Users },
    { id: 'products', label: isMM ? 'ကုန်ပစ္စည်းများ' : 'Products & Stock', icon: Package, badge: lowStockCount, badgeColor: 'bg-amber-500' },
    { id: 'orders', label: isMM ? 'အမှာစာများ' : 'Orders', icon: ShoppingBag, badge: state.orders.filter(o => o.status === 'draft').length, badgeColor: 'bg-blue-500' },
    { id: 'campaigns', label: isMM ? 'AI ကမ်ပိန်း ရေးဆွဲသူ' : 'Campaign Autopilot', icon: Sparkles, highlight: true },
    { id: 'calendar', label: isMM ? 'လူမှုကွန်ရက် ဇယား' : 'Content Calendar', icon: CalendarDays },
    { id: 'analytics', label: isMM ? 'သုံးသပ်ချက်များ' : 'Analytics & Impact', icon: BarChart3 },
    { id: 'approvals', label: isMM ? 'ခွင့်ပြုချက် စင်တာ' : 'Approval Center', icon: CheckCircle2, badge: pendingApprovals, badgeColor: 'bg-rose-500' },
    { id: 'simulator', label: isMM ? 'စမ်းသပ်မှု စင်တာ' : 'Channel Simulator', icon: Bot },
    { id: 'settings', label: isMM ? 'ပြင်ဆင်ချက်များ' : 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 text-[#222222] flex flex-col shrink-0 h-full min-h-0 z-20 neu-flat rounded-r-2xl overflow-hidden border-r-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#EAE5DC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-gold flex items-center justify-center font-bold">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#222222] text-sm tracking-tight leading-none">AI Commerce OS</h1>
            <span className="text-[10px] text-[#A98C63] font-semibold tracking-widest">SALE BRAIN • ASEAN</span>
          </div>
        </div>
      </div>

      {/* Organization Badge & Demo Scenario Trigger */}
      <div className="p-3 my-2 mx-3 neu-inset rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-600">
          <span className="truncate font-semibold text-[#222222]">{state.currentOrg.name}</span>
          <span className="neu-pill text-[#A98C63] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
            {state.user.role.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onRunDemoScenario}
          className="w-full flex items-center justify-center gap-1.5 neu-gold text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-md transition-all active:scale-98"
        >
          <GraduationCap className="w-3.5 h-3.5 text-white" />
          <span>{isMM ? 'Back-to-School Demo' : 'Run Demo Scenario'}</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'neu-gold font-bold text-white shadow-md'
                  : item.highlight
                  ? 'neu-button text-[#A98C63] hover:text-[#886D49]'
                  : 'neu-button text-[#222222] hover:text-[#000000]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-[#C5A880]' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-[#886D49]' : 'neu-pill text-[#A98C63]'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: AI Copilot & Language Switcher */}
      <div className="p-3 border-t border-[#EAE5DC] space-y-2 neu-inset shrink-0">
        <button
          onClick={onOpenCopilot}
          className="w-full flex items-center justify-center gap-2 neu-button text-[#222222] text-xs font-semibold py-2 px-3 rounded-xl transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880] animate-pulse" />
          <span>{isMM ? 'AI Copilot ကို မေးမည်' : 'Ask Business Copilot'}</span>
        </button>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium">{isMM ? 'ဘာသာစကား' : 'Language'}</span>
          </div>
          <div className="flex neu-inset rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-md transition ${state.language === 'en' ? 'neu-gold text-white font-bold' : 'text-slate-600 hover:text-black'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('my')}
              className={`px-2 py-0.5 rounded-md transition ${state.language === 'my' ? 'neu-gold text-white font-bold' : 'text-slate-600 hover:text-black'}`}
            >
              မြန်မာ
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
