import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, TestClient, type TestServer } from "./harness.js";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

describe("lobby flow", () => {
  it("creates a lobby and returns a 6-char lobby code", async () => {
    const host = await TestClient.connect(server.wsUrl);
    host.send({ type: "CreateLobby", playerName: "Host" });
    const msg = await host.waitForType("LobbyCreated");
    expect(msg.lobbyId).toMatch(/^[A-F0-9]{6}$/);
    host.close();
  });

  it("guest joins lobby and both get LobbyJoined", async () => {
    const host = await TestClient.connect(server.wsUrl);
    host.send({ type: "CreateLobby", playerName: "Host" });
    const created = await host.waitForType("LobbyCreated");

    const guest = await TestClient.connect(server.wsUrl);
    guest.send({ type: "JoinLobby", lobbyId: created.lobbyId, playerName: "Guest" });

    const hostJoined = await host.waitForType("LobbyJoined");
    const guestJoined = await guest.waitForType("LobbyJoined");

    expect(hostJoined.opponentName).toBe("Guest");
    expect(guestJoined.opponentName).toBe("Host");

    host.close();
    guest.close();
  });

  it("joining a nonexistent lobby returns an error", async () => {
    const guest = await TestClient.connect(server.wsUrl);
    guest.send({ type: "JoinLobby", lobbyId: "ZZZZZZ", playerName: "Guest" });
    const msg = await guest.waitForType("Error");
    expect(msg.message).toContain("not found");
    guest.close();
  });

  it("both ready triggers MatchStarted with player slots", async () => {
    const host = await TestClient.connect(server.wsUrl);
    host.send({ type: "CreateLobby", playerName: "Host" });
    const created = await host.waitForType("LobbyCreated");

    const guest = await TestClient.connect(server.wsUrl);
    guest.send({ type: "JoinLobby", lobbyId: created.lobbyId, playerName: "Guest" });

    await host.waitForType("LobbyJoined");
    await guest.waitForType("LobbyJoined");

    host.send({ type: "Ready", deckId: "deck-1" });
    guest.send({ type: "Ready", deckId: "deck-2" });

    const hostMatch = await host.waitForType("MatchStarted");
    const guestMatch = await guest.waitForType("MatchStarted");

    expect(hostMatch.matchId).toBe(guestMatch.matchId);
    expect(hostMatch.yourSlot).toBe("p1");
    expect(guestMatch.yourSlot).toBe("p2");
    expect(hostMatch.state).toBeDefined();

    host.close();
    guest.close();
  });
});
