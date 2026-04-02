'use client';

import { useState } from 'react';
import { Settings, Zap, Ban, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface GodModeDashboardProps {
  timelineId: string;
  globalMood: number;
  onMoodChange: (mood: number) => void;
  onTick: () => void;
  bots: Array<{ id: string; displayName: string; tier: string; username: string }>;
  onAscend: (botId: string) => void;
  onBan: (botId: string) => void;
}

export function GodModeDashboard({
  timelineId,
  globalMood,
  onMoodChange,
  onTick,
  bots,
  onAscend,
  onBan,
}: GodModeDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTicking, setIsTicking] = useState(false);
  const [tickResult, setTickResult] = useState<string | null>(null);

  const handleTick = async () => {
    setIsTicking(true);
    setTickResult(null);
    try {
      const res = await fetch(`/api/timelines/${timelineId}/tick`, { method: 'POST' });
      const data = await res.json() as { botsProcessed: number };
      setTickResult(`Tick complete: ${data.botsProcessed} bots acted`);
      onTick();
    } catch {
      setTickResult('Tick failed');
    } finally {
      setIsTicking(false);
    }
  };

  const moodPercent = Math.round(globalMood * 100);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 px-4 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all z-50 sm:bottom-6 sm:right-6 sm:w-14 sm:h-14 sm:px-0"
        title="God Mode Dashboard"
      >
        <Settings className="w-6 h-6 text-white" />
        <span className="text-sm font-semibold text-white sm:hidden">Control</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 backdrop-blur-sm sm:items-end sm:bg-transparent sm:backdrop-blur-0">
      <div className="w-full rounded-t-3xl bg-gray-950 border border-purple-500/50 shadow-2xl shadow-purple-900/30 overflow-hidden sm:mb-6 sm:mr-6 sm:w-96 sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-purple-900/30 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-sm">GOD MODE</span>
            <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded-full">
              ARCHITECT
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-white">Vibe Slider</label>
              <span className="text-xs text-gray-400">
                {moodPercent < 34 ? '🔴 Divisive' : moodPercent > 66 ? '🟢 Unified' : '🟡 Neutral'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={moodPercent}
                onChange={e => onMoodChange(parseInt(e.target.value) / 100)}
                className="flex-1 h-2 rounded-full appearance-none bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 cursor-pointer"
              />
              <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">{moodPercent}% Unity</div>
          </div>

          <div>
            <button
              onClick={handleTick}
              disabled={isTicking}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {isTicking ? 'Ticking...' : '⚡ Trigger Tick'}
            </button>
            {tickResult && (
              <div className="mt-1 text-xs text-center text-gray-400">{tickResult}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-white">Bot Management</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {bots.slice(0, 20).map(bot => (
                <div
                  key={bot.id}
                  className="flex items-center justify-between gap-2 py-2 px-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{bot.displayName}</div>
                    <div className="text-gray-500 text-xs truncate">{bot.tier}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onAscend(bot.id)}
                      className="px-2 py-1 text-xs bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 rounded-md transition-colors"
                      title="Ascend"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onBan(bot.id)}
                      className="px-2 py-1 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-md transition-colors"
                      title="Ban"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
