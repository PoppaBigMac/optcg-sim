"use client";

import type { CardInstance } from "@optcg/engine";
import { CardView } from "./CardView";

interface CharacterAreaProps {
  characters: readonly CardInstance[];
  selectedId: string | null;
  onSelect: (instanceId: string) => void;
}

export function CharacterArea({ characters, selectedId, onSelect }: CharacterAreaProps) {
  return (
    <div className="flex gap-1 justify-center min-h-[4.5rem] sm:min-h-[7.5rem]">
      {characters.length === 0 && (
        <div className="w-16 h-22 sm:w-20 sm:h-28 border border-dashed border-ink-200 rounded-md flex items-center justify-center text-ink-300 text-xs">
          Empty
        </div>
      )}
      {characters.map((card) => (
        <CardView
          key={card.instanceId}
          card={card}
          selected={selectedId === card.instanceId}
          onClick={() => onSelect(card.instanceId)}
        />
      ))}
    </div>
  );
}
