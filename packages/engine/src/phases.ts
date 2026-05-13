import type { GameState, PlayerState, CardInstance } from "./state";
import { getPlayer, setPlayer, allocateInstanceId } from "./state";
import { makeDonCard } from "./setup";

function setActive(ci: CardInstance): CardInstance {
  return ci.rested ? { ...ci, rested: false } : ci;
}

function clearSummoningSickness(ci: CardInstance): CardInstance {
  return ci.summoningSickness ? { ...ci, summoningSickness: false } : ci;
}

// Refresh phase: return all attached DON to cost area (rested),
// set all cards active, clear summoning sickness.
export function refreshPhase(state: GameState): GameState {
  const player = getPlayer(state, state.activePlayer);
  let s = state;
  const returnedDon: CardInstance[] = [];

  // Return DON attached to leader
  let leader = player.leader;
  for (let i = 0; i < leader.attachedDon; i++) {
    const { id, state: s2 } = allocateInstanceId(s);
    s = s2;
    returnedDon.push({
      instanceId: id,
      card: makeDonCard(),
      attachedDon: 0,
      rested: true,
      summoningSickness: false,
      modifiers: [],
    });
  }
  leader = leader.attachedDon > 0 ? { ...leader, attachedDon: 0 } : leader;

  // Return DON attached to characters
  const characters = player.characterArea.map((ch) => {
    for (let i = 0; i < ch.attachedDon; i++) {
      const { id, state: s2 } = allocateInstanceId(s);
      s = s2;
      returnedDon.push({
        instanceId: id,
        card: makeDonCard(),
        attachedDon: 0,
        rested: true,
        summoningSickness: false,
        modifiers: [],
      });
    }
    return ch.attachedDon > 0 ? { ...ch, attachedDon: 0 } : ch;
  });

  const updatedPlayer: PlayerState = {
    ...player,
    leader: clearSummoningSickness(setActive(leader)),
    characterArea: characters.map((c) => clearSummoningSickness(setActive(c))),
    stageArea: player.stageArea.map(setActive),
    costArea: [...player.costArea.map(setActive), ...returnedDon],
    givenDonThisTurn: 0,
  };

  return { ...setPlayer(s, state.activePlayer, updatedPlayer), phase: "Draw" };
}

// Draw phase: draw 1 card. Skip on turn 1 for first player.
export function drawPhase(state: GameState): GameState {
  const player = getPlayer(state, state.activePlayer);

  if (state.turnNumber === 1 && player.isFirstPlayer) {
    return { ...state, phase: "Don" };
  }

  if (player.deck.length === 0) {
    const winner = state.activePlayer === "p1" ? "p2" : "p1";
    return { ...state, winner };
  }

  const [drawn, ...rest] = player.deck;
  const updatedPlayer: PlayerState = {
    ...player,
    hand: [...player.hand, drawn],
    deck: rest,
  };

  return { ...setPlayer(state, state.activePlayer, updatedPlayer), phase: "Don" };
}

// DON phase: move DON from donDeck to costArea (active).
// Turn 1 first player: 1 DON. Otherwise: 2 DON. Cap at 10.
export function donPhase(state: GameState): GameState {
  const player = getPlayer(state, state.activePlayer);

  let donToAdd = 2;
  if (state.turnNumber === 1 && player.isFirstPlayer) {
    donToAdd = 1;
  }

  const currentDonCount = player.costArea.length;
  const maxCanAdd = Math.max(0, 10 - currentDonCount);
  donToAdd = Math.min(donToAdd, maxCanAdd, player.donDeck.length);

  const newDon = player.donDeck.slice(0, donToAdd).map((d) => ({ ...d, rested: false }));
  const remainingDonDeck = player.donDeck.slice(donToAdd);

  const updatedPlayer: PlayerState = {
    ...player,
    costArea: [...player.costArea, ...newDon],
    donDeck: remainingDonDeck,
  };

  return { ...setPlayer(state, state.activePlayer, updatedPlayer), phase: "Main" };
}

// End phase: clear end-of-turn modifiers, switch active player, increment turn.
export function endPhaseFn(state: GameState): GameState {
  const player = getPlayer(state, state.activePlayer);

  const clearModifiers = (ci: CardInstance): CardInstance => {
    const remaining = ci.modifiers.filter((m) => !m.expiresAtEndOfTurn);
    return remaining.length !== ci.modifiers.length ? { ...ci, modifiers: remaining } : ci;
  };

  const updatedPlayer: PlayerState = {
    ...player,
    leader: clearModifiers(player.leader),
    characterArea: player.characterArea.map(clearModifiers),
  };

  const nextPlayer = state.activePlayer === "p1" ? "p2" : "p1";
  return {
    ...setPlayer(state, state.activePlayer, updatedPlayer),
    activePlayer: nextPlayer,
    turnNumber: state.turnNumber + 1,
    phase: "Refresh",
  };
}
