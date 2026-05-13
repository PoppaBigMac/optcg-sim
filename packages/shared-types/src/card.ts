export type Color = "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow";

export type CardType = "Leader" | "Character" | "Event" | "Stage" | "DON";

export type Attribute = "Slash" | "Strike" | "Ranged" | "Wisdom" | "Special";

export interface Card {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly power: number;
  readonly counter: number;
  readonly colors: readonly Color[];
  readonly type: CardType;
  readonly attributes: readonly Attribute[];
  readonly traits: readonly string[];
  readonly life: number;
  readonly effects: readonly string[];
}
