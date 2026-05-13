"use client";

import type { Phase, PlayerSlot } from "@optcg/shared-types";
import { cn } from "@/lib/utils";

interface PhaseIndicatorProps {
  phase: Phase;
  activePlayer: PlayerSlot;
  mySlot: PlayerSlot;
  turn: number;
}

const PHASES: Phase[] = ["Mulligan", "Refresh", "Draw", "Don", "Main", "End"];

export function PhaseIndicator({ phase, activePlayer, mySlot, turn }: PhaseIndicatorProps) {
  const isMyTurn = activePlayer === mySlot;

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className={cn("font-bold", isMyTurn ? "text-green-600" : "text-red-500")}>
        {isMyTurn ? "Your turn" : "Opponent's turn"}
      </span>
      <span className="text-ink-400">T{turn}</span>
      <div className="flex gap-0.5">
        {PHASES.map((p) => (
          <span
            key={p}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium",
              p === phase
                ? "bg-orange-500 text-white"
                : "bg-ink-100 text-ink-400",
            )}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
