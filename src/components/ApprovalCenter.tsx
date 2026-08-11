import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Clock, UserCheck, Bot } from 'lucide-react';
import { useAppStore } from '../services/store';

export const ApprovalCenter: React.FC = () => {
  const { state, handleApproval } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');

  const isMM = state.language === 'my';

  const displayedApprovals = state.approvals.filter((a) => filterStatus === 'all' || a.status === filterStatus);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'ခွင့်ပြုချက် စင်တာ' : 'Human Approval Center'}</h2>
          <p className="text-xs text-slate-500">Human-in-the-loop governance for high-risk AI decisions, discounts, refunds & campaigns</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'pending' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
            }`}
          >
            Pending ({state.approvals.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'all' ? 'neu-gold text-white font-bold' : 'neu-button text-[#222222]'
            }`}
          >
            All Requests ({state.approvals.length})
          </button>
        </div>
      </div>

      {/* Approvals Table / Grid */}
      <div className="space-y-4">
        {displayedApprovals.length === 0 ? (
          <div className="neu-flat rounded-2xl p-8 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-xs font-medium text-slate-600">All sensitive AI actions and discounts have been reviewed!</p>
          </div>
        ) : (
          displayedApprovals.map((appr) => (
            <div
              key={appr.id}
              className="neu-flat rounded-2xl p-5 shadow-sm space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#222222] text-sm">{appr.title}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      appr.riskLevel === 'high'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : appr.riskLevel === 'medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'neu-pill text-[#A98C63]'
                    }`}
                  >
                    {appr.riskLevel} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{appr.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3 text-[#A98C63]" /> Requested by: <strong className="text-[#222222]">{appr.requesterName}</strong>
                  </span>
                  <span>•</span>
                  <span>{new Date(appr.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status or Action Buttons */}
              {appr.status === 'pending' ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproval(appr.id, 'rejected')}
                    className="px-4 py-2 rounded-xl neu-button text-[#222222] font-semibold text-xs"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(appr.id, 'approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
                  >
                    Approve Action
                  </button>
                </div>
              ) : (
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold text-xs capitalize ${
                      appr.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {appr.status}
                  </span>
                  <p className="text-[10px] text-slate-500">By {appr.reviewedBy}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
