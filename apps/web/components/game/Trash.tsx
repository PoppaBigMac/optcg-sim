"use client";

interface TrashProps {
  count: number;
}

export function Trash({ count }: TrashProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-md border border-ink-300 bg-ink-100 flex items-center justify-center font-mono text-sm text-ink-500">
        {count}
      </div>
      <span className="text-[10px] text-ink-400">Trash</span>
    </div>
  );
}
