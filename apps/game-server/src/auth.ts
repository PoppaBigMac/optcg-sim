import { randomUUID } from "node:crypto";

// TODO: Replace with Supabase JWT verification in Phase 1.
// For now, accept a playerName and assign a UUID as the player id.

export interface AuthResult {
  playerId: string;
  playerName: string;
}

export function authenticatePlayer(playerName: string): AuthResult {
  return {
    playerId: randomUUID(),
    playerName,
  };
}
