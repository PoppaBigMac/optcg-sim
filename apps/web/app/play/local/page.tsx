"use client";

import { useState, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { createInitialState, applyAction, getPlayer, opponent } from "@optcg/engine";
import type { GameState } from "@optcg/engine";
import type { Action, PlayerSlot } from "@optcg/shared-types";
import { vanillaRedLeader, vanillaRedDeck, vanillaGreenLeader, vanillaGreenDeck } from "@optcg/cards";
import { Board } from "@/components/game/Board";
import { Button } from "@/components/ui/button";

function whoActsNext(state: GameState): PlayerSlot {
  if (state.combat) {
    const defender = opponent(state.combat.attackerPlayer);
    if (state.combat.step === "block" || state.combat.step === "counter") {
      return defender;
    }
  }
  return state.activePlayer;
}

export default function LocalPlayPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [viewAs, setViewAs] = useState<PlayerSlot>("p1");

  const startGame = useCallback(() => {
    const seed = Math.floor(Math.random() * 1_000_000);
    const initial = createInitialState(
      { leader: vanillaRedLeader, cards: vanillaRedDeck },
      { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
      seed,
      "p1",
    );
    setState(initial);
    setViewAs("p1");
  }, []);

  const handleAction = useCallback(
    (action: Action) => {
      if (!state) return;
      const result = applyAction(state, action);
      if (!result.ok) {
        toast.error(result.reason);
        return;
      }
      setState(result.state);

      const next = whoActsNext(result.state);
      if (next !== viewAs && !result.state.winner) {
        setViewAs(next);
      }
    },
    [state, viewAs],
  );

  if (!state) {
    return (
      <div className="min-h-screen bg-ink-50 py-4">
        <Toaster position="top-center" richColors />
        <div className="max-w-sm mx-auto space-y-6 p-4 text-center">
          <h1 className="text-2xl font-bold">Local Hot-Seat</h1>
          <p className="text-sm text-ink-400">
            P1 = Vanilla Red &middot; P2 = Vanilla Green
          </p>
          <Button onClick={startGame} className="w-full">
            Start Match
          </Button>
        </div>
      </div>
    );
  }

  if (state.winner) {
    return (
      <div className="min-h-screen bg-ink-50 py-4">
        <Toaster position="top-center" richColors />
        <div className="max-w-md mx-auto space-y-6 p-4 text-center">
          <h2 className="text-3xl font-bold">
            <span className={state.winner === "p1" ? "text-red-600" : "text-green-600"}>
              {state.winner === "p1" ? "P1 (Red)" : "P2 (Green)"} Wins!
            </span>
          </h2>
          <div className="text-sm text-ink-400">
            {state.actionLog.length} actions &middot; {state.turnNumber} turns
          </div>
          <Button onClick={startGame} className="w-full">
            Play Again
          </Button>
        </div>
      </div>
    );
  }

  const acting = whoActsNext(state);

  return (
    <div className="min-h-screen bg-ink-50 py-4">
      <Toaster position="top-center" richColors />
      <div className="max-w-3xl mx-auto px-2 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="font-bold">
            Turn {state.turnNumber} &middot;{" "}
            <span className={acting === "p1" ? "text-red-600" : "text-green-600"}>
              {acting === "p1" ? "P1 (Red)" : "P2 (Green)"} acts
            </span>
            {state.combat && (
              <span className="text-orange-500 ml-2">
                ⚔ {state.combat.step} step
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewAs === "p1" ? "default" : "outline"}
              onClick={() => setViewAs("p1")}
            >
              P1 View
            </Button>
            <Button
              size="sm"
              variant={viewAs === "p2" ? "default" : "outline"}
              onClick={() => setViewAs("p2")}
            >
              P2 View
            </Button>
          </div>
        </div>

        <Board
          state={state}
          mySlot={viewAs}
          actionLog={state.actionLog}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}
