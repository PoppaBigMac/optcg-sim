"use client";

import { create } from "zustand";
import type { Action, PlayerSlot } from "@optcg/shared-types";
import type { GameState } from "@optcg/engine";
import { GameClient } from "./client";
import type { ConnectionStatus, LobbyInfo, ServerMessage } from "./types";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "ws://localhost:4000/ws")
    : "";

interface GameStore {
  status: ConnectionStatus;
  lobby: LobbyInfo | null;
  match: {
    matchId: string;
    mySlot: PlayerSlot;
    state: GameState;
    actionLog: Action[];
    winner: PlayerSlot | null;
  } | null;
  lastRejection: string | null;
  lastError: string | null;
  client: GameClient;

  connect: (playerName: string, mode: "create" | "join", lobbyId?: string) => void;
  ready: (deckId: string) => void;
  submitAction: (action: Action) => void;
  disconnect: () => void;
  clearRejection: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: "disconnected",
  lobby: null,
  match: null,
  lastRejection: null,
  lastError: null,
  client: new GameClient(),

  connect: (playerName, mode, lobbyId) => {
    const { client } = get();
    client.disconnect();

    set({ status: "connecting", lobby: null, match: null, lastRejection: null, lastError: null });

    client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "LobbyCreated":
          set({
            lobby: {
              lobbyId: msg.lobbyId,
              opponentName: null,
              isHost: true,
              isReady: false,
            },
          });
          break;

        case "LobbyJoined":
          set((s) => ({
            lobby: s.lobby
              ? { ...s.lobby, opponentName: msg.opponentName }
              : {
                  lobbyId: msg.lobbyId,
                  opponentName: msg.opponentName,
                  isHost: false,
                  isReady: false,
                },
          }));
          break;

        case "MatchStarted":
          set({
            lobby: null,
            match: {
              matchId: msg.matchId,
              mySlot: msg.yourSlot,
              state: msg.state as unknown as GameState,
              actionLog: [],
              winner: null,
            },
          });
          break;

        case "StateUpdate":
          set((s) => {
            if (!s.match) return s;
            const newState = msg.state as unknown as GameState;
            return {
              match: {
                ...s.match,
                state: newState,
                actionLog: newState.actionLog as Action[],
              },
            };
          });
          break;

        case "ActionRejected":
          set({ lastRejection: msg.reason });
          break;

        case "MatchEnded":
          set((s) => {
            if (!s.match) return s;
            const finalState = msg.state as unknown as GameState;
            return {
              match: {
                ...s.match,
                state: finalState,
                actionLog: finalState.actionLog as Action[],
                winner: msg.winner as PlayerSlot,
              },
            };
          });
          break;

        case "Error":
          set({ lastError: msg.message });
          break;
      }
    });

    client.connect(
      WS_URL,
      () => {
        set({ status: "connected" });
        if (mode === "create") {
          client.createLobby(playerName);
        } else if (lobbyId) {
          client.joinLobby(lobbyId, playerName);
        }
      },
      () => {
        set({ status: "disconnected" });
      },
    );
  },

  ready: (deckId) => {
    const { client } = get();
    client.ready(deckId);
    set((s) => (s.lobby ? { lobby: { ...s.lobby, isReady: true } } : {}));
  },

  submitAction: (action) => {
    const { client } = get();
    client.submitAction(action);
  },

  disconnect: () => {
    const { client } = get();
    client.disconnect();
    set({ status: "disconnected", lobby: null, match: null });
  },

  clearRejection: () => set({ lastRejection: null }),

  reset: () => {
    const { client } = get();
    client.disconnect();
    set({
      status: "disconnected",
      lobby: null,
      match: null,
      lastRejection: null,
      lastError: null,
      client: new GameClient(),
    });
  },
}));
