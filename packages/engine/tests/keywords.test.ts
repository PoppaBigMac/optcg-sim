import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/setup";
import { applyAction } from "../src/engine";
import { getPlayer, setPlayer } from "../src/state";
import { hasDoubleAttack, hasUnblockable } from "../src/keywords";
import { vanillaRedLeader, vanillaRedDeck } from "../../cards/src/decks/vanilla-red";
import { vanillaGreenLeader, vanillaGreenDeck } from "../../cards/src/decks/vanilla-green";
import type { GameState, CardInstance } from "../src/state";
import type { Action, Card } from "@optcg/shared-types";

const SEED = 77;

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

/** Advances to p1's Main phase turn 3 where p1 has hasTakenFirstTurn=true and 3 active DON. */
function readyForAttack(): GameState {
  let s = pastMulligan(makeBaseState());
  s = applyOk(s, { type: "EndPhase", player: "p1" }); // p1.hasTakenFirstTurn = true
  s = applyOk(s, { type: "EndPhase", player: "p2" }); // back to p1
  return s;
}

function makeCardInstance(
  overrides: Partial<Card>,
  instanceId: string,
  rested = false,
): CardInstance {
  const card: Card = {
    id: "test",
    name: "Test Card",
    cost: 3,
    power: 5000,
    counter: 0,
    colors: ["Red"],
    type: "Character",
    attributes: ["Strike"],
    traits: [],
    life: 0,
    effects: [],
    ...overrides,
  };
  return {
    instanceId,
    card,
    attachedDon: 0,
    rested,
    summoningSickness: false,
    modifiers: [],
  };
}

// ── hasDoubleAttack / hasUnblockable unit tests ──────────────────────────────

describe("hasDoubleAttack", () => {
  it("returns true when effect contains [Double Attack]", () => {
    expect(hasDoubleAttack(makeCardInstance({ effects: ["[Double Attack]"] }, "x"))).toBe(true);
  });

  it("returns false with no effects", () => {
    expect(hasDoubleAttack(makeCardInstance({ effects: [] }, "x"))).toBe(false);
  });

  it("returns false for unrelated keywords", () => {
    expect(hasDoubleAttack(makeCardInstance({ effects: ["[Blocker]", "[Rush]"] }, "x"))).toBe(false);
  });
});

describe("hasUnblockable", () => {
  it("returns true when effect contains [Unblockable]", () => {
    expect(hasUnblockable(makeCardInstance({ effects: ["[Unblockable]"] }, "x"))).toBe(true);
  });

  it("returns false with no effects", () => {
    expect(hasUnblockable(makeCardInstance({ effects: [] }, "x"))).toBe(false);
  });

  it("can have both Double Attack and Unblockable", () => {
    const ci = makeCardInstance({ effects: ["[Double Attack]", "[Unblockable]"] }, "x");
    expect(hasDoubleAttack(ci)).toBe(true);
    expect(hasUnblockable(ci)).toBe(true);
  });
});

// ── Normal combat flow ───────────────────────────────────────────────────────

describe("combat flow", () => {
  it("attack → no block → no counter → deals 1 life damage", () => {
    let state = readyForAttack();
    const attacker = makeCardInstance({ power: 6000 }, "atk");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [attacker],
    });

    const lifeBefore = getPlayer(state, "p2").life.length;

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "atk",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    expect(state.combat?.step).toBe("block");

    state = applyOk(state, { type: "PassBlock", player: "p2" });
    expect(state.combat?.step).toBe("counter");

    state = applyOk(state, { type: "PassCounter", player: "p2" });
    expect(state.combat).toBeNull();

    expect(getPlayer(state, "p2").life.length).toBe(lifeBefore - 1);
  });

  it("attacker rests after declaring attack", () => {
    let state = readyForAttack();
    const attacker = makeCardInstance({ power: 6000 }, "atk");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [attacker],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "atk",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });

    const atk = getPlayer(state, "p1").characterArea.find((c) => c.instanceId === "atk");
    expect(atk?.rested).toBe(true);
  });

  it("attack → declare blocker → blocker killed → no life damage", () => {
    let state = readyForAttack();
    const attacker = makeCardInstance({ power: 6000 }, "atk");
    const weakBlocker = makeCardInstance({ effects: ["[Blocker]"], power: 3000 }, "blk");

    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [attacker],
    });
    state = setPlayer(state, "p2", {
      ...getPlayer(state, "p2"),
      characterArea: [weakBlocker],
    });

    const lifeBefore = getPlayer(state, "p2").life.length;

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "atk",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, {
      type: "DeclareBlocker",
      player: "p2",
      blockerInstanceId: "blk",
    });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    const p2After = getPlayer(state, "p2");
    expect(p2After.characterArea.find((c) => c.instanceId === "blk")).toBeUndefined();
    expect(p2After.life.length).toBe(lifeBefore);
  });

  it("strong blocker survives if its power exceeds attacker", () => {
    let state = readyForAttack();
    const attacker = makeCardInstance({ power: 3000 }, "atk");
    const strongBlocker = makeCardInstance({ effects: ["[Blocker]"], power: 6000 }, "blk");

    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [attacker],
    });
    state = setPlayer(state, "p2", {
      ...getPlayer(state, "p2"),
      characterArea: [strongBlocker],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "atk",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, {
      type: "DeclareBlocker",
      player: "p2",
      blockerInstanceId: "blk",
    });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    const p2After = getPlayer(state, "p2");
    expect(p2After.characterArea.find((c) => c.instanceId === "blk")).toBeDefined();
  });

  it("rested character cannot be used as blocker", () => {
    let state = readyForAttack();
    const attacker = makeCardInstance({ power: 6000 }, "atk");
    const restedBlocker = makeCardInstance({ effects: ["[Blocker]"], power: 9000 }, "blk", true);

    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [attacker],
    });
    state = setPlayer(state, "p2", {
      ...getPlayer(state, "p2"),
      characterArea: [restedBlocker],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "atk",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });

    const result = applyAction(state, {
      type: "DeclareBlocker",
      player: "p2",
      blockerInstanceId: "blk",
    });
    expect(result.ok).toBe(false);
  });
});

