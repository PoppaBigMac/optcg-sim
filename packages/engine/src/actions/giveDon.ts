import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer } from "../state";

type GiveDonAction = Extract<Action, { type: "GiveDon" }>;

export function validate(state: GameState, action: GiveDonAction): ValidationResult {
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only give DON during Main phase" };
  }
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }

  const player = getPlayer(state, action.player);

  const don = player.costArea.find(
    (d) => d.instanceId === action.donInstanceId && !d.rested,
  );
  if (!don) {
    return { ok: false, reason: "DON not found or is rested" };
  }

  // Target must be a character or leader belonging to this player
  const isLeader = player.leader.instanceId === action.targetInstanceId;
  const isCharacter = player.characterArea.some(
    (c) => c.instanceId === action.targetInstanceId,
  );
  if (!isLeader && !isCharacter) {
    return { ok: false, reason: "Target must be your leader or a character" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: GiveDonAction): GameState {
  const player = getPlayer(state, action.player);

  // Remove DON from cost area
  const newCostArea = player.costArea.filter(
    (d) => d.instanceId !== action.donInstanceId,
  );

  let leader = player.leader;
  let characterArea = player.characterArea;

  if (player.leader.instanceId === action.targetInstanceId) {
    leader = { ...leader, attachedDon: leader.attachedDon + 1 };
  } else {
    characterArea = characterArea.map((c) =>
      c.instanceId === action.targetInstanceId
        ? { ...c, attachedDon: c.attachedDon + 1 }
        : c,
    );
  }

  const updatedPlayer = {
    ...player,
    costArea: newCostArea,
    leader,
    characterArea,
    givenDonThisTurn: player.givenDonThisTurn + 1,
  };

  return setPlayer(state, action.player, updatedPlayer);
}
