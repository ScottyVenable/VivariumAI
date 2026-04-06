'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity } from 'lucide-react';

interface TrendingTag {
  tag: string;
  count: number;
}

interface PulseData {
  trending: TrendingTag[];
  globalMood: number;
  recentPostCount: number;
}

interface PulseSidebarProps {
  timelineId: string;
}

export function PulseSidebar({ timelineId }: PulseSidebarProps) {
  const [pulse, setPulse] = useState<PulseData | null>(null);

  useEffect(() => {
    const fetchPulse = async () => {
      const res = await fetch(`/api/timelines/${timelineId}/pulse`);
      if (res.ok) {
        setPulse(await res.json() as PulseData);
      }
    };

    fetchPulse();
    const interval = setInterval(fetchPulse, 30000);
    return () => clearInterval(interval);
  }, [timelineId]);

  const moodLabel = pulse
    ? pulse.globalMood > 0.66
      ? 'UNIFIED'
      : pulse.globalMood < 0.34
      ? 'DIVISIVE'
      : 'NEUTRAL'
    : 'LOADING';

  const moodColor = pulse
    ? pulse.globalMood > 0.66
      ? 'text-green-400'
      : pulse.globalMood < 0.34
      ? 'text-red-400'
      : 'text-yellow-400'
    : 'text-gray-500';

  return (
    <aside className="order-1 w-full lg:w-80 lg:flex-shrink-0 lg:overflow-y-auto">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
        <div className="rounded-3xl border border-zinc-900/50 bg-[#111111] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Global Pulse</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Collective Mood</span>
            <span className={`font-bold text-sm ${moodColor}`}>{moodLabel}</span>
          </div>
          {pulse && (
            <>
              <div className="mb-3 h-2 w-full rounded-full bg-zinc-900">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    pulse.globalMood > 0.66
                      ? 'bg-purple-400'
                      : pulse.globalMood < 0.34
                      ? 'bg-zinc-500'
                      : 'bg-zinc-300'
                  }`}
                  style={{ width: `${pulse.globalMood * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {pulse.recentPostCount} posts in the last 24h
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-900/50 bg-[#111111] p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Trending in the Vivarium</h3>
          </div>
          {pulse?.trending.length === 0 && (
            <div className="text-gray-500 text-sm">No trending topics yet.</div>
          )}
          {pulse?.trending.map((item, i) => (
            <div key={item.tag} className="border-b border-zinc-900 py-2 last:border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">#{i + 1} Trending</div>
                  <div className="text-white font-semibold text-sm">{item.tag}</div>
                </div>
                <div className="text-gray-500 text-xs">{item.count} posts</div>
              </div>
            </div>
          ))}
          {!pulse && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
