"use client";

import { useRef, useEffect } from "react";
import type { Action } from "@optcg/shared-types";

function describeAction(action: Action): string {
  switch (action.type) {
    case "Mulligan":
      return `${action.player} ${action.keep ? "kept hand" : "mulliganed"}`;
    case "PlayCharacter":
      return `${action.player} played character ${action.cardInstanceId}`;
    case "PlayStage":
      return `${action.player} played stage ${action.cardInstanceId}`;
    case "PlayEvent":
      return `${action.player} played event ${action.cardInstanceId}`;
    case "GiveDon":
      return `${action.player} gave DON to ${action.targetInstanceId}`;
    case "DeclareAttack":
      return `${action.player} attacked${action.targetInstanceId ? ` ${action.targetInstanceId}` : " (leader)"}`;
    case "DeclareBlocker":
      return `${action.player} blocked with ${action.blockerInstanceId}`;
    case "PassBlock":
      return `${action.player} passed block`;
    case "UseCounter":
      return `${action.player} used counter ${action.cardInstanceId}`;
    case "PassCounter":
      return `${action.player} passed counter`;
    case "ActivateMainEffect":
      return `${action.player} activated effect`;
    case "EndPhase":
      return `${action.player} ended phase`;
    case "Surrender":
      return `${action.player} surrendered`;
  }
}

interface ActionLogProps {
  actions: readonly Action[];
}

export function ActionLog({ actions }: ActionLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actions.length]);

  return (
    <div className="h-32 sm:h-48 overflow-y-auto border border-ink-200 rounded-md bg-white p-2 text-xs font-mono">
      {actions.length === 0 && (
        <div className="text-ink-300 text-center py-4">No actions yet</div>
      )}
      {actions.map((action, i) => (
        <div key={i} className="py-0.5 border-b border-ink-100 last:border-0">
          <span className="text-ink-400 mr-1">{i + 1}.</span>
          {describeAction(action)}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
