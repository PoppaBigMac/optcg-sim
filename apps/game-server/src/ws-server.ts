import { WebSocketServer, type WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { FastifyBaseLogger } from "fastify";
import { Connection } from "./connection.js";
import { ClientMessageSchema } from "./protocol.js";
import { authenticatePlayer } from "./auth.js";
import { LobbyManager } from "./lobby-manager.js";
import { MatchManager } from "./match-manager.js";

export interface WsServerOptions {
  log: FastifyBaseLogger;
}

export function createWsServer({ log }: WsServerOptions) {
  const wss = new WebSocketServer({ noServer: true });
  const matchManager = new MatchManager(log);
  const lobbyManager = new LobbyManager(matchManager, log);

  wss.on("connection", (socket: WebSocket, _req: IncomingMessage) => {
    const conn = new Connection(socket, log);
    log.info({ connectionId: conn.id }, "New WebSocket connection");

    socket.on("message", (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        conn.send({ type: "Error", message: "Invalid JSON" });
        return;
      }

      const result = ClientMessageSchema.safeParse(parsed);
      if (!result.success) {
        conn.send({
          type: "Error",
          message: `Invalid message: ${result.error.issues.map((i) => i.message).join(", ")}`,
        });
        return;
      }

      handleMessage(conn, result.data, lobbyManager, matchManager, log);
    });
  });

  return { wss, matchManager, lobbyManager };
}

function handleMessage(
  conn: Connection,
  msg: ReturnType<typeof ClientMessageSchema.parse>,
  lobbyManager: LobbyManager,
  matchManager: MatchManager,
  log: FastifyBaseLogger,
): void {
  switch (msg.type) {
    case "CreateLobby": {
      const auth = authenticatePlayer(msg.playerName);
      conn.info = auth;
      const lobby = lobbyManager.createLobby(conn);
      conn.send({ type: "LobbyCreated", lobbyId: lobby.id });
      break;
    }

    case "JoinLobby": {
      const auth = authenticatePlayer(msg.playerName);
      conn.info = auth;
      const lobby = lobbyManager.joinLobby(msg.lobbyId, conn);
      if (!lobby) {
        conn.send({ type: "Error", message: "Lobby not found or full" });
      }
      break;
    }

    case "Ready": {
      lobbyManager.setReady(conn, msg.deckId);
      break;
    }

    case "SubmitAction": {
      matchManager.submitAction(conn, msg.action);
      break;
    }

    case "Leave": {
      log.info({ connectionId: conn.id }, "Client requested leave");
      conn.socket.close();
      break;
    }
  }
}
