import Fastify from "fastify";
import { createWsServer } from "./ws-server.js";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const fastify = Fastify({ logger: true });

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

async function start() {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Game server listening on ${HOST}:${PORT}`);
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});

export { fastify };
