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

function pastMulligan(state: GameState): GameState {
  let s = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
  s = applyOk(s, { type: "Mulligan", player: "p2", keep: true });
  return s;
}

describe("playCharacter", () => {
  it("rejects playing a character that costs more than active DON", () => {
    let state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");

    // p1 has 1 DON on turn 1. Find a card that costs more than 1.
    const expensiveCard = p1.hand.find((c) => c.card.cost > 1);
    if (expensiveCard) {
      const activeDon = p1.costArea.filter((d) => !d.rested);
      const result = applyAction(state, {
        type: "PlayCharacter",
        player: "p1",
        cardInstanceId: expensiveCard.instanceId,
        donToRest: activeDon.map((d) => d.instanceId),
      });
      expect(result.ok).toBe(false);
    }
  });

  it("successfully plays a character with exact DON cost", () => {
    let state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");

    const oneCoster = p1.hand.find((c) => c.card.cost === 1);
    if (oneCoster && p1.costArea.length >= 1) {
      const activeDon = p1.costArea.filter((d) => !d.rested);
      state = applyOk(state, {
        type: "PlayCharacter",
        player: "p1",
        cardInstanceId: oneCoster.instanceId,
        donToRest: [activeDon[0].instanceId],
      });

      const p1After = getPlayer(state, "p1");
      expect(p1After.characterArea).toHaveLength(1);
      expect(p1After.characterArea[0].card.id).toBe(oneCoster.card.id);
      expect(p1After.hand.find((c) => c.instanceId === oneCoster.instanceId)).toBeUndefined();
    }
  });

  it("played character has summoning sickness", () => {
    let state = pastMulligan(makeState());
    const p1 = getPlayer(state, "p1");

    const oneCoster = p1.hand.find((c) => c.card.cost === 1);
    if (oneCoster && p1.costArea.length >= 1) {
      const activeDon = p1.costArea.filter((d) => !d.rested);
      state = applyOk(state, {
        type: "PlayCharacter",
        player: "p1",
        cardInstanceId: oneCoster.instanceId,
        donToRest: [activeDon[0].instanceId],
      });

      const p1After = getPlayer(state, "p1");
      expect(p1After.characterArea[0].summoningSickness).toBe(true);
    }
  });
});

describe("giveDon", () => {
  it("moves DON from cost area to character attachment", () => {
    let state = pastMulligan(makeState());
    // End turn to get more DON, play a character, then give DON
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    state = applyOk(state, { type: "EndPhase", player: "p2" });
    // p1 turn 3: should have 1 + 2 = 3 DON

    const p1 = getPlayer(state, "p1");
    const oneCoster = p1.hand.find((c) => c.card.cost === 1);
    if (oneCoster) {
      const activeDon = p1.costArea.filter((d) => !d.rested);
      state = applyOk(state, {
        type: "PlayCharacter",
        player: "p1",
        cardInstanceId: oneCoster.instanceId,
        donToRest: [activeDon[0].instanceId],
      });

      const p1After = getPlayer(state, "p1");
      const remainingDon = p1After.costArea.filter((d) => !d.rested);
      if (remainingDon.length > 0) {
        state = applyOk(state, {
          type: "GiveDon",
          player: "p1",
          donInstanceId: remainingDon[0].instanceId,
          targetInstanceId: p1After.characterArea[0].instanceId,
        });

        const p1Final = getPlayer(state, "p1");
        expect(p1Final.characterArea[0].attachedDon).toBe(1);
        expect(p1Final.costArea.find((d) => d.instanceId === remainingDon[0].instanceId)).toBeUndefined();
      }
    }
  });

  it("given DON returns to cost area rested at next refresh", () => {
    let state = pastMulligan(makeState());
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    state = applyOk(state, { type: "EndPhase", player: "p2" });

    const p1 = getPlayer(state, "p1");
    // Give DON to leader
    const activeDon = p1.costArea.filter((d) => !d.rested);
    if (activeDon.length > 0) {
      const donCountBefore = p1.costArea.length;
      state = applyOk(state, {
        type: "GiveDon",
        player: "p1",
        donInstanceId: activeDon[0].instanceId,
        targetInstanceId: p1.leader.instanceId,
      });

      const p1AfterGive = getPlayer(state, "p1");
      expect(p1AfterGive.costArea).toHaveLength(donCountBefore - 1);
      expect(p1AfterGive.leader.attachedDon).toBe(1);

      // End turn, opponent turn, come back → refresh returns DON
      state = applyOk(state, { type: "EndPhase", player: "p1" });
      state = applyOk(state, { type: "EndPhase", player: "p2" });

      const p1AfterRefresh = getPlayer(state, "p1");
      expect(p1AfterRefresh.leader.attachedDon).toBe(0);
      // DON count should be restored (plus new DON from DON phase)
      expect(p1AfterRefresh.costArea.length).toBeGreaterThanOrEqual(donCountBefore);
    }
  });
});

describe("surrender", () => {
  it("sets opponent as winner", () => {
    let state = makeState();
    state = applyOk(state, { type: "Surrender", player: "p1" });
    expect(state.winner).toBe("p2");
  });

  it("rejects actions after game is over", () => {
    let state = makeState();
    state = applyOk(state, { type: "Surrender", player: "p1" });
    const result = applyAction(state, { type: "Surrender", player: "p2" });
    expect(result.ok).toBe(false);
  });
});

describe("mulligan", () => {
  it("reshuffles hand when not keeping", () => {
    const state = makeState();
    const handBefore = state.p1.hand.map((c) => c.instanceId);

    const result = applyOk(state, { type: "Mulligan", player: "p1", keep: false });
    const handAfter = result.p1.hand.map((c) => c.instanceId);

    // Hand should be different (reshuffled) — extremely unlikely to be same
    expect(handAfter).toHaveLength(5);
    // At least one card should be different (probabilistic but near-certain with 40+ card deck)
    const overlap = handAfter.filter((id) => handBefore.includes(id));
    expect(overlap.length).toBeLessThan(5);
  });

  it("keeps hand when keeping", () => {
    const state = makeState();
    const handBefore = state.p1.hand.map((c) => c.instanceId);

    const result = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
    const handAfter = result.p1.hand.map((c) => c.instanceId);

    expect(handAfter).toEqual(handBefore);
  });

  it("auto-advances to Main when both players are done", () => {
    let state = makeState();
    state = applyOk(state, { type: "Mulligan", player: "p1", keep: true });
    expect(state.phase).toBe("Mulligan");

    state = applyOk(state, { type: "Mulligan", player: "p2", keep: true });
    expect(state.phase).toBe("Main");
  });
});
