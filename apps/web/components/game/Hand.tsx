"use client";

import type { CardInstance } from "@optcg/engine";
import { CardView, CardBack } from "./CardView";

interface HandProps {
  cards: readonly CardInstance[];
  isOpponent: boolean;
  selectedId: string | null;
  onSelect: (instanceId: string) => void;
}

export function Hand({ cards, isOpponent, selectedId, onSelect }: HandProps) {
  if (isOpponent) {
    return (
      <div className="flex gap-1 justify-center">
        {cards.map((_, i) => (
          <CardBack key={i} size="sm" />
        ))}
        <span className="text-xs text-ink-400 self-center ml-1">{cards.length}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 overflow-x-auto justify-center pb-1">
      {cards.map((card) => (
        <CardView
          key={card.instanceId}
          card={card}
          selected={selectedId === card.instanceId}
          onClick={() => onSelect(card.instanceId)}
          size="md"
        />
      ))}
    </div>
  );
}
