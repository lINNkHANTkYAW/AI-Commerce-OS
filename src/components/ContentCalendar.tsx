import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Bot
} from 'lucide-react';
import { useAppStore } from '../services/store';

export const ContentCalendar: React.FC = () => {
  const { state } = useAppStore();
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);

  const isMM = state.language === 'my';

  const filteredPosts = state.scheduledPosts.filter((p) => channelFilter === 'all' || p.channel === channelFilter);

  const handleSimulateTelegramPublish = async (postText: string, postId: string) => {
    setPublishingPostId(postId);
    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: postText, senderName: 'Content Scheduler' }),
      });
      const data = await res.json();
      alert(`Published via Telegram Bot Adapter: ${data.message}`);
    } catch (e) {
      alert('Published to Telegram Channel in demo mode!');
    } finally {
      setPublishingPostId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222] tracking-tight">{isMM ? 'လူမှုကွန်ရက် မာတီယာ ဇယား' : 'Social Content Calendar & Scheduler'}</h2>
          <p className="text-xs text-slate-500">Schedule, approve, and track automated posts across Telegram, Facebook & Instagram</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="neu-button text-xs font-semibold text-[#222222] px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
      </div>

      {/* Scheduled Posts Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => (
          <div key={post.id} className="neu-flat rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold neu-pill text-[#A98C63] px-2 py-0.5 rounded">
                  {post.channel}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  {post.status}
                </span>
              </div>

              {post.imageUrl && (
                <div className="h-32 rounded-xl overflow-hidden neu-inset">
                  <img src={post.imageUrl} alt="Post asset" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-[#222222] line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="pt-3 border-t border-[#EAE5DC] flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {new Date(post.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>

              {post.channel === 'telegram' && (
                <button
                  onClick={() => handleSimulateTelegramPublish(post.content, post.id)}
                  disabled={publishingPostId === post.id}
                  className="neu-gold text-white font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition shadow-sm"
                >
                  <Send className="w-3 h-3 text-white" />
                  <span>{publishingPostId === post.id ? 'Publishing...' : 'Publish Now'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
