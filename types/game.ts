export type PlayerSlot = "p1" | "p2";

export type CardZone =
  | "deck"
  | "hand"
  | "stage"
  | "character"
  | "don"
  | "trash"
  | "life";

export interface CardInstance {
  instanceId: string;   // unique per game, e.g. uuid
  cardId: string;       // OPTCG card number e.g. "OP01-001"
  isTapped: boolean;
  attachedDon: number;
}

export interface PlayerState {
  slot: PlayerSlot;
  userId: string;
  displayName: string;
  life: CardInstance[];
  hand: CardInstance[];
  deck: CardInstance[];      // top = index 0
  donDeck: CardInstance[];
  activeDon: CardInstance[];
  stage: CardInstance | null;
  characters: CardInstance[]; // up to 5
  trash: CardInstance[];
  donAvailable: number;      // DON!! remaining this turn
}

export type GamePhase =
  | "waiting"    // lobby, waiting for second player
  | "refresh"
  | "draw"
  | "don"
  | "main"
  | "end";

export interface GameState {
  gameId: string;
  phase: GamePhase;
  turnNumber: number;
  activePlayer: PlayerSlot;
  players: Record<PlayerSlot, PlayerState>;
  winner: PlayerSlot | null;
  createdAt: string;
}

// Events sent over Supabase Realtime channel
export type GameEvent =
  | { type: "PLAYER_JOINED"; slot: PlayerSlot; userId: string; displayName: string }
  | { type: "GAME_START"; state: GameState }
  | { type: "STATE_UPDATE"; state: GameState }
  | { type: "PHASE_ADVANCE"; phase: GamePhase }
  | { type: "CHAT"; slot: PlayerSlot; text: string };
