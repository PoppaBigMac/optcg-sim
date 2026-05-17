"use client";

import type { CardInstance } from "@optcg/engine";
import { cn } from "@/lib/utils";

interface CostAreaProps {
  don: readonly CardInstance[];
  pendingCost?: number;
  isOpponent?: boolean;
}

export function CostArea({ don, pendingCost = 0, isOpponent = false }: CostAreaProps) {
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
      </div>
      <div className="flex gap-0.5 items-center flex-wrap">
        {don.map((d) => {
          const isPending = !isOpponent && pendingIds.has(d.instanceId);
          return (
            <div
              key={d.instanceId}
              className={cn(
                "w-6 h-8 sm:w-7 sm:h-10 rounded border text-[8px] font-bold flex flex-col items-center justify-center select-none transition-all",
                d.rested
                  ? "bg-ink-200 border-ink-300 text-ink-400 rotate-12 opacity-60"
                  : "bg-orange-100 border-orange-400 text-orange-700",
                isPending && "ring-2 ring-red-500 bg-red-100 border-red-400 text-red-700",
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
