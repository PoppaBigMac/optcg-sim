import type { Card, Phase, PlayerSlot, Action } from "@optcg/shared-types";

export interface CardInstance {
  readonly instanceId: string;
  readonly card: Card;
  readonly attachedDon: number;
  readonly rested: boolean;
  readonly summoningSickness: boolean;
  readonly modifiers: readonly Modifier[];
}

export interface Modifier {
  readonly source: string;
  readonly powerDelta: number;
  readonly expiresAtEndOfTurn: boolean;
}

export interface PlayerState {
  readonly leader: CardInstance;
  readonly deck: readonly CardInstance[];
  readonly hand: readonly CardInstance[];
  readonly life: readonly CardInstance[];
  readonly characterArea: readonly CardInstance[];
  readonly stageArea: readonly CardInstance[];
  readonly costArea: readonly CardInstance[];
  readonly donDeck: readonly CardInstance[];
  readonly trash: readonly CardInstance[];
  readonly givenDonThisTurn: number;
  readonly isFirstPlayer: boolean;
  readonly mulliganDone: boolean;
}

export interface GameState {
  readonly turnNumber: number;
  readonly activePlayer: PlayerSlot;
  readonly phase: Phase;
  readonly p1: PlayerState;
  readonly p2: PlayerState;
  readonly rngSeed: number;
  readonly rngState: number;
  readonly nextInstanceId: number;
  readonly actionLog: readonly Action[];
  readonly winner: PlayerSlot | null;
}

export function allocateInstanceId(state: GameState): { id: string; state: GameState } {
  const id = `ci_${state.nextInstanceId}`;
  return { id, state: { ...state, nextInstanceId: state.nextInstanceId + 1 } };
}

export function getPlayer(state: GameState, player: PlayerSlot): PlayerState {
  return player === "p1" ? state.p1 : state.p2;
}

export function setPlayer(state: GameState, player: PlayerSlot, ps: PlayerState): GameState {
  return player === "p1" ? { ...state, p1: ps } : { ...state, p2: ps };
}

export function opponent(player: PlayerSlot): PlayerSlot {
  return player === "p1" ? "p2" : "p1";
}
