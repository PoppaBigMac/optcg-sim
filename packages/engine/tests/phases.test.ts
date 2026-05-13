import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/setup";
import { applyAction } from "../src/engine";
import { getPlayer } from "../src/state";
import { vanillaRedLeader, vanillaRedDeck } from "../../cards/src/decks/vanilla-red";
import { vanillaGreenLeader, vanillaGreenDeck } from "../../cards/src/decks/vanilla-green";
import type { GameState } from "../src/state";
import type { Action } from "@optcg/shared-types";

const SEED = 42;

function makeState() {
  return createInitialState(
    { leader: vanillaRedLeader, cards: vanillaRedDeck },
    { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
    SEED,
    "p1",
  );
}

function applyOk(state: GameState, action: Action): GameState {
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`Action failed: ${result.reason}`);
  return result.state;
}

// Advance past mulligan: both players keep → auto-advances to Main
function pastMulligan(state: GameState): GameState {
  let s = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
  s = applyOk(s, { type: "Mulligan", player: "p2", keep: true });
  return s;
}

describe("phase transitions", () => {
  it("first player skips draw on turn 1", () => {
    // Mulligan auto-advances through Refresh → Draw → Don → Main.
    // First player should NOT have drawn on turn 1 (draw skipped).
    const state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");

    // Hand should still be 5 (no draw happened)
    expect(p1.hand).toHaveLength(5);
    expect(state.phase).toBe("Main");
  });

  it("first player gets 1 DON on turn 1", () => {
    const state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");
    expect(p1.costArea).toHaveLength(1);
  });

  it("second player gets 2 DON on their first turn", () => {
    let state = pastMulligan(makeState());
    // End p1's turn
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    // Now it's p2's turn (turn 2), auto-advanced to Main
    const p2 = getPlayer(state, "p2");
    expect(p2.costArea).toHaveLength(2);
  });

  it("DON cap at 10", () => {
    let state = pastMulligan(makeState());
    // Play through many turns to accumulate DON
    for (let i = 0; i < 20; i++) {
      state = applyOk(state, { type: "EndPhase", player: state.activePlayer });
    }
    const p1 = getPlayer(state, "p1");
    const p2 = getPlayer(state, "p2");
    expect(p1.costArea.length).toBeLessThanOrEqual(10);
    expect(p2.costArea.length).toBeLessThanOrEqual(10);
  });

  it("rested cards refresh to active during refresh phase", () => {
    let state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");

    // Rest the DON in cost area (simulate by playing a 1-cost character)
    const oneCosters = p1.hand.filter((c) => c.card.cost === 1);
    if (oneCosters.length > 0 && p1.costArea.length >= 1) {
      const activeDon = p1.costArea.find((d) => !d.rested);
      if (activeDon) {
        state = applyOk(state, {
          type: "PlayCharacter",
          player: "p1",
          cardInstanceId: oneCosters[0].instanceId,
          donToRest: [activeDon.instanceId],
        });

        // Verify DON is rested
        const p1AfterPlay = getPlayer(state, "p1");
        const restedDon = p1AfterPlay.costArea.find((d) => d.instanceId === activeDon.instanceId);
        expect(restedDon?.rested).toBe(true);

        // End turn and come back
        state = applyOk(state, { type: "EndPhase", player: "p1" }); // p2's turn
        state = applyOk(state, { type: "EndPhase", player: "p2" }); // p1's turn again

        // All DON should be active after refresh
        const p1Refreshed = getPlayer(state, "p1");
        for (const don of p1Refreshed.costArea) {
          expect(don.rested).toBe(false);
        }
      }
    }
  });
});
