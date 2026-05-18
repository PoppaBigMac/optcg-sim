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
  onAction: (action: Action) => void;
}

function effectivePower(card: CardInstance, isActivePlayer: boolean): number {
  const donBoost = isActivePlayer ? card.attachedDon * 1000 : 0;
  const modBoost = card.modifiers.reduce((sum, m) => sum + m.powerDelta, 0);
  return card.card.power + donBoost + modBoost;
}

function findCard(ps: PlayerState, instanceId: string): CardInstance | undefined {
  if (ps.leader.instanceId === instanceId) return ps.leader;
  return ps.characterArea.find((c) => c.instanceId === instanceId);
}

function CombatMatchup({
  combat,
  mySlot,
  myState,
  opponentState,
  activePlayer,
}: {
  combat: CombatState;
  mySlot: PlayerSlot;
  myState: PlayerState;
  opponentState: PlayerState;
  activePlayer: PlayerSlot;
}) {
  const attackerState = combat.attackerPlayer === mySlot ? myState : opponentState;
  const defenderSlot = combat.attackerPlayer === "p1" ? "p2" : "p1";
  const defenderState = defenderSlot === mySlot ? myState : opponentState;

  const attacker = findCard(attackerState, combat.attackerInstanceId);
  const defender = findCard(defenderState, combat.targetInstanceId);

  if (!attacker || !defender) return null;

  const attackerIsActive = combat.attackerPlayer === activePlayer;
  const atkPower = effectivePower(attacker, attackerIsActive);
  const defPower = effectivePower(defender, !attackerIsActive) + combat.powerBoost;

  const attackerLabel = combat.attackerPlayer === mySlot ? "You" : "Opponent";
  const defenderLabel = combat.attackerPlayer === mySlot ? "Opponent" : "You";
  const stepLabel =
    combat.step === "block" ? "Block?" :
    combat.step === "counter" ? "Counter?" :
    "Resolving";

  return (
    <div className="flex items-center justify-center gap-2 text-xs font-mono border border-orange-300 bg-orange-50 rounded-md px-3 py-1.5 mb-1">
      <span className="text-red-600 font-bold">
        ⚔ {attackerLabel}: {attacker.card.name} <span className="text-red-800">{atkPower}</span>
      </span>
      <span className="text-ink-400">vs</span>
      <span className="text-blue-600 font-bold">
        {defenderLabel}: {defender.card.name} <span className="text-blue-800">{defPower}</span>
      </span>
      <span className="text-orange-600 ml-1">[{stepLabel}]</span>
    </div>
  );
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
  onAction,
}: ActionPanelProps) {
  const isMyTurn = activePlayer === mySlot;

  const activeDon = myState.costArea.filter((d) => !d.rested);
  const autoSelectDon = (cost: number): string[] =>
    activeDon.slice(0, cost).map((d) => d.instanceId);
  const canAfford = (cost: number): boolean => activeDon.length >= cost;

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
        <div className="space-y-1">
          <CombatMatchup
            combat={combat}
            mySlot={mySlot}
            myState={myState}
            opponentState={opponentState}
            activePlayer={activePlayer}
          />
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
                Block with {blocker.card.name} ({blocker.card.power + blocker.attachedDon * 1000})
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
        </div>
      );
    }

    if (combat.step === "counter" && isDefender) {
      const counterCards = myState.hand.filter((c) => c.card.counter > 0);

      return (
        <div className="space-y-1">
          <CombatMatchup
            combat={combat}
            mySlot={mySlot}
            myState={myState}
            opponentState={opponentState}
            activePlayer={activePlayer}
          />
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
        </div>
      );
    }

    // Attacker waiting for opponent's response
    return (
      <div className="space-y-1">
        <CombatMatchup
          combat={combat}
          mySlot={mySlot}
          myState={myState}
          opponentState={opponentState}
          activePlayer={activePlayer}
        />
        <div className="text-center text-sm text-ink-400">
          Waiting for opponent to {combat.step === "block" ? "block" : "counter"}...
        </div>
      </div>
    );
  }

  if (!isMyTurn) {
    return <div className="text-center text-sm text-ink-400">Opponent&apos;s turn — waiting...</div>;
  }

  const handCard = selectedCardId
    ? myState.hand.find((c) => c.instanceId === selectedCardId)
    : null;

  const attackerCard = selectedCardId
    ? myState.characterArea.find((c) => c.instanceId === selectedCardId) ??
      (myState.leader.instanceId === selectedCardId ? myState.leader : null)
    : null;

  // Default attack target is opponent's leader
  const attackTarget = selectedTargetId
    ? (opponentState.leader.instanceId === selectedTargetId
        ? opponentState.leader
        : opponentState.characterArea.find((c) => c.instanceId === selectedTargetId))
    : opponentState.leader;

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {phase === "Main" && handCard && handCard.card.type === "Character" && (
        <Button
          size="sm"
          disabled={!canAfford(handCard.card.cost)}
          title={!canAfford(handCard.card.cost) ? `Need ${handCard.card.cost} DON` : undefined}
          onClick={() =>
            onAction({
              type: "PlayCharacter",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: autoSelectDon(handCard.card.cost),
            })
          }
        >
          Play {handCard.card.name} ({handCard.card.cost} DON)
        </Button>
      )}

      {phase === "Main" && handCard && handCard.card.type === "Stage" && (
        <Button
          size="sm"
          disabled={!canAfford(handCard.card.cost)}
          title={!canAfford(handCard.card.cost) ? `Need ${handCard.card.cost} DON` : undefined}
          onClick={() =>
            onAction({
              type: "PlayStage",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: autoSelectDon(handCard.card.cost),
            })
          }
        >
          Play Stage ({handCard.card.cost} DON)
        </Button>
      )}

      {phase === "Main" && handCard && handCard.card.type === "Event" && (
        <Button
          size="sm"
          disabled={!canAfford(handCard.card.cost)}
          title={!canAfford(handCard.card.cost) ? `Need ${handCard.card.cost} DON` : undefined}
          onClick={() =>
            onAction({
              type: "PlayEvent",
              player: mySlot,
              cardInstanceId: handCard.instanceId,
              donToRest: autoSelectDon(handCard.card.cost),
            })
          }
        >
          Play Event ({handCard.card.cost} DON)
        </Button>
      )}

      {phase === "Main" && attackerCard && attackTarget && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAction({
              type: "DeclareAttack",
              player: mySlot,
              attackerInstanceId: attackerCard.instanceId,
              targetInstanceId: attackTarget.instanceId,
            })
          }
        >
          {attackerCard.card.name} ({effectivePower(attackerCard, true)}) ⚔{" "}
          {attackTarget.card.name} ({effectivePower(attackTarget, false)})
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
