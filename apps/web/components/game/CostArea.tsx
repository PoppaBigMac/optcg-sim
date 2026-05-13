"use client";

import type { CardInstance } from "@optcg/engine";
import { cn } from "@/lib/utils";

interface CostAreaProps {
  don: readonly CardInstance[];
  selectedIds: string[];
  onToggle: (instanceId: string) => void;
}

export function CostArea({ don, selectedIds, onToggle }: CostAreaProps) {
  const active = don.filter((d) => !d.rested);
  const rested = don.filter((d) => d.rested);

  return (
    <div className="flex gap-0.5 items-center flex-wrap justify-center">
      {don.map((d) => (
        <button
          key={d.instanceId}
          type="button"
          onClick={() => onToggle(d.instanceId)}
          className={cn(
            "w-6 h-8 sm:w-7 sm:h-10 rounded border text-[8px] sm:text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
            d.rested
              ? "bg-ink-200 border-ink-300 text-ink-400 rotate-12"
              : "bg-orange-100 border-orange-400 text-orange-700",
            selectedIds.includes(d.instanceId) && "ring-2 ring-orange-500 scale-110",
          )}
        >
          D
        </button>
      ))}
      <span className="text-[10px] text-ink-400 ml-1">
        {active.length}/{don.length}
      </span>
    </div>
  );
}
