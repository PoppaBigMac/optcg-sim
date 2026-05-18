import type { Card } from "@optcg/shared-types";

export const keywordRedLeader: Card = {
  id: "KR-L001",
  name: "Keyword Red Leader",
  cost: 0,
  power: 5000,
  counter: 0,
  colors: ["Red"],
  type: "Leader",
  attributes: ["Strike"],
  traits: ["Keyword Pirates"],
  life: 5,
  effects: [],
};

function makeCard(
  id: string,
  name: string,
  cost: number,
  power: number,
  counter: number,
  effects: string[],
): Card {
  return {
    id,
    name,
    cost,
    power,
    counter,
    colors: ["Red"],
    type: "Character",
    attributes: ["Strike"],
    traits: ["Keyword Pirates"],
    life: 0,
    effects,
  };
}

// 50-card keyword deck — designed to put keyword cards into hand frequently.
//
// 4x 1-cost 3000 (counter 1000) — vanilla early game
// 4x 2-cost 4000 (counter 1000) [Blocker] — early blockers
// 4x 3-cost 5000 (counter 1000) — vanilla
// 4x 3-cost 5000 (counter 0)   [Double Attack] — low-cost DA
// 4x 3-cost 4000 (counter 1000) [Blocker] — mid blockers
// 4x 4-cost 6000 (counter 0)   [Unblockable] — unblockable threats
// 4x 4-cost 6000 (counter 2000) — vanilla 4-drops with high counter
// 4x 5-cost 7000 (counter 1000) — vanilla
// 4x 5-cost 6000 (counter 0)   [Double Attack] — mid DA
// 4x 6-cost 7000 (counter 0)   [Unblockable] — late unblockable
// 4x 7-cost 9000 (counter 0)   [Double Attack] — finisher DA
// 6x 3-cost 5000 (counter 1000) — extra vanilla to round to 50

export const keywordRedDeck: readonly Card[] = [
  // 1-cost vanilla
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 1).padStart(3, "0")}`, `Red Rookie ${i + 1}`, 1, 3000, 1000, []),
  ),
  // 2-cost Blocker
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 5).padStart(3, "0")}`, `Red Blocker ${i + 1}`, 2, 4000, 1000, ["[Blocker]"]),
  ),
  // 3-cost vanilla
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 9).padStart(3, "0")}`, `Red Fighter ${i + 1}`, 3, 5000, 1000, []),
  ),
  // 3-cost Double Attack
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 13).padStart(3, "0")}`, `Red DA ${i + 1}`, 3, 5000, 0, ["[Double Attack]"]),
  ),
  // 3-cost Blocker
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 17).padStart(3, "0")}`, `Red Guard ${i + 1}`, 3, 4000, 1000, ["[Blocker]"]),
  ),
  // 4-cost Unblockable
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 21).padStart(3, "0")}`, `Red Phantom ${i + 1}`, 4, 6000, 0, ["[Unblockable]"]),
  ),
  // 4-cost vanilla (high counter)
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 25).padStart(3, "0")}`, `Red Veteran ${i + 1}`, 4, 6000, 2000, []),
  ),
  // 5-cost vanilla
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 29).padStart(3, "0")}`, `Red Commander ${i + 1}`, 5, 7000, 1000, []),
  ),
  // 5-cost Double Attack
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 33).padStart(3, "0")}`, `Red DA Commander ${i + 1}`, 5, 6000, 0, ["[Double Attack]"]),
  ),
  // 6-cost Unblockable
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 37).padStart(3, "0")}`, `Red Shadow ${i + 1}`, 6, 7000, 0, ["[Unblockable]"]),
  ),
  // 7-cost Double Attack finisher
  ...Array.from({ length: 4 }, (_, i) =>
    makeCard(`KR-C${String(i + 41).padStart(3, "0")}`, `Red Finisher ${i + 1}`, 7, 9000, 0, ["[Double Attack]"]),
  ),
  // Extra 3-cost vanilla to fill to 50
  ...Array.from({ length: 6 }, (_, i) =>
    makeCard(`KR-C${String(i + 45).padStart(3, "0")}`, `Red Soldier ${i + 1}`, 3, 5000, 1000, []),
  ),
];
