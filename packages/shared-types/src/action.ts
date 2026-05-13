export type PlayerSlot = "p1" | "p2";

export type Action =
  | { type: "Mulligan"; player: PlayerSlot; keep: boolean }
  | { type: "PlayCharacter"; player: PlayerSlot; cardInstanceId: string; donToRest: string[] }
  | { type: "PlayStage"; player: PlayerSlot; cardInstanceId: string; donToRest: string[] }
  | { type: "PlayEvent"; player: PlayerSlot; cardInstanceId: string; donToRest: string[] }
  | { type: "GiveDon"; player: PlayerSlot; donInstanceId: string; targetInstanceId: string }
  | { type: "DeclareAttack"; player: PlayerSlot; attackerInstanceId: string; targetInstanceId: string | null }
  | { type: "DeclareBlocker"; player: PlayerSlot; blockerInstanceId: string }
  | { type: "PassBlock"; player: PlayerSlot }
  | { type: "UseCounter"; player: PlayerSlot; cardInstanceId: string }
  | { type: "PassCounter"; player: PlayerSlot }
  | { type: "ActivateMainEffect"; player: PlayerSlot; cardInstanceId: string }
  | { type: "EndPhase"; player: PlayerSlot }
  | { type: "Surrender"; player: PlayerSlot };
