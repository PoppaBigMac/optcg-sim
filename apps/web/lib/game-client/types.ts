import type { Action, PlayerSlot } from "@optcg/shared-types";
import type { GameState } from "@optcg/engine";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export type ClientMessage =
  | { type: "CreateLobby"; playerName: string }
  | { type: "JoinLobby"; lobbyId: string; playerName: string }
  | { type: "Ready"; deckId: string }
  | { type: "SubmitAction"; action: Action }
  | { type: "Leave" };

export type ServerMessage =
  | { type: "LobbyCreated"; lobbyId: string }
  | { type: "LobbyJoined"; lobbyId: string; opponentName: string }
  | { type: "MatchStarted"; matchId: string; yourSlot: PlayerSlot; state: GameState }
  | { type: "StateUpdate"; state: GameState }
  | { type: "ActionRejected"; reason: string }
  | { type: "MatchEnded"; winner: string; state: GameState }
  | { type: "Error"; message: string };

export type ServerMessageHandler = (msg: ServerMessage) => void;

export interface LobbyInfo {
  lobbyId: string;
  opponentName: string | null;
  isHost: boolean;
  isReady: boolean;
}

export interface MatchInfo {
  matchId: string;
  mySlot: PlayerSlot;
  state: GameState;
  actionLog: Action[];
  winner: PlayerSlot | null;
}