// ── Double Attack ────────────────────────────────────────────────────────────

describe("Double Attack keyword", () => {
  it("deals 2 life damage when attacking the leader", () => {
    let state = readyForAttack();
    const da = makeCardInstance({ effects: ["[Double Attack]"], power: 6000 }, "da");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [da],
    });

    const lifeBefore = getPlayer(state, "p2").life.length;

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "da",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, { type: "PassBlock", player: "p2" });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    expect(getPlayer(state, "p2").life.length).toBe(lifeBefore - 2);
  });

  it("wins the game if 2 hits reduce life to 0", () => {
    let state = readyForAttack();
    const da = makeCardInstance({ effects: ["[Double Attack]"], power: 6000 }, "da");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [da],
    });
    // Set p2 to exactly 1 life
    const p2 = getPlayer(state, "p2");
    state = setPlayer(state, "p2", { ...p2, life: [p2.life[0]] });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "da",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, { type: "PassBlock", player: "p2" });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    expect(state.winner).toBe("p1");
  });

  it("deals only 1 damage when attacking a rested character (not leader)", () => {
    let state = readyForAttack();
    const da = makeCardInstance({ effects: ["[Double Attack]"], power: 6000 }, "da");
    const target = makeCardInstance({ power: 3000 }, "tgt", true);

    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [da],
    });
    state = setPlayer(state, "p2", {
      ...getPlayer(state, "p2"),
      characterArea: [target],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "da",
      targetInstanceId: "tgt",
    });
    state = applyOk(state, { type: "PassBlock", player: "p2" });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    // Character target was killed, but life is unchanged (Double Attack is leader-only)
    const p2After = getPlayer(state, "p2");
    expect(p2After.characterArea.find((c) => c.instanceId === "tgt")).toBeUndefined();
  });
});

// ── Unblockable ──────────────────────────────────────────────────────────────

describe("Unblockable keyword", () => {
  it("prevents blocker declaration", () => {
    let state = readyForAttack();
    const ub = makeCardInstance({ effects: ["[Unblockable]"], power: 4000 }, "ub");
    const blocker = makeCardInstance({ effects: ["[Blocker]"], power: 9000 }, "blk");

    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [ub],
    });
    state = setPlayer(state, "p2", {
      ...getPlayer(state, "p2"),
      characterArea: [blocker],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "ub",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });

    const result = applyAction(state, {
      type: "DeclareBlocker",
      player: "p2",
      blockerInstanceId: "blk",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/Unblockable/);
    }
  });

  it("allows PassBlock against Unblockable attacker", () => {
    let state = readyForAttack();
    const ub = makeCardInstance({ effects: ["[Unblockable]"], power: 4000 }, "ub");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [ub],
    });

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "ub",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });

    expect(() => applyOk(state, { type: "PassBlock", player: "p2" })).not.toThrow();
  });

  it("still deals damage after forced no-block", () => {
    let state = readyForAttack();
    const ub = makeCardInstance({ effects: ["[Unblockable]"], power: 6000 }, "ub");
    state = setPlayer(state, "p1", {
      ...getPlayer(state, "p1"),
      characterArea: [ub],
    });

    const lifeBefore = getPlayer(state, "p2").life.length;

    state = applyOk(state, {
      type: "DeclareAttack",
      player: "p1",
      attackerInstanceId: "ub",
      targetInstanceId: getPlayer(state, "p2").leader.instanceId,
    });
    state = applyOk(state, { type: "PassBlock", player: "p2" });
    state = applyOk(state, { type: "PassCounter", player: "p2" });

    expect(getPlayer(state, "p2").life.length).toBe(lifeBefore - 1);
  });
});
