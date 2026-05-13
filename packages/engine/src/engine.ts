import type { Action } from "@optcg/shared-types";
import type { GameState } from "./state";
import type { ActionResult } from "./actions/types";
import * as mulligan from "./actions/mulligan";
import * as playCharacter from "./actions/playCharacter";
import * as giveDon from "./actions/giveDon";
import * as endPhaseAction from "./actions/endPhase";
import * as surrender from "./actions/surrender";

export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.winner) {
    return { ok: false, reason: "Game is already over" };
  }

  let validationResult;
  let nextState: GameState;

  switch (action.type) {
    case "Mulligan":
      validationResult = mulligan.validate(state, action);
      if (!validationResult.ok) return validationResult;
      nextState = mulligan.apply(state, action);
      break;

    case "PlayCharacter":
      validationResult = playCharacter.validate(state, action);
      if (!validationResult.ok) return validationResult;
      nextState = playCharacter.apply(state, action);
      break;

    case "GiveDon":
      validationResult = giveDon.validate(state, action);
      if (!validationResult.ok) return validationResult;
      nextState = giveDon.apply(state, action);
      break;

    case "EndPhase":
      validationResult = endPhaseAction.validate(state, action);
      if (!validationResult.ok) return validationResult;
      nextState = endPhaseAction.apply(state, action);
      break;

    case "Surrender":
      validationResult = surrender.validate(state, action);
      if (!validationResult.ok) return validationResult;
      nextState = surrender.apply(state, action);
      break;

    default:
      return { ok: false, reason: `Action type "${(action as Action).type}" not yet implemented` };
  }

  return {
    ok: true,
    state: { ...nextState, actionLog: [...nextState.actionLog, action] },
  };
}
