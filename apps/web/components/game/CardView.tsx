"use client";

import type { CardInstance } from "@optcg/engine";
import { cn } from "@/lib/utils";

interface CardViewProps {
  card: CardInstance;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  size?: "sm" | "md";
  isValidAttacker?: boolean;
  isValidTarget?: boolean;
  highlightAsTarget?: boolean;
}

export function CardView({ card, selected, onClick, faceDown, size = "md", isValidAttacker, isValidTarget, highlightAsTarget }: CardViewProps) {
  if (faceDown) {
    return (
      <div
        className={cn(
          "rounded-md border border-ink-300 bg-navy-800 flex items-center justify-center text-white font-mono text-xs",
          size === "md" ? "w-16 h-22 sm:w-20 sm:h-28" : "w-12 h-16",
        )}
      >
        ?
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    Red: "border-red-500 bg-red-50",
    Green: "border-green-600 bg-green-50",
    Blue: "border-blue-500 bg-blue-50",
    Purple: "border-purple-500 bg-purple-50",
    Black: "border-ink-700 bg-ink-100",
    Yellow: "border-yellow-500 bg-yellow-50",
  };

  const color = card.card.colors[0] ?? "Red";
  const colorClass = colorMap[color] ?? "border-ink-300 bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border-2 flex flex-col p-1 text-left transition-all cursor-pointer relative",
        colorClass,
        size === "md" ? "w-16 h-22 sm:w-20 sm:h-28 text-[10px] sm:text-xs" : "w-12 h-16 text-[8px]",
        selected && "ring-2 ring-orange-500 ring-offset-1 scale-105",
        !selected && isValidAttacker && "ring-2 ring-green-500 ring-offset-1",
        !selected && isValidTarget && "ring-2 ring-red-400 ring-offset-1",
        !selected && !isValidAttacker && !isValidTarget && highlightAsTarget && "ring-2 ring-blue-400 ring-offset-1",
        card.rested && "rotate-12 opacity-80",
      )}
    >
      <div className="font-bold truncate leading-tight">{card.card.name}</div>
      <div className="mt-auto flex justify-between items-end w-full gap-0.5">
        <span className="font-mono">{card.card.cost}c</span>
        <span className="font-mono font-bold">{card.card.power > 0 ? card.card.power + card.attachedDon * 1000 : ""}</span>
      </div>
      {card.attachedDon > 0 && (
        <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">
          +{card.attachedDon}
        </div>
      )}
    </button>
  );
}

export function CardBack({ count, size = "md" }: { count?: number; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink-300 bg-navy-800 flex items-center justify-center text-white font-mono relative",
        size === "md" ? "w-16 h-22 sm:w-20 sm:h-28 text-sm" : "w-12 h-16 text-xs",
      )}
    >
      {count !== undefined && (
        <span className="bg-navy-600 rounded px-1">{count}</span>
      )}
    </div>
  );
}
