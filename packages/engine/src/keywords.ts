import type { CardInstance } from "./state";

export function hasDoubleAttack(card: CardInstance): boolean {
  return card.card.effects.some((e) => e.includes("[Double Attack]"));
}

export function hasUnblockable(card: CardInstance): boolean {
  return card.card.effects.some((e) => e.includes("[Unblockable]"));
}

export function hasRush(card: CardInstance): boolean {
  return card.card.effects.some((e) => e.includes("[Rush]"));
}
