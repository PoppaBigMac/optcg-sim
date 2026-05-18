"use client";

import type { CardInstance } from "@optcg/engine";
import { cn } from "@/lib/utils";

interface CostAreaProps {
  don: readonly CardInstance[];
  pendingCost?: number;
  isOpponent?: boolean;
  selectedDonId?: string | null;
  onSelectDon?: (donId: string) => void;
}

export function CostArea({ don, pendingCost = 0, isOpponent = false, selectedDonId, onSelectDon }: CostAreaProps) {
  const active = don.filter((d) => !d.rested);
  const rested = don.filter((d) => d.rested);
  const pendingIds = new Set(active.slice(0, pendingCost).map((d) => d.instanceId));

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">DON!!</span>
        <span className="text-[10px] text-ink-400">
          {active.length} avail · {rested.length} rested · {don.length} total
        </span>
        {selectedDonId && <span className="text-[10px] text-blue-600 font-bold">← select target</span>}
      </div>
      <div className="flex gap-0.5 items-center flex-wrap">
        {don.map((d) => {
          const isPending = !isOpponent && pendingIds.has(d.instanceId);
          const isSelectedForAttach = !isOpponent && d.instanceId === selectedDonId;
          const isClickable = !!onSelectDon && !d.rested && !isPending;
          return (
            <div
              key={d.instanceId}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={isClickable ? () => onSelectDon(d.instanceId) : undefined}
              onKeyDown={isClickable ? (e) => e.key === "Enter" && onSelectDon(d.instanceId) : undefined}
              className={cn(
                "w-6 h-8 sm:w-7 sm:h-10 rounded border text-[8px] font-bold flex flex-col items-center justify-center select-none transition-all",
                d.rested
                  ? "bg-ink-200 border-ink-300 text-ink-400 rotate-12 opacity-60"
                  : "bg-orange-100 border-orange-400 text-orange-700",
                isPending && "ring-2 ring-red-500 bg-red-100 border-red-400 text-red-700",
                isSelectedForAttach && "ring-2 ring-blue-500 bg-blue-100 border-blue-400 text-blue-700",
                isClickable && !isSelectedForAttach && "cursor-pointer hover:opacity-75",
              )}
            >
              <span>D</span>
              <span>ON</span>
            </div>
          );
        })}
        {don.length === 0 && (
          <span className="text-[10px] text-ink-300 italic">No DON</span>
        )}
      </div>
    </div>
  );
}
