import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, TestClient, type TestServer } from "./harness.js";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

async function setupMatch(wsUrl: string) {
  const host = await TestClient.connect(wsUrl);
  host.send({ type: "CreateLobby", playerName: "P1" });
  const created = await host.waitForType("LobbyCreated");

  const guest = await TestClient.connect(wsUrl);
  guest.send({ type: "JoinLobby", lobbyId: created.lobbyId, playerName: "P2" });

  await host.waitForType("LobbyJoined");
  await guest.waitForType("LobbyJoined");

  host.send({ type: "Ready", deckId: "deck-1" });
  guest.send({ type: "Ready", deckId: "deck-2" });

  const hostMatch = await host.waitForType("MatchStarted");
  await guest.waitForType("MatchStarted");

  return { host, guest, matchId: hostMatch.matchId, state: hostMatch.state };
}

async function mulliganBoth(host: TestClient, guest: TestClient) {
  host.send({
    type: "SubmitAction",
    action: { type: "Mulligan", player: "p1", keep: true },
  });
  const p1Update = await host.waitForType("StateUpdate");
  await guest.waitForType("StateUpdate");

  guest.send({
    type: "SubmitAction",
    action: { type: "Mulligan", player: "p2", keep: true },
  });
  await host.waitForType("StateUpdate");
  const p2Update = await guest.waitForType("StateUpdate");

  return p2Update.state;
}

describe("match actions", () => {
  it("mulligan then EndPhase broadcasts StateUpdate to both players", async () => {
    const { host, guest } = await setupMatch(server.wsUrl);
    await mulliganBoth(host, guest);

    // After mulligan, game transitions through phases. p1 is active.
    // EndPhase should advance the phase.
    host.send({
      type: "SubmitAction",
      action: { type: "EndPhase", player: "p1" },
    });

    const hostUpdate = await host.waitForType("StateUpdate");
    const guestUpdate = await guest.waitForType("StateUpdate");

    expect(hostUpdate.state).toBeDefined();
    expect(guestUpdate.state).toBeDefined();

    host.close();
    guest.close();
  });

  it("invalid action rejects only the submitter", async () => {
    const { host, guest } = await setupMatch(server.wsUrl);
    await mulliganBoth(host, guest);

    // p2 tries to act during p1's turn — should be rejected
    guest.send({
      type: "SubmitAction",
      action: { type: "EndPhase", player: "p1" },
    });

    const rejection = await guest.waitForType("ActionRejected");
    expect(rejection.reason).toBeTruthy();

    // Host should not have received anything for that rejection.
    // Verify by sending a valid action from host.
    host.send({
      type: "SubmitAction",
      action: { type: "EndPhase", player: "p1" },
    });
    const hostMsg = await host.waitForType("StateUpdate");
    expect(hostMsg.type).toBe("StateUpdate");

    host.close();
    guest.close();
  });

  it("surrender ends the match", async () => {
    const { host, guest } = await setupMatch(server.wsUrl);
    await mulliganBoth(host, guest);

    host.send({
      type: "SubmitAction",
      action: { type: "Surrender", player: "p1" },
    });

    // Both players should get StateUpdate then MatchEnded
    const hostUpdate = await host.waitForMessage();
    if (hostUpdate.type === "StateUpdate") {
      const hostEnded = await host.waitForType("MatchEnded");
      expect(hostEnded.winner).toBe("p2");
    } else {
      expect(hostUpdate.type).toBe("MatchEnded");
      expect((hostUpdate as { winner: string }).winner).toBe("p2");
    }

    // Guest also receives the end
    const guestMsg = await guest.waitForMessage();
    if (guestMsg.type === "StateUpdate") {
      const guestEnded = await guest.waitForType("MatchEnded");
      expect(guestEnded.winner).toBe("p2");
    } else {
      expect(guestMsg.type).toBe("MatchEnded");
    }

    host.close();
    guest.close();
  });
});
