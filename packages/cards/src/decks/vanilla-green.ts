import type { Card } from "@optcg/shared-types";

export const vanillaGreenLeader: Card = {
  id: "VG-L001",
  name: "Green Vanilla Leader",
  cost: 0,
  power: 5000,
  counter: 0,
  colors: ["Green"],
  type: "Leader",
  attributes: ["Slash"],
  traits: ["Vanilla Crew"],
  life: 5,
  effects: [],
};

function makeVanillaGreen(cost: number, power: number, counter: number, index: number): Card {
  return {
    id: `VG-C${String(index).padStart(3, "0")}`,
    name: `Green Vanilla ${cost}-Cost ${power}`,
    cost,
    power,
    counter,
    colors: ["Green"],
    type: "Character",
    attributes: ["Slash"],
    traits: ["Vanilla Crew"],
    life: 0,
    effects: [],
  };
}

// 50-card deck: same curve as red for balanced testing
export const vanillaGreenDeck: readonly Card[] = [
  ...Array.from({ length: 4 }, (_, i) => makeVanillaGreen(1, 3000, 1000, i + 1)),
  ...Array.from({ length: 4 }, (_, i) => makeVanillaGreen(2, 4000, 1000, i + 5)),
  ...Array.from({ length: 8 }, (_, i) => makeVanillaGreen(3, 5000, 1000, i + 9)),
  ...Array.from({ length: 8 }, (_, i) => makeVanillaGreen(4, 5000, 2000, i + 17)),
  ...Array.from({ length: 8 }, (_, i) => makeVanillaGreen(5, 6000, 1000, i + 25)),
  ...Array.from({ length: 6 }, (_, i) => makeVanillaGreen(6, 7000, 0, i + 33)),
  ...Array.from({ length: 6 }, (_, i) => makeVanillaGreen(7, 8000, 0, i + 39)),
  ...Array.from({ length: 4 }, (_, i) => makeVanillaGreen(8, 9000, 0, i + 45)),
  ...Array.from({ length: 2 }, (_, i) => makeVanillaGreen(9, 10000, 0, i + 49)),
];
