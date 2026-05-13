"use client";

import type { Action, PlayerSlot, Phase } from "@optcg/shared-types";
import type { PlayerState, CardInstance, CombatState } from "@optcg/engine";
import { Button } from "@/components/ui/button";

interface ActionPanelProps {
  mySlot: PlayerSlot;
  phase: Phase;
  activePlayer: PlayerSlot;
  myState: PlayerState;
  opponentState: PlayerState;
  combat: CombatState | null;
  selectedCardId: string | null;
  selectedTargetId: string | null;
  selectedDonIds: string[];
  onAction: (action: Action) => void;
}

export function ActionPanel({
  mySlot,
  phase,
  activePlayer,
  myState,
  opponentState,
  combat,
  selectedCardId,
  selectedTargetId,
  selectedDonIds,
  onAction,
}: ActionPanelProps) {
  const isMyTurn = activePlayer === mySlot;

  if (phase === "Mulligan") {
    if (!myState.mulliganDone) {
      return (
        <div className="flex gap-2 justify-center">
          <Button onClick={() => onAction({ type: "Mulligan", player: mySlot, keep: true })}>
            Keep Hand
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction({ type: "Mulligan", player: mySlot, keep: false })}
          >
            Mulligan
          </Button>
        </div>
      );
    }
    return <div className="text-center text-sm text-ink-400">Waiting for opponent to mulligan...</div>;
  }

  if (combat) {
    const isDefender = combat.attackerPlayer !== mySlot;

    if (combat.step === "block" && isDefender) {
      const blockers = myState.characterArea.filter(
        (c) => !c.rested && c.card.effects.some((e) => e.includes("[Blocker]")),
      );

      return (
        <div className="flex gap-2 flex-wrap justify-center">
          {blockers.map((blocker) => (
            <Button
              key={blocker.instanceId}
              size="sm"
              onClick={() =>
                onAction({
                  type: "DeclareBlocker",
                  player: mySlot,
                  blockerInstanceId: blocker.instanceId,
                })
              }
            >
              Block with {blocker.card.name}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction({ type: "PassBlock", player: mySlot })}
          >
            No Block
          </Button>
        </div>
      );
    }

    if (combat.step === "counter" && isDefender) {
      const counterCards = myState.hand.filter((c) => c.card.counter > 0);

      return (
        <div className="flex gap-2 flex-wrap justify-center">
          {counterCards.map((card) => (
            <Button
              key={card.instanceId}
              size="sm"
              onClick={() =>
                onAction({
                  type: "UseCounter",
                  player: mySlot,
                  cardInstanceId: card.instanceId,
                })
              }
            >
              Counter +{card.card.counter} ({card.card.name})
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction({ type: "PassCounter", player: mySlot })}
          >
            No Counter
          </Button>
        </div>
      );
    }

    if (!isDefender) {
      return (
        <div className="text-center text-sm text-ink-400">
          Waiting for opponent to {combat.step === "block" ? "block" : "counter"}...
        </div>
      );
    }
  }

  if (!isMyTurn) {
    return <div className="text-center text-sm text-ink-400">Opponent&apos;s turn — waiting...</div>;
  }

  const selectedCard = selectedCardId
    ? myState.hand.find((c) => c.instanceId === selectedCardId) ??
      myState.characterArea.find((c) => c.instanceId === selectedCardId)
    : null;

  const handCard = selectedCardId
    ? myState.hand.find((c) => c.instanceId === selectedCardId)
    : null;

  const attackerCard = selectedCardId
    ? myState.characterArea.find((c) => c.instanceId === selectedCardId) ??
      (myState.leader.instanceId === selectedCardId ? myState.leader : null)
    : null;

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {phase === "Main" && handCard && handCard.card.type === "Character" && (
        <Button
          size="sm"
          onClick={() =>
            onAction({
              type: "PlayCharacter",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: selectedDonIds,
            })
          }
        >
          Play {handCard.card.name}
        </Button>
      )}

      {phase === "Main" && handCard && handCard.card.type === "Stage" && (
        <Button
          size="sm"
          onClick={() =>
            onAction({
              type: "PlayStage",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: selectedDonIds,
            })
          }
        >
          Play Stage
        </Button>
      )}

      {phase === "Main" && handCard && handCard.card.type === "Event" && (
        <Button
          size="sm"
          onClick={() =>
            onAction({
              type: "PlayEvent",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: selectedDonIds,
            })
          }
        >
          Play Event
        </Button>
      )}

      {phase === "Main" && selectedDonIds.length === 1 && (() => {
        const donTarget = selectedCardId
          ? (myState.leader.instanceId === selectedCardId
              ? myState.leader
              : myState.characterArea.find((c) => c.instanceId === selectedCardId)) ?? null
          : null;
        const targetId = donTarget ? donTarget.instanceId : myState.leader.instanceId;
        const targetName = donTarget ? donTarget.card.name : myState.leader.card.name;
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onAction({
                type: "GiveDon",
                player: mySlot,
                donInstanceId: selectedDonIds[0],
                targetInstanceId: targetId,
              })
            }
          >
            DON → {targetName}
          </Button>
        );
      })()}

      {phase === "Main" && attackerCard && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAction({
              type: "DeclareAttack",
              player: mySlot,
              attackerInstanceId: attackerCard.instanceId,
              targetInstanceId: selectedTargetId ?? opponentState.leader.instanceId,
            })
          }
        >
          Attack{selectedTargetId ? "" : " Leader"}
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction({ type: "EndPhase", player: mySlot })}
      >
        End Phase
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => onAction({ type: "Surrender", player: mySlot })}
      >
        Surrender
      </Button>
    </div>
  );
}
