'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity, AlertTriangle } from 'lucide-react';

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
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const res = await fetch(`/api/timelines/${timelineId}/pulse`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setPulse(await res.json() as PulseData);
        setError(false);
      } catch {
        setError(true);
      }
    };

    void fetchPulse();
    const interval = setInterval(() => void fetchPulse(), 30000);
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
    <aside className="order-1 w-full lg:w-64 xl:w-72 lg:flex-shrink-0 lg:overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">
                Global Pulse
              </h3>
            </div>
            {error ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                Pulse data unavailable
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Collective mood</span>
                  <span className={`font-semibold ${moodColor}`}>{moodLabel}</span>
                </div>
                {pulse ? (
                  <>
                    <div className="h-2 w-full rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${
                          pulse.globalMood > 0.66
                            ? 'bg-emerald-400'
                            : pulse.globalMood < 0.34
                            ? 'bg-amber-400'
                            : 'bg-zinc-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pulse.globalMood * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{pulse.recentPostCount} posts in last 24h</span>
                      <span>{Math.round(pulse.globalMood * 100)}% unity</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-4 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-2 w-3/4 rounded-full bg-white/10 animate-pulse" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">
              Trending
            </h3>
          </div>
          {error && <div className="text-xs text-zinc-500">No data available</div>}
          {!error && pulse?.trending.length === 0 && (
            <div className="text-sm text-zinc-500">No trending topics yet.</div>
          )}
          {!error &&
            pulse?.trending.map((item, i) => (
              <div
                key={item.tag}
                className="mb-2 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 last:mb-0"
              >
                <div>
                  <div className="text-[10px] text-zinc-500">
                    #{i + 1} trending
                  </div>
                  <div className="text-sm font-semibold text-white">{item.tag}</div>
                </div>
                <div className="text-xs text-zinc-400">{item.count} posts</div>
              </div>
            ))}
          {!error && !pulse && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-9 rounded-2xl bg-white/10 animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
