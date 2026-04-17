'use client';

import { useMemo } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { filterCandidates, type MentionCandidate } from '@/lib/mentions';
import { cn } from '@/lib/utils';

interface MentionAutocompleteProps {
  candidates: MentionCandidate[];
  mention: string;
  onSelect: (candidate: MentionCandidate) => void;
  position?: { top: number; left: number };
  selectedIndex?: number;
}

export function MentionAutocomplete({
  candidates,
  mention,
  onSelect,
  position,
  selectedIndex = 0,
}: MentionAutocompleteProps) {
  const filtered = useMemo(() => filterCandidates(candidates, mention), [candidates, mention]);

  if (filtered.length === 0) return null;

  return (
    <div
      className="fixed z-[100] max-h-[240px] w-[300px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 shadow-lg"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
    >
      {filtered.map((candidate, index) => (
        <button
          key={candidate.id}
          onClick={() => onSelect(candidate)}
          className={cn(
            'flex w-full items-center gap-3 border-b border-zinc-900 px-3 py-2 text-left transition-colors hover:bg-zinc-900',
            index === selectedIndex && 'bg-zinc-900',
            index === filtered.length - 1 && 'border-b-0'
          )}
        >
          <Avatar src={null} alt={candidate.displayName} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{candidate.displayName}</div>
            <div className="truncate text-xs text-zinc-500">@{candidate.username}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
