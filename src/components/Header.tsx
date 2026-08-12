import React, { useState } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Building,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  User
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { OrganizationRole } from '../types';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onOpenCopilot: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCopilot, onNavigateTab, onOpenAuth }) => {
  const { state, setRole, resetDemoData } = useAppStore();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const pendingApprovals = state.approvals.filter((a) => a.status === 'pending');
  const roles: OrganizationRole[] = ['owner', 'manager', 'marketing', 'sales', 'support'];

  const isMM = state.language === 'my';

  return (
    <header className="h-16 neu-flat px-6 flex items-center justify-between sticky top-0 z-10 rounded-b-2xl border-t-0">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isMM ? 'ဝယ်ယူသူ၊ ကုန်ပစ္စည်း သို့ အမှာစာ ရှာဖွေပါ...' : 'Search customers, products, orders...'}
            className="w-full pl-10 pr-3 py-2 neu-inset rounded-xl text-xs text-[#222222] placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Supabase Tenant Auth Pill */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 neu-button text-[#222222] px-3 py-2 rounded-xl text-xs font-semibold transition hover:border-[#C5A880]"
        >
          <User className="w-3.5 h-3.5 text-[#C5A880]" />
          <span className="hidden sm:inline">Store: <strong className="text-[#A98C63]">{state.currentOrg?.name || 'Default Store'}</strong></span>
        </button>

        {/* Supabase Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 neu-button text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase DB</span>
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 neu-button text-[#222222] px-3 py-2 rounded-xl text-xs font-semibold transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Role: <strong className="capitalize text-[#A98C63]">{state.user.role}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-48 neu-flat rounded-xl shadow-2xl p-2 z-30 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Active Role
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium capitalize transition flex items-center justify-between ${
                    state.user.role === r ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222] hover:text-black'
                  }`}
                >
                  <span>{r}</span>
                  {state.user.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approval Badge Button */}
        <button
          onClick={() => onNavigateTab('approvals')}
          className="relative flex items-center gap-2 neu-button text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Bell className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">{isMM ? 'ခွင့်ပြုရန်' : 'Approvals'}</span>
          {pendingApprovals.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        {/* Reset Seed Data Button */}
        <button
          onClick={() => {
            if (confirm('Reset demo state to initial seed data?')) {
              resetDemoData();
            }
          }}
          title="Reset Demo Data"
          className="p-2 neu-button text-slate-600 hover:text-black rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 neu-gold text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Copilot</span>
        </button>
      </div>
    </header>
  );
};

