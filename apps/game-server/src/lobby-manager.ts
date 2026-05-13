import { randomBytes } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import type { Connection } from "./connection.js";
import { MatchManager } from "./match-manager.js";

export interface Lobby {
  id: string;
  host: Connection;
  guest: Connection | null;
  hostDeckId: string | null;
  guestDeckId: string | null;
  hostReady: boolean;
  guestReady: boolean;
}

function generateLobbyId(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export class LobbyManager {
  private lobbies = new Map<string, Lobby>();
  private connectionToLobby = new Map<string, string>();

  constructor(
    private readonly matchManager: MatchManager,
    private readonly log: FastifyBaseLogger,
  ) {}

  createLobby(host: Connection): Lobby {
    let id = generateLobbyId();
    while (this.lobbies.has(id)) id = generateLobbyId();

    const lobby: Lobby = {
      id,
      host,
      guest: null,
      hostDeckId: null,
      guestDeckId: null,
      hostReady: false,
      guestReady: false,
    };

    this.lobbies.set(id, lobby);
    this.connectionToLobby.set(host.id, id);
    this.log.info({ lobbyId: id, hostId: host.playerId }, "Lobby created");

    host.onClose(() => this.handleDisconnect(host));

    return lobby;
  }

  joinLobby(lobbyId: string, guest: Connection): Lobby | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby || lobby.guest) return null;

    lobby.guest = guest;
    this.connectionToLobby.set(guest.id, lobbyId);
    this.log.info({ lobbyId, guestId: guest.playerId }, "Guest joined lobby");

    guest.onClose(() => this.handleDisconnect(guest));

    lobby.host.send({
      type: "LobbyJoined",
      lobbyId,
      opponentName: guest.playerName!,
    });
    guest.send({
      type: "LobbyJoined",
      lobbyId,
      opponentName: lobby.host.playerName!,
    });

    return lobby;
  }

  setReady(conn: Connection, deckId: string): void {
    const lobbyId = this.connectionToLobby.get(conn.id);
    if (!lobbyId) {
      conn.send({ type: "Error", message: "Not in a lobby" });
      return;
    }

    const lobby = this.lobbies.get(lobbyId)!;

    if (conn.id === lobby.host.id) {
      lobby.hostReady = true;
      lobby.hostDeckId = deckId;
    } else if (lobby.guest && conn.id === lobby.guest.id) {
      lobby.guestReady = true;
      lobby.guestDeckId = deckId;
    } else {
      conn.send({ type: "Error", message: "Not in this lobby" });
      return;
    }

    this.log.info({ lobbyId, playerId: conn.playerId }, "Player ready");

    if (lobby.hostReady && lobby.guestReady && lobby.guest) {
      this.startMatch(lobby);
    }
  }

  private startMatch(lobby: Lobby): void {
    this.log.info({ lobbyId: lobby.id }, "Both players ready, starting match");

    const match = this.matchManager.createMatch(
      lobby.host,
      lobby.guest!,
      lobby.hostDeckId!,
      lobby.guestDeckId!,
    );

    lobby.host.send({
      type: "MatchStarted",
      matchId: match.id,
      yourSlot: "p1",
      state: match.state as unknown as Record<string, unknown>,
    });
    lobby.guest!.send({
      type: "MatchStarted",
      matchId: match.id,
      yourSlot: "p2",
      state: match.state as unknown as Record<string, unknown>,
    });

    this.connectionToLobby.delete(lobby.host.id);
    this.connectionToLobby.delete(lobby.guest!.id);
    this.lobbies.delete(lobby.id);
  }

  removeLobby(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    this.connectionToLobby.delete(lobby.host.id);
    if (lobby.guest) this.connectionToLobby.delete(lobby.guest.id);
    this.lobbies.delete(lobbyId);
    this.log.info({ lobbyId }, "Lobby removed");
  }

  private handleDisconnect(conn: Connection): void {
    const lobbyId = this.connectionToLobby.get(conn.id);
    if (!lobbyId) return;

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const other = conn.id === lobby.host.id ? lobby.guest : lobby.host;
    if (other?.isAlive) {
      other.send({ type: "Error", message: "Opponent disconnected from lobby" });
    }

    this.removeLobby(lobbyId);
  }

  getLobbyForConnection(connId: string): Lobby | undefined {
    const lobbyId = this.connectionToLobby.get(connId);
    return lobbyId ? this.lobbies.get(lobbyId) : undefined;
  }
}
