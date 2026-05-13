import type { Card } from "@optcg/shared-types";

export const vanillaRedLeader: Card = {
  id: "VR-L001",
  name: "Red Vanilla Leader",
  cost: 0,
  power: 5000,
  counter: 0,
  colors: ["Red"],
  type: "Leader",
  attributes: ["Strike"],
  traits: ["Vanilla Pirates"],
  life: 5,
  effects: [],
};

function makeVanillaRed(cost: number, power: number, counter: number, index: number): Card {
  return {
    id: `VR-C${String(index).padStart(3, "0")}`,
    name: `Red Vanilla ${cost}-Cost ${power}`,
    cost,
    power,
    counter,
    colors: ["Red"],
    type: "Character",
    attributes: ["Strike"],
    traits: ["Vanilla Pirates"],
    life: 0,
    effects: [],
  };
}

// 50-card deck: mix of costs for a playable curve
export const vanillaRedDeck: readonly Card[] = [
  // 4x 1-cost 3000 (counter 1000)
  ...Array.from({ length: 4 }, (_, i) => makeVanillaRed(1, 3000, 1000, i + 1)),
  // 4x 2-cost 4000 (counter 1000)
  ...Array.from({ length: 4 }, (_, i) => makeVanillaRed(2, 4000, 1000, i + 5)),
  // 8x 3-cost 5000 (counter 1000)
  ...Array.from({ length: 8 }, (_, i) => makeVanillaRed(3, 5000, 1000, i + 9)),
  // 8x 4-cost 5000 (counter 2000)
  ...Array.from({ length: 8 }, (_, i) => makeVanillaRed(4, 5000, 2000, i + 17)),
  // 8x 5-cost 6000 (counter 1000)
  ...Array.from({ length: 8 }, (_, i) => makeVanillaRed(5, 6000, 1000, i + 25)),
  // 6x 6-cost 7000 (no counter)
  ...Array.from({ length: 6 }, (_, i) => makeVanillaRed(6, 7000, 0, i + 33)),
  // 6x 7-cost 8000 (no counter)
  ...Array.from({ length: 6 }, (_, i) => makeVanillaRed(7, 8000, 0, i + 39)),
  // 4x 8-cost 9000 (no counter)
  ...Array.from({ length: 4 }, (_, i) => makeVanillaRed(8, 9000, 0, i + 45)),
  // 2x 9-cost 10000 (no counter)
  ...Array.from({ length: 2 }, (_, i) => makeVanillaRed(9, 10000, 0, i + 49)),
];
