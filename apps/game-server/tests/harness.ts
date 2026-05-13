import Fastify, { type FastifyInstance } from "fastify";
import WebSocket from "ws";
import { createWsServer } from "../src/ws-server.js";
import type { ServerMessage, ClientMessage } from "../src/protocol.js";

export interface TestServer {
  url: string;
  wsUrl: string;
  fastify: FastifyInstance;
  close: () => Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  const fastify = Fastify({ logger: false });
  fastify.get("/health", async () => ({ status: "ok" }));

  const { wss } = createWsServer({ log: fastify.log });

  fastify.server.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  await fastify.listen({ port: 0, host: "127.0.0.1" });
  const address = fastify.server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    wsUrl: `ws://127.0.0.1:${port}/ws`,
    fastify,
    close: async () => {
      wss.close();
      await fastify.close();
    },
  };
}

export class TestClient {
  private ws: WebSocket;
  private messages: ServerMessage[] = [];
  private waitResolvers: Array<(msg: ServerMessage) => void> = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString()) as ServerMessage;
      const resolver = this.waitResolvers.shift();
      if (resolver) {
        resolver(msg);
      } else {
        this.messages.push(msg);
      }
    });
  }

  static async connect(wsUrl: string): Promise<TestClient> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.on("open", () => resolve(new TestClient(ws)));
      ws.on("error", reject);
    });
  }

  send(msg: ClientMessage): void {
    this.ws.send(JSON.stringify(msg));
  }

  sendRaw(data: string): void {
    this.ws.send(data);
  }

  async waitForMessage(timeoutMs = 5000): Promise<ServerMessage> {
    const queued = this.messages.shift();
    if (queued) return queued;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Timed out waiting for message")),
        timeoutMs,
      );
      this.waitResolvers.push((msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  async waitForType<T extends ServerMessage["type"]>(
    type: T,
    timeoutMs = 5000,
  ): Promise<Extract<ServerMessage, { type: T }>> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const msg = await this.waitForMessage(deadline - Date.now());
      if (msg.type === type) return msg as Extract<ServerMessage, { type: T }>;
    }
    throw new Error(`Timed out waiting for message type: ${type}`);
  }

  close(): void {
    this.ws.close();
  }
}
