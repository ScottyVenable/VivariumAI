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
    <aside className="w-80 flex-shrink-0 hidden xl:block">
      <div className="sticky top-4 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Global Pulse</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Collective Mood</span>
            <span className={`font-bold text-sm ${moodColor}`}>{moodLabel}</span>
          </div>
          {pulse && (
            <>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    pulse.globalMood > 0.66
                      ? 'bg-green-400'
                      : pulse.globalMood < 0.34
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
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

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">Trending in the Vivarium</h3>
          </div>
          {pulse?.trending.length === 0 && (
            <div className="text-gray-500 text-sm">No trending topics yet.</div>
          )}
          {pulse?.trending.map((item, i) => (
            <div key={item.tag} className="py-2 border-b border-white/5 last:border-0">
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
