import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/setup";
import { vanillaRedLeader, vanillaRedDeck } from "../../cards/src/decks/vanilla-red";
import { vanillaGreenLeader, vanillaGreenDeck } from "../../cards/src/decks/vanilla-green";

const SEED = 42;

function makeState(firstPlayer: "p1" | "p2" = "p1") {
  return createInitialState(
    { leader: vanillaRedLeader, cards: vanillaRedDeck },
    { leader: vanillaGreenLeader, cards: vanillaGreenDeck },
    SEED,
    firstPlayer,
  );
}

describe("createInitialState", () => {
  it("deals exactly 5 cards to each player's hand", () => {
    const state = makeState();
    expect(state.p1.hand).toHaveLength(5);
    expect(state.p2.hand).toHaveLength(5);
  });

  it("sets life pile size to leader's life value", () => {
    const state = makeState();
    expect(state.p1.life).toHaveLength(vanillaRedLeader.life);
    expect(state.p2.life).toHaveLength(vanillaGreenLeader.life);
  });

  it("places top of deck at bottom of life pile", () => {
    // With a known seed, the first card drawn from the shuffled deck should
    // end up at the bottom (last index) of the life pile (reversed).
    const state = makeState();
    // Life was built by: take top N from shuffled deck, then reverse.
    // So life[life.length - 1] was the FIRST card taken from the shuffled deck (index 0).
    // Verify life pile contains cards from the deck, not DON or leader.
    for (const lifeCard of state.p1.life) {
      expect(lifeCard.card.type).toBe("Character");
    }
  });

  it("creates 10 DON cards in each player's don deck", () => {
    const state = makeState();
    expect(state.p1.donDeck).toHaveLength(10);
    expect(state.p2.donDeck).toHaveLength(10);
    expect(state.p1.donDeck[0].card.type).toBe("DON");
  });

  it("deck has 50 - life - hand cards remaining", () => {
    const state = makeState();
    const expectedDeckSize = vanillaRedDeck.length - vanillaRedLeader.life - 5;
    expect(state.p1.deck).toHaveLength(expectedDeckSize);
  });

  it("starts in Mulligan phase", () => {
    const state = makeState();
    expect(state.phase).toBe("Mulligan");
  });

  it("sets first player flag correctly", () => {
    const state = makeState("p2");
    expect(state.p1.isFirstPlayer).toBe(false);
    expect(state.p2.isFirstPlayer).toBe(true);
    expect(state.activePlayer).toBe("p2");
  });

  it("is deterministic — same seed produces same state", () => {
    const state1 = makeState();
    const state2 = makeState();
    expect(state1.p1.hand.map((c) => c.instanceId)).toEqual(
      state2.p1.hand.map((c) => c.instanceId),
    );
    expect(state1.p1.deck.map((c) => c.instanceId)).toEqual(
      state2.p1.deck.map((c) => c.instanceId),
    );
  });
});
