'use client';

import { useState } from 'react';
import { Settings, Zap, Ban, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Play, Pause } from 'lucide-react';

interface GodModeDashboardProps {
  timelineId: string;
  globalMood: number;
  onMoodChange: (mood: number) => void;
  isRunning: boolean;
  onToggleSimulation: () => void;
  bots: Array<{ id: string; displayName: string; tier: string; username: string }>;
  onAscend: (botId: string) => void;
  onBan: (botId: string) => void;
}

export function GodModeDashboard({
  globalMood,
  onMoodChange,
  isRunning,
  onToggleSimulation,
  bots,
  onAscend,
  onBan,
}: GodModeDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const moodPercent = Math.round(globalMood * 100);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 transition-colors hover:bg-zinc-800 md:bottom-6 md:right-6 md:h-14 md:w-14 md:px-0"
        title="God Mode Dashboard"
        aria-label="Open God Mode Dashboard"
      >
        <Settings className="w-6 h-6 text-white" />
        <span className="text-sm font-semibold text-white sm:hidden">Control</span>
        {isRunning && (
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 sm:items-end sm:bg-transparent">
      <div className="w-full overflow-hidden rounded-t-3xl border border-zinc-800 bg-[#111111] sm:mb-6 sm:mr-6 sm:w-96 sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-sm">GOD MODE</span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-purple-400">
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
                {moodPercent < 34 ? 'Divisive' : moodPercent > 66 ? 'Unified' : 'Neutral'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={moodPercent}
                onChange={e => onMoodChange(parseInt(e.target.value) / 100)}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-900 accent-purple-400"
              />
              <TrendingUp className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">{moodPercent}% Unity</div>
          </div>

          <div>
            <button
              onClick={onToggleSimulation}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                isRunning
                  ? 'border-green-700 bg-green-950 text-green-300 hover:bg-green-900'
                  : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Simulation
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play Simulation
                </>
              )}
            </button>
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
                  className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900 px-2 py-2 hover:bg-zinc-800"
                >
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{bot.displayName}</div>
                    <div className="text-gray-500 text-xs truncate">{bot.tier}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onAscend(bot.id)}
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-800"
                      title="Ascend"
                    >
                      Promote
                    </button>
                    <button
                      onClick={() => onBan(bot.id)}
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-800"
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
