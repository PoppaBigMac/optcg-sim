import type { Card, PlayerSlot } from "@optcg/shared-types";
import type { GameState, PlayerState, CardInstance } from "./state";
import { seededShuffle } from "./rng";

let instanceCounter = 0;

function makeInstance(card: Card): CardInstance {
  return {
    instanceId: `ci_${++instanceCounter}`,
    card,
    attachedDon: 0,
    rested: false,
    summoningSickness: false,
    modifiers: [],
  };
}

export function makeDonCard(): Card {
  return {
    id: "DON",
    name: "DON!!",
    cost: 0,
    power: 0,
    counter: 0,
    colors: [],
    type: "DON",
    attributes: [],
    traits: [],
    life: 0,
    effects: [],
  };
}

function buildPlayerState(
  leader: Card,
  deckCards: readonly Card[],
  rngState: number,
  isFirstPlayer: boolean,
): { player: PlayerState; rngState: number } {
  const leaderInstance = makeInstance(leader);

  const deckInstances = deckCards.map(makeInstance);
  const { result: shuffledDeck, rngState: rng1 } = seededShuffle(deckInstances, rngState);

  // Life setup: take top cards equal to leader's life value.
  // Per rules: the top of the deck becomes the bottom of the life pile.
  const lifeCount = leader.life;
  const lifeCards = shuffledDeck.splice(0, lifeCount);
  lifeCards.reverse();

  // Draw opening hand of 5
  const hand = shuffledDeck.splice(0, 5);

  // DON deck: 10 DON cards
  const donDeck = Array.from({ length: 10 }, () => makeInstance(makeDonCard()));

  const player: PlayerState = {
    leader: leaderInstance,
    deck: shuffledDeck,
    hand,
    life: lifeCards,
    characterArea: [],
    stageArea: [],
    costArea: [],
    donDeck,
    trash: [],
    givenDonThisTurn: 0,
    isFirstPlayer,
    mulliganDone: false,
  };

  return { player, rngState: rng1 };
}

export interface DeckInput {
  leader: Card;
  cards: readonly Card[];
}

export function createInitialState(
  p1Deck: DeckInput,
  p2Deck: DeckInput,
  seed: number,
  firstPlayer: PlayerSlot = "p1",
): GameState {
  instanceCounter = 0;

  const { player: p1, rngState: rng1 } = buildPlayerState(
    p1Deck.leader,
    p1Deck.cards,
    seed,
    firstPlayer === "p1",
  );
  const { player: p2, rngState: rng2 } = buildPlayerState(
    p2Deck.leader,
    p2Deck.cards,
    rng1,
    firstPlayer === "p2",
  );

  return {
    turnNumber: 1,
    activePlayer: firstPlayer,
    phase: "Mulligan",
    p1,
    p2,
    rngSeed: seed,
    rngState: rng2,
    nextInstanceId: instanceCounter + 1,
    actionLog: [],
    winner: null,
  };
}
