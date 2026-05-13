"use client";

import type { CardInstance } from "@optcg/engine";
import { cn } from "@/lib/utils";

interface LeaderViewProps {
  leader: CardInstance;
  selected?: boolean;
  onClick?: () => void;
}

export function LeaderView({ leader, selected, onClick }: LeaderViewProps) {
  const color = leader.card.colors[0] ?? "Red";
  const colorMap: Record<string, string> = {
    Red: "border-red-500 bg-red-100",
    Green: "border-green-600 bg-green-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 p-1.5 sm:p-2 text-center cursor-pointer transition-all w-20 sm:w-24",
        colorMap[color] ?? "border-ink-300 bg-ink-50",
        selected && "ring-2 ring-orange-500 ring-offset-1 scale-105",
        leader.rested && "rotate-12 opacity-80",
      )}
    >
      <div className="font-bold text-xs sm:text-sm truncate">{leader.card.name}</div>
      <div className="font-mono text-sm sm:text-base font-bold">{leader.card.power + leader.attachedDon * 1000}</div>
      {leader.attachedDon > 0 && (
        <div className="text-[10px] text-orange-600 font-bold">+{leader.attachedDon} DON</div>
      )}
    </button>
  );
}
