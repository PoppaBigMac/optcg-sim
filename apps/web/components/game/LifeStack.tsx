"use client";

import { cn } from "@/lib/utils";

interface LifeStackProps {
  count: number;
  label?: string;
}

export function LifeStack({ count, label = "Life" }: LifeStackProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={cn(
          "w-10 h-14 sm:w-12 sm:h-16 rounded-md border flex items-center justify-center font-mono text-lg font-bold",
          count > 0
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-ink-300 bg-ink-100 text-ink-400",
        )}
      >
        {count}
      </div>
      <span className="text-[10px] text-ink-400">{label}</span>
    </div>
  );
}
