import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { CombatState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer, opponent } from "../state";

type DeclareAttackAction = Extract<Action, { type: "DeclareAttack" }>;

export function validate(state: GameState, action: DeclareAttackAction): ValidationResult {
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only declare attacks during Main phase" };
  }
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }
  if (state.combat) {
    return { ok: false, reason: "A battle is already in progress" };
  }
  const attackingPlayer = getPlayer(state, action.player);
  if (!attackingPlayer.hasTakenFirstTurn) {
    return { ok: false, reason: "Cannot attack on your first turn" };
  }

  const player = getPlayer(state, action.player);

  const attacker =
    player.leader.instanceId === action.attackerInstanceId
      ? player.leader
      : player.characterArea.find((c) => c.instanceId === action.attackerInstanceId);

  if (!attacker) {
    return { ok: false, reason: "Attacker not found" };
  }
  if (attacker.rested) {
    return { ok: false, reason: "Attacker is rested and cannot attack" };
  }
  if (attacker.summoningSickness) {
    return { ok: false, reason: "Attacker has summoning sickness" };
  }

  const defending = getPlayer(state, opponent(action.player));

  if (action.targetInstanceId === null) {
    return { ok: false, reason: "A target must be specified" };
  }

  const isLeader = defending.leader.instanceId === action.targetInstanceId;
  const targetCharacter = defending.characterArea.find(
    (c) => c.instanceId === action.targetInstanceId,
  );

  if (targetCharacter && !targetCharacter.rested) {
    return { ok: false, reason: "Can only attack rested opponent characters, not active ones" };
  }

  if (!isLeader && !targetCharacter) {
    return { ok: false, reason: "Target not found on opponent's field" };
  }

  if (!isLeader && targetCharacter && !targetCharacter.rested) {
    return { ok: false, reason: "Target must be the opponent's leader or a rested opponent character" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: DeclareAttackAction): GameState {
  const player = getPlayer(state, action.player);
  const defending = getPlayer(state, opponent(action.player));

  const isLeaderAttacking = player.leader.instanceId === action.attackerInstanceId;

  let leader = player.leader;
  let characterArea = player.characterArea;

  if (isLeaderAttacking) {
    leader = { ...leader, rested: true };
  } else {
    characterArea = characterArea.map((c) =>
      c.instanceId === action.attackerInstanceId
        ? { ...c, rested: true }
        : c,
    );
  }

  const updatedPlayer = { ...player, leader, characterArea };
  const stateWithPlayer = setPlayer(state, action.player, updatedPlayer);

  const isLeaderTarget = defending.leader.instanceId === action.targetInstanceId;

  const combat: CombatState = {
    attackerPlayer: action.player,
    attackerInstanceId: action.attackerInstanceId,
    targetKind: isLeaderTarget ? "leader" : "character",
    targetInstanceId: action.targetInstanceId!,
    step: "block",
    powerBoost: 0,
  };

  return { ...stateWithPlayer, combat };
}
