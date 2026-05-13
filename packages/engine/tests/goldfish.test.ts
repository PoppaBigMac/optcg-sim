import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/setup";
import { applyAction } from "../src/engine";
import { getPlayer } from "../src/state";
import { vanillaRedLeader, vanillaRedDeck } from "../../cards/src/decks/vanilla-red";
import { vanillaGreenLeader, vanillaGreenDeck } from "../../cards/src/decks/vanilla-green";
import type { GameState } from "../src/state";
import type { Action } from "@optcg/shared-types";

const SEED = 12345;

function applyOk(state: GameState, action: Action): GameState {
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`Action failed: ${result.reason}`);
  return result.state;
}

// Play the cheapest character affordable this turn, or pass
function playAffordableCharacters(state: GameState): GameState {
  let s = state;
  const player = state.activePlayer;

  for (let attempts = 0; attempts < 10; attempts++) {
    const p = getPlayer(s, player);
    const activeDon = p.costArea.filter((d) => !d.rested);
    if (activeDon.length === 0) break;
    if (p.characterArea.length >= 5) break;

    const affordable = p.hand
      .filter((c) => c.card.type === "Character" && c.card.cost <= activeDon.length)
      .sort((a, b) => b.card.cost - a.card.cost); // play most expensive affordable

    if (affordable.length === 0) break;

    const toPlay = affordable[0];
    const donToRest = activeDon.slice(0, toPlay.card.cost).map((d) => d.instanceId);

    const result = applyAction(s, {
      type: "PlayCharacter",
      player,
      cardInstanceId: toPlay.instanceId,
      donToRest,
    });
    if (!result.ok) break;
    s = result.state;
  }

  return s;
}

describe("goldfish game", () => {
  it("full game terminates with a winner via deck-out", () => {
    let state = createInitialState(
      { leader: vanillaRedLeader, cards: vanillaRedDeck },
      { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
      SEED,
      "p1",
    );

    // Both players keep — auto-advances to Main
    state = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
    state = applyOk(state, { type: "Mulligan", player: "p2", keep: true });

    let turnCount = 0;
    const maxTurns = 200;

    while (!state.winner && turnCount < maxTurns) {
      const player = state.activePlayer;
      expect(state.phase).toBe("Main");

      // Play affordable characters
      state = playAffordableCharacters(state);

      // End turn (auto-advances through opponent's Refresh → Draw → Don → Main)
      const endResult = applyAction(state, { type: "EndPhase", player });
      if (!endResult.ok) {
        // Something unexpected — game should still be playable
        throw new Error(`EndPhase failed on turn ${turnCount}: ${endResult.reason}`);
      }
      state = endResult.state;
      turnCount++;
    }

    expect(state.winner).not.toBeNull();
    expect(turnCount).toBeLessThan(maxTurns);
    // A 40-card deck drawing 1/turn should deck out around turn 40
    // (50 cards - 5 life - 5 hand = 40 in deck)
    expect(turnCount).toBeGreaterThan(10);
  });

  it("action log records all actions", () => {
    let state = createInitialState(
      { leader: vanillaRedLeader, cards: vanillaRedDeck },
      { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
      SEED,
      "p1",
    );

    state = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
    state = applyOk(state, { type: "Mulligan", player: "p2", keep: true });

    expect(state.actionLog.length).toBeGreaterThanOrEqual(2);
    expect(state.actionLog[0].type).toBe("Mulligan");
    expect(state.actionLog[1].type).toBe("Mulligan");
  });
});
