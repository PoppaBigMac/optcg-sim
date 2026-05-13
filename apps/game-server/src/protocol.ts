import { z } from "zod";

// ── Client → Server messages ───────────────────────────────────────

export const CreateLobbySchema = z.object({
  type: z.literal("CreateLobby"),
  playerName: z.string().min(1).max(32),
});

export const JoinLobbySchema = z.object({
  type: z.literal("JoinLobby"),
  lobbyId: z.string().length(6),
  playerName: z.string().min(1).max(32),
});

export const ReadySchema = z.object({
  type: z.literal("Ready"),
  deckId: z.string().min(1),
});

const PlayerSlotSchema = z.enum(["p1", "p2"]);

export const SubmitActionSchema = z.object({
  type: z.literal("SubmitAction"),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("Mulligan"), player: PlayerSlotSchema, keep: z.boolean() }),
    z.object({ type: z.literal("PlayCharacter"), player: PlayerSlotSchema, cardInstanceId: z.string(), donToRest: z.array(z.string()) }),
    z.object({ type: z.literal("PlayStage"), player: PlayerSlotSchema, cardInstanceId: z.string(), donToRest: z.array(z.string()) }),
    z.object({ type: z.literal("PlayEvent"), player: PlayerSlotSchema, cardInstanceId: z.string(), donToRest: z.array(z.string()) }),
    z.object({ type: z.literal("GiveDon"), player: PlayerSlotSchema, donInstanceId: z.string(), targetInstanceId: z.string() }),
    z.object({ type: z.literal("DeclareAttack"), player: PlayerSlotSchema, attackerInstanceId: z.string(), targetInstanceId: z.string().nullable() }),
    z.object({ type: z.literal("DeclareBlocker"), player: PlayerSlotSchema, blockerInstanceId: z.string() }),
    z.object({ type: z.literal("PassBlock"), player: PlayerSlotSchema }),
    z.object({ type: z.literal("UseCounter"), player: PlayerSlotSchema, cardInstanceId: z.string() }),
    z.object({ type: z.literal("PassCounter"), player: PlayerSlotSchema }),
    z.object({ type: z.literal("ActivateMainEffect"), player: PlayerSlotSchema, cardInstanceId: z.string() }),
    z.object({ type: z.literal("EndPhase"), player: PlayerSlotSchema }),
    z.object({ type: z.literal("Surrender"), player: PlayerSlotSchema }),
  ]),
});

export const LeaveSchema = z.object({
  type: z.literal("Leave"),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  CreateLobbySchema,
  JoinLobbySchema,
  ReadySchema,
  SubmitActionSchema,
  LeaveSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ── Server → Client messages ───────────────────────────────────────

export const LobbyCreatedSchema = z.object({
  type: z.literal("LobbyCreated"),
  lobbyId: z.string(),
});

export const LobbyJoinedSchema = z.object({
  type: z.literal("LobbyJoined"),
  lobbyId: z.string(),
  opponentName: z.string(),
});

export const MatchStartedSchema = z.object({
  type: z.literal("MatchStarted"),
  matchId: z.string(),
  yourSlot: PlayerSlotSchema,
  state: z.record(z.unknown()),
});

export const StateUpdateSchema = z.object({
  type: z.literal("StateUpdate"),
  state: z.record(z.unknown()),
});

export const ActionRejectedSchema = z.object({
  type: z.literal("ActionRejected"),
  reason: z.string(),
});

export const MatchEndedSchema = z.object({
  type: z.literal("MatchEnded"),
  winner: z.string(),
  state: z.record(z.unknown()),
});

export const ErrorSchema = z.object({
  type: z.literal("Error"),
  message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  LobbyCreatedSchema,
  LobbyJoinedSchema,
  MatchStartedSchema,
  StateUpdateSchema,
  ActionRejectedSchema,
  MatchEndedSchema,
  ErrorSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
