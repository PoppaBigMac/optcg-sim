import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, TestClient, type TestServer } from "./harness.js";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

describe("protocol validation", () => {
  it("rejects invalid JSON", async () => {
    const client = await TestClient.connect(server.wsUrl);
    client.sendRaw("not json{{{");
    const msg = await client.waitForMessage();
    expect(msg.type).toBe("Error");
    expect((msg as { message: string }).message).toContain("Invalid JSON");
    client.close();
  });

  it("rejects messages with missing type", async () => {
    const client = await TestClient.connect(server.wsUrl);
    client.sendRaw(JSON.stringify({ foo: "bar" }));
    const msg = await client.waitForMessage();
    expect(msg.type).toBe("Error");
    expect((msg as { message: string }).message).toContain("Invalid message");
    client.close();
  });

  it("rejects CreateLobby with empty playerName", async () => {
    const client = await TestClient.connect(server.wsUrl);
    client.sendRaw(JSON.stringify({ type: "CreateLobby", playerName: "" }));
    const msg = await client.waitForMessage();
    expect(msg.type).toBe("Error");
    client.close();
  });

  it("rejects JoinLobby with wrong lobbyId length", async () => {
    const client = await TestClient.connect(server.wsUrl);
    client.sendRaw(JSON.stringify({ type: "JoinLobby", lobbyId: "AB", playerName: "Test" }));
    const msg = await client.waitForMessage();
    expect(msg.type).toBe("Error");
    client.close();
  });

  it("rejects SubmitAction with unknown action type", async () => {
    const client = await TestClient.connect(server.wsUrl);
    client.sendRaw(JSON.stringify({ type: "SubmitAction", action: { type: "FLY_AWAY" } }));
    const msg = await client.waitForMessage();
    expect(msg.type).toBe("Error");
    client.close();
  });
});
