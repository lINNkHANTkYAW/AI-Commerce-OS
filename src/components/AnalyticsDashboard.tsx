import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  Building2,
  DollarSign,
  Zap,
  Globe2,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAppStore } from '../services/store';

const CHANNEL_ROAS_DATA = [
  { channel: 'Facebook Feed', revenueMMK: 8500000, inquiries: 42 },
  { channel: 'Telegram Bot', revenueMMK: 5200000, inquiries: 28 },
  { channel: 'Instagram Reels', revenueMMK: 2550000, inquiries: 15 },
  { channel: 'Direct Web Chat', revenueMMK: 3750000, inquiries: 22 },
];

const AI_PERFORMANCE_COLORS = ['#C5A059', '#10b981', '#f59e0b'];
const AI_PERFORMANCE_PIE = [
  { name: 'AI Auto-Resolved', value: 82 },
  { name: 'Human Approved', value: 14 },
  { name: 'Escalated to Support', value: 4 },
];

export const AnalyticsDashboard: React.FC = () => {
  const { state } = useAppStore();

  const isMM = state.language === 'my';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'သုံးသပ်ချက်များ & SDG သက်ရောက်မှု' : 'Analytics & UN SDG Impact Report'}</h2>
          <p className="text-xs text-slate-500">Business performance metrics, AI action efficiency, and UN SDG 8 & 9 impact statistics</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            🌱 UN SDG 8 & 9 Aligned
          </span>
        </div>
      </div>

      {/* UN SDG Impact Cards Banner */}
      <div className="neu-flat rounded-2xl p-6 text-[#222222] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#A98C63]" />
            <span className="font-bold text-sm tracking-tight text-[#222222]">United Nations SDG Impact Metrics</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">SDG 8: Decent Work & SDG 9: Industry Innovation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 neu-inset rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Estimated Hours Saved / Mo</span>
            <p className="text-xl font-bold text-[#A98C63]">142.5 hrs</p>
            <p className="text-[10px] text-slate-500">Automating customer responses & order drafts</p>
          </div>

          <div className="p-3 neu-inset rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Response Time Accelerated</span>
            <p className="text-xl font-bold text-emerald-700">92% Faster</p>
            <p className="text-[10px] text-slate-500">Reduced from 25 mins to 1.2 mins avg</p>
          </div>

          <div className="p-3 neu-inset rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Content Production Time</span>
            <p className="text-xl font-bold text-purple-700">85% Reduced</p>
            <p className="text-[10px] text-slate-500">AI Campaign Autopilot generates copy in seconds</p>
          </div>

          <div className="p-3 neu-inset rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Digitized MSME Revenue</span>
            <p className="text-xl font-bold text-[#A98C63]">20,000,000+ MMK</p>
            <p className="text-[10px] text-slate-500">Closed through closed-loop social commerce</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Revenue Attribution Bar Chart */}
        <div className="neu-flat rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#222222] text-sm">Revenue Attribution by Social Channel</h3>
            <span className="text-xs text-slate-500 font-medium">MMK Total</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHANNEL_ROAS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, 'Attributed Revenue']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', borderColor: '#EAE5DC', color: '#222222', fontSize: '12px' }}
                />
                <Bar dataKey="revenueMMK" fill="#C5A880" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Action Resolution Rate Pie Chart */}
        <div className="neu-flat rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#222222] text-sm">AI Resolution & Governance Efficiency</h3>
            <span className="text-xs text-slate-500 font-medium">Resolution %</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={AI_PERFORMANCE_PIE}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {AI_PERFORMANCE_PIE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AI_PERFORMANCE_COLORS[index % AI_PERFORMANCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Percentage']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', borderColor: '#EAE5DC', color: '#222222', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-medium">
            {AI_PERFORMANCE_PIE.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AI_PERFORMANCE_COLORS[idx] }}></span>
                <span className="text-slate-600">{entry.name} ({entry.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
