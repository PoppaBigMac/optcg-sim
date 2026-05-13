import { randomUUID } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import type { Action, PlayerSlot } from "@optcg/shared-types";
import type { GameState } from "@optcg/engine";
import { createInitialState, applyAction } from "@optcg/engine";
import { vanillaRedLeader, vanillaRedDeck } from "@optcg/cards";
import type { Connection } from "./connection.js";

export interface Match {
  id: string;
  state: GameState;
  p1: Connection;
  p2: Connection;
  seed: number;
}

export class MatchManager {
  private matches = new Map<string, Match>();
  private connectionToMatch = new Map<string, string>();

  constructor(private readonly log: FastifyBaseLogger) {}

  createMatch(
    p1Conn: Connection,
    p2Conn: Connection,
    _hostDeckId: string,
    _guestDeckId: string,
  ): Match {
    const id = randomUUID();
    const seed = Date.now();

    // Phase 0: use vanilla red stub decks — real deck loading comes with Supabase
    const state = createInitialState(
      { leader: vanillaRedLeader, cards: vanillaRedDeck },
      { leader: vanillaRedLeader, cards: vanillaRedDeck },
      seed,
    );

    p1Conn.slot = "p1";
    p2Conn.slot = "p2";

    const match: Match = { id, state, p1: p1Conn, p2: p2Conn, seed };
    this.matches.set(id, match);
    this.connectionToMatch.set(p1Conn.id, id);
    this.connectionToMatch.set(p2Conn.id, id);

    this.log.info(
      { matchId: id, p1: p1Conn.playerId, p2: p2Conn.playerId },
      "Match created",
    );

    p1Conn.onClose(() => this.handleDisconnect(p1Conn));
    p2Conn.onClose(() => this.handleDisconnect(p2Conn));

    return match;
  }

  submitAction(conn: Connection, action: Action): void {
    const matchId = this.connectionToMatch.get(conn.id);
    if (!matchId) {
      conn.send({ type: "Error", message: "Not in a match" });
      return;
    }

    const match = this.matches.get(matchId)!;

    if (action.player !== conn.slot) {
      conn.send({ type: "ActionRejected", reason: "Action player slot does not match your slot" });
      return;
    }

    const result = applyAction(match.state, action);

    if (!result.ok) {
      this.log.info(
        { matchId, player: conn.slot, reason: result.reason },
        "Action rejected",
      );
      conn.send({ type: "ActionRejected", reason: result.reason });
      return;
    }

    match.state = result.state;
    this.log.info(
      { matchId, player: conn.slot, action: action.type },
      "Action applied",
    );

    const update = {
      type: "StateUpdate" as const,
      state: result.state as unknown as Record<string, unknown>,
    };
    match.p1.send(update);
    match.p2.send(update);

    if (result.state.winner) {
      this.log.info({ matchId, winner: result.state.winner }, "Match ended");
      const ended = {
        type: "MatchEnded" as const,
        winner: result.state.winner,
        state: result.state as unknown as Record<string, unknown>,
      };
      match.p1.send(ended);
      match.p2.send(ended);
      this.removeMatch(matchId);
    }
  }

  private handleDisconnect(conn: Connection): void {
    const matchId = this.connectionToMatch.get(conn.id);
    if (!matchId) return;

    const match = this.matches.get(matchId);
    if (!match) return;

    const other = conn.id === match.p1.id ? match.p2 : match.p1;
    if (other.isAlive) {
      other.send({ type: "Error", message: "Opponent disconnected" });
    }

    this.removeMatch(matchId);
  }

  private removeMatch(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match) return;

    this.connectionToMatch.delete(match.p1.id);
    this.connectionToMatch.delete(match.p2.id);
    this.matches.delete(matchId);
  }

  getMatchForConnection(connId: string): Match | undefined {
    const matchId = this.connectionToMatch.get(connId);
    return matchId ? this.matches.get(matchId) : undefined;
  }
}
