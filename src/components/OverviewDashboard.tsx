import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  Lightbulb,
  Clock,
  Zap,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { useAppStore } from '../services/store';

interface OverviewDashboardProps {
  onNavigateTab: (tab: any) => void;
  onRunDemoScenario: () => void;
}

const REVENUE_DATA = [
  { day: 'Mon', revenueMMK: 1250000, orders: 2 },
  { day: 'Tue', revenueMMK: 1850000, orders: 3 },
  { day: 'Wed', revenueMMK: 850000, orders: 1 },
  { day: 'Thu', revenueMMK: 2450000, orders: 4 },
  { day: 'Fri', revenueMMK: 3200000, orders: 5 },
  { day: 'Sat', revenueMMK: 2900000, orders: 4 },
  { day: 'Sun', revenueMMK: 3750000, orders: 6 },
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onRunDemoScenario,
}) => {
  const { state, dismissRecommendation, handleApproval } = useAppStore();

  const isMM = state.language === 'my';

  // Calculate live metrics from store
  const totalRevenueMMK = state.orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((acc, o) => acc + o.totalMMK, 0);

  const completedOrders = state.orders.filter((o) => o.status === 'confirmed' || o.status === 'delivered');
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenueMMK / completedOrders.length) : 0;
  const activeConversations = state.conversations.filter((c) => c.status === 'active').length;
  const lowStockProducts = state.products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  const activeRecommendations = state.recommendations.filter((r) => !r.dismissed);
  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Closed-loop Back-to-School Demo Action Trigger */}
      <div className="neu-flat rounded-2xl p-6 text-[#222222] border border-[#C5A880]/30 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[#A98C63] text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Closed-Loop AI Commerce Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#222222]">
              {isMM ? 'NovaTech Myanmar - အက်ရှင်ယူပေးသော AI စနစ်' : 'NovaTech Myanmar — Action-Taking AI Commerce OS'}
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Campaign Planning → Content Creation → Publishing → Inquiry → AI Product Recommendation → Draft Order → CRM Update → Sales Tracking.
            </p>
          </div>

          <button
            onClick={onRunDemoScenario}
            className="shrink-0 flex items-center justify-center gap-2 neu-gold text-white font-bold px-5 py-3 rounded-xl transition-all text-xs active:scale-95"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>{isMM ? 'ကမ်ပိန်း နှင့် အမှာစာ စမ်းသပ်ပါ' : 'Run Back-to-School Closed-Loop Demo'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="neu-flat p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-medium">{isMM ? 'စုစုပေါင်း ဝင်ငွေ' : 'Total Revenue'}</span>
            <div className="w-9 h-9 rounded-xl neu-button text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#222222] tracking-tight">
              {totalRevenueMMK.toLocaleString()} <span className="text-xs font-normal text-slate-500">MMK</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              +18.4% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500">≈ ${(totalRevenueMMK / 1900).toFixed(0)} USD across channels</p>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="neu-flat p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-medium">{isMM ? 'အမှာစာ အရေအတွက်' : 'Orders & AOV'}</span>
            <div className="w-9 h-9 rounded-xl neu-button text-[#C5A880] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#222222] tracking-tight">
              {state.orders.length} <span className="text-xs font-normal text-slate-500">orders</span>
            </span>
            <span className="text-xs font-bold text-[#A98C63]">
              AOV: {avgOrderValue > 0 ? (avgOrderValue / 1000).toFixed(0) + 'k' : '0'} MMK
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Conversion rate: 24.8% from chat inquiries</p>
        </div>

        {/* Metric 3: Active Conversations */}
        <div className="neu-flat p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-medium">{isMM ? 'တုံ့ပြန်ဆဲ စကားဝိုင်းများ' : 'Conversations & Response'}</span>
            <div className="w-9 h-9 rounded-xl neu-button text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#222222] tracking-tight">
              {activeConversations} <span className="text-xs font-normal text-slate-500">active</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> 1.2 min avg
            </span>
          </div>
          <p className="text-[11px] text-slate-500">AI resolution rate: 82% without human handoff</p>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div className="neu-flat p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-medium">{isMM ? 'လက်ကျန် နည်းနေသော ပစ္စည်း' : 'Stock Intelligence'}</span>
            <div className={`w-9 h-9 rounded-xl neu-button flex items-center justify-center ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#222222] tracking-tight">
              {lowStockProducts.length} <span className="text-xs font-normal text-slate-500">low stock</span>
            </span>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#A98C63] hover:underline font-semibold"
            >
              View Stock
            </button>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold truncate">
            {lowStockProducts.length > 0 ? `Warning: ${lowStockProducts[0].name}` : 'Stock levels optimal'}
          </p>
        </div>
      </div>

      {/* AI Actionable Business Recommendations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg neu-gold text-white flex items-center justify-center font-bold">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-[#222222] text-sm">
              {isMM ? 'AI စီးပွားရေး အကြံပြုချက်များ' : 'AI Actionable Business Recommendations'}
            </h3>
            <span className="neu-pill text-[#A98C63] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {activeRecommendations.length} active
            </span>
          </div>
          <span className="text-xs text-slate-500">Derived from real store metrics & customer inquiries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="neu-flat rounded-2xl p-5 hover:border-[#C5A880]/40 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#222222] leading-snug">{rec.title}</span>
                  <button
                    onClick={() => dismissRecommendation(rec.id)}
                    className="text-slate-400 hover:text-[#222222] p-1 rounded-lg neu-button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-normal">{rec.summary}</p>
                <div className="neu-inset p-2.5 rounded-xl text-[11px] text-slate-700 font-mono">
                  📊 {rec.supportingData}
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#A98C63] neu-pill px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3 text-[#C5A880]" /> Confidence: {rec.confidenceScore}%
                </div>
                <button
                  onClick={() => {
                    if (rec.actionType === 'contact_high_intent') onNavigateTab('inbox');
                    else if (rec.actionType === 'restock') onNavigateTab('products');
                    else onNavigateTab('campaigns');
                  }}
                  className="neu-gold text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                >
                  Review Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts & Pending Approvals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 neu-flat p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#222222] text-sm">{isMM ? 'ရောင်းအား တိုးတက်မှု ဇယား' : 'Revenue & Orders Performance'}</h3>
              <p className="text-xs text-slate-500">Daily sales trend over the past week (MMK)</p>
            </div>
            <span className="text-xs text-[#A98C63] font-bold">Weekly Total: 16,250,000 MMK</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A880" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A880" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE5DC', borderRadius: '12px', color: '#222222', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="revenueMMK" stroke="#C5A880" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="neu-flat p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#222222] text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                <span>{isMM ? 'စောင့်ဆိုင်းဆဲ ခွင့်ပြုချက်များ' : 'Pending Owner Approvals'}</span>
              </h3>
              <button onClick={() => onNavigateTab('approvals')} className="text-xs text-[#A98C63] font-bold hover:underline">
                View All
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs text-slate-500">No pending approvals required right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((appr) => (
                  <div key={appr.id} className="p-3.5 neu-inset rounded-xl space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-[#222222]">{appr.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase neu-pill text-amber-700">
                        {appr.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-tight">{appr.description}</p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleApproval(appr.id, 'rejected')}
                        className="px-3 py-1 rounded-lg neu-button text-slate-600 font-medium text-[11px]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproval(appr.id, 'approved')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="neu-inset p-3 rounded-xl text-xs text-slate-600">
            🛡️ <strong>Governance Guarantee:</strong> Sensitive AI actions like discounts and order cancellations always require explicit owner approval.
          </div>
        </div>
      </div>
    </div>
  );
};
