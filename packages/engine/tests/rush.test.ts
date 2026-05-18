import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/setup";
import { applyAction } from "../src/engine";
import { getPlayer, setPlayer } from "../src/state";
import { hasRush } from "../src/keywords";
import { vanillaRedLeader, vanillaRedDeck } from "../../cards/src/decks/vanilla-red";
import { vanillaGreenLeader, vanillaGreenDeck } from "../../cards/src/decks/vanilla-green";
import type { GameState, CardInstance } from "../src/state";
import type { Action, Card } from "@optcg/shared-types";

const SEED = 55;

function applyOk(state: GameState, action: Action): GameState {
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`Action failed: ${result.reason}`);
  return result.state;
}

function makeBaseState() {
  return createInitialState(
    { leader: vanillaRedLeader, cards: vanillaRedDeck },
    { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
    SEED,
    "p1",
  );
}

function pastMulligan(s: GameState): GameState {
  s = applyOk(s, { type: "Mulligan", player: "p1", keep: true });
  s = applyOk(s, { type: "Mulligan", player: "p2", keep: true });
  return s;
}

function makeCardInstance(overrides: Partial<Card>, instanceId: string): CardInstance {
  const card: Card = {
    id: "test", name: "Test", cost: 2, power: 4000, counter: 0,
    colors: ["Red"], type: "Character", attributes: ["Strike"],
    traits: [], life: 0, effects: [],
    ...overrides,
  };
  return { instanceId, card, attachedDon: 0, rested: false, summoningSickness: true, modifiers: [] };
}

describe("hasRush", () => {
  it("returns true for a card with [Rush] effect", () => {
    const ci = makeCardInstance({ effects: ["[Rush]"] }, "x");
    expect(hasRush(ci)).toBe(true);
  });

  it("returns false for a card with no effects", () => {
    const ci = makeCardInstance({ effects: [] }, "x");
    expect(hasRush(ci)).toBe(false);
  });

  it("returns false for a card with other keywords", () => {
    const ci = makeCardInstance({ effects: ["[Double Attack]", "[Blocker]"] }, "x");
    expect(hasRush(ci)).toBe(false);
  });
});

describe("Rush keyword — combat", () => {
  it("allows attack on turn played (summoningSickness=true ignored for Rush cards)", () => {
    let state = pastMulligan(makeBaseState());
    // p1 already has hasTakenFirstTurn=false — need to end turn first
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    state = applyOk(state, { type: "EndPhase", player: "p2" });

    const rushCard = makeCardInstance({ effects: ["[Rush]"], power: 5000 }, "rush");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [rushCard], // still has summoningSickness: true
    });

    // Should NOT be rejected despite summoningSickness
    const result = applyAction(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "rush",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    expect(result.ok).toBe(true);
  });

  it("non-Rush card with summoningSickness is still rejected", () => {
    let state = pastMulligan(makeBaseState());
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    state = applyOk(state, { type: "EndPhase", player: "p2" });

    const vanilla = makeCardInstance({ effects: [], power: 5000 }, "vanilla");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [vanilla],
    });

    const result = applyAction(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "vanilla",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/summoning sickness/);
  });

  it("Rush card deals normal damage when it attacks", () => {
    let state = pastMulligan(makeBaseState());
    state = applyOk(state, { type: "EndPhase", player: "p1" });
    state = applyOk(state, { type: "EndPhase", player: "p2" });

    const rushCard = makeCardInstance({ effects: ["[Rush]"], power: 6000 }, "rush");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [rushCard],
    });

    const lifeBefore = getPlayer(state, "p2").life.length;
    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "rush",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, { type: "PassBlock", player: "p2" });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    expect(getPlayer(state, "p2").life.length).toBe(lifeBefore - 1);
  });
});
