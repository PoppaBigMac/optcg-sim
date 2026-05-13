"use client";

interface DeckPileProps {
  count: number;
}

export function DeckPile({ count }: DeckPileProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-md border border-ink-300 bg-navy-800 flex items-center justify-center text-white font-mono text-sm">
        {count}
      </div>
      <span className="text-[10px] text-ink-400">Deck</span>
    </div>
  );
}
