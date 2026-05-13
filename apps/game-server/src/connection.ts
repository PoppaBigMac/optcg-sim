import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import type { FastifyBaseLogger } from "fastify";
import type { PlayerSlot } from "@optcg/shared-types";
import type { ServerMessage } from "./protocol.js";

export interface ConnectionInfo {
  playerId: string;
  playerName: string;
}

export class Connection {
  readonly id: string;
  readonly socket: WebSocket;
  info: ConnectionInfo | null = null;
  slot: PlayerSlot | null = null;

  private readonly log: FastifyBaseLogger;
  private onCloseCallbacks: Array<() => void> = [];

  constructor(socket: WebSocket, log: FastifyBaseLogger) {
    this.id = randomUUID();
    this.socket = socket;
    this.log = log.child({ connectionId: this.id });

    socket.on("close", () => {
      this.log.info("Connection closed");
      for (const cb of this.onCloseCallbacks) cb();
    });

    socket.on("error", (err) => {
      this.log.error({ err }, "Socket error");
    });
  }

  get playerId(): string | null {
    return this.info?.playerId ?? null;
  }

  get playerName(): string | null {
    return this.info?.playerName ?? null;
  }

  get isAlive(): boolean {
    return this.socket.readyState === this.socket.OPEN;
  }

  send(message: ServerMessage): void {
    if (!this.isAlive) return;
    this.socket.send(JSON.stringify(message));
  }

  onClose(callback: () => void): void {
    this.onCloseCallbacks.push(callback);
  }
}
