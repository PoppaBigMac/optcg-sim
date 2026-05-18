"use client";

import { useState, useCallback } from "react";
import type { Action, PlayerSlot } from "@optcg/shared-types";
import type { GameState } from "@optcg/engine";
import { getPlayer, opponent } from "@optcg/engine";
import { Hand } from "./Hand";
import { CharacterArea } from "./CharacterArea";
import { CostArea } from "./CostArea";
import { LeaderView } from "./LeaderView";
import { LifeStack } from "./LifeStack";
import { DeckPile } from "./DeckPile";
import { Trash } from "./Trash";
import { PhaseIndicator } from "./PhaseIndicator";
import { ActionPanel } from "./ActionPanel";
import { ActionLog } from "./ActionLog";

interface BoardProps {
  state: GameState;
  mySlot: PlayerSlot;
  actionLog: readonly Action[];
  onAction: (action: Action) => void;
}

export function Board({ state, mySlot, actionLog, onAction }: BoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedDonIds, setSelectedDonIds] = useState<string[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const me = getPlayer(state, mySlot);
  const opp = getPlayer(state, opponent(mySlot));

  const handleSelectCard = useCallback((id: string) => {
    setSelectedCardId((prev) => (prev === id ? null : id));
    setSelectedTargetId(null);
  }, []);

  const handleSelectTarget = useCallback((id: string) => {
    setSelectedTargetId((prev) => (prev === id ? null : id));
  }, []);

  const handleToggleDon = useCallback((id: string) => {
    setSelectedDonIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }, []);

  const handleAction = useCallback(
    (action: Action) => {
      onAction(action);
      setSelectedCardId(null);
      setSelectedTargetId(null);
      setSelectedDonIds([]);
    },
    [onAction],
  );

  return (
    <div className="flex items-stretch gap-2 w-full">
      {/* Game board */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <PhaseIndicator
          phase={state.phase}
          activePlayer={state.activePlayer}
          mySlot={mySlot}
          turn={state.turnNumber}
        />

        {/* Opponent area */}
        <div className="border border-ink-200 rounded-lg p-2 bg-ink-50 space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-400 px-1">
            <span>Opponent ({opponent(mySlot)})</span>
          </div>
          <Hand cards={opp.hand} isOpponent selectedId={null} onSelect={() => {}} />
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <LifeStack count={opp.life.length} />
            <LeaderView
              leader={opp.leader}
              selected={selectedTargetId === opp.leader.instanceId}
              onClick={() => handleSelectTarget(opp.leader.instanceId)}
            />
            <DeckPile count={opp.deck.length} />
            <Trash count={opp.trash.length} />
          </div>
          <CharacterArea
            characters={opp.characterArea}
            selectedId={selectedTargetId}
            onSelect={handleSelectTarget}
          />
        </div>

        <ActionPanel
          mySlot={mySlot}
          phase={state.phase}
          activePlayer={state.activePlayer}
          myState={me}
          opponentState={opp}
          combat={state.combat}
          selectedCardId={selectedCardId}
          selectedTargetId={selectedTargetId}
          selectedDonIds={selectedDonIds}
          onAction={handleAction}
        />

        {/* My area */}
        <div className="border border-ink-200 rounded-lg p-2 bg-white space-y-1">
          <CharacterArea
            characters={me.characterArea}
            selectedId={selectedCardId}
            onSelect={handleSelectCard}
          />
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <LifeStack count={me.life.length} />
            <LeaderView
              leader={me.leader}
              selected={selectedCardId === me.leader.instanceId}
              onClick={() => handleSelectCard(me.leader.instanceId)}
            />
            <DeckPile count={me.deck.length} />
            <Trash count={me.trash.length} />
          </div>
          <CostArea don={me.costArea} selectedIds={selectedDonIds} onToggle={handleToggleDon} />
          <Hand cards={me.hand} isOpponent={false} selectedId={selectedCardId} onSelect={handleSelectCard} />
          <div className="text-xs text-ink-400 text-center">
            You ({mySlot})
          </div>
        </div>
      </div>

      {/* Collapsible action log sidebar */}
      <div
        className={`self-stretch shrink-0 flex flex-col border border-ink-200 rounded-lg bg-white overflow-hidden transition-[width] duration-200 ${logOpen ? "w-52" : "w-8"}`}
      >
        <button
          type="button"
          onClick={() => setLogOpen((v) => !v)}
          className="shrink-0 flex items-center justify-center h-8 text-ink-400 hover:bg-ink-50 hover:text-ink-600 text-xs font-mono"
          title={logOpen ? "Collapse log" : "Expand log"}
        >
          {logOpen ? "▶" : "◀"}
        </button>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ActionLog
            actions={actionLog}
            className="h-full border-0 rounded-none"
          />
        </div>
      </div>
    </div>
  );
}
