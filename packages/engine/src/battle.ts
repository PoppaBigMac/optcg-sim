import type { GameState, CardInstance, PlayerState } from "./state";
import { getPlayer, setPlayer, opponent } from "./state";

export function effectivePower(
  card: CardInstance,
  state: GameState,
  ownerIsActivePlayer: boolean,
): number {
  let power = card.card.power;

  if (ownerIsActivePlayer) {
    power += card.attachedDon * 1000;
  }

  for (const mod of card.modifiers) {
    power += mod.powerDelta;
  }

  return power;
}

function findCard(
  ps: PlayerState,
  instanceId: string,
): CardInstance | undefined {
  if (ps.leader.instanceId === instanceId) return ps.leader;
  return ps.characterArea.find((c) => c.instanceId === instanceId);
}

export function resolveDamage(state: GameState): GameState {
  const combat = state.combat;
  if (!combat) return state;

  const attackerPlayer = getPlayer(state, combat.attackerPlayer);
  const defenderSlot = opponent(combat.attackerPlayer);
  const defenderPlayer = getPlayer(state, defenderSlot);

  const attacker = findCard(attackerPlayer, combat.attackerInstanceId);
  if (!attacker) return clearCombat(state);

  const attackerIsActive = combat.attackerPlayer === state.activePlayer;
  const attackPower = effectivePower(attacker, state, attackerIsActive);

  if (combat.targetKind === "character") {
    const target = defenderPlayer.characterArea.find(
      (c) => c.instanceId === combat.targetInstanceId,
    );
    if (!target) return clearCombat(state);

    const defenderIsActive = defenderSlot === state.activePlayer;
    const defendPower = effectivePower(target, state, defenderIsActive) + combat.powerBoost;

    if (attackPower >= defendPower) {
      const updatedDefender: PlayerState = {
        ...defenderPlayer,
        characterArea: defenderPlayer.characterArea.filter(
          (c) => c.instanceId !== combat.targetInstanceId,
        ),
        trash: [...defenderPlayer.trash, target],
      };
      return setPlayer(state, defenderSlot, updatedDefender);
    }

    return state;
  }

  const defenderIsActive = defenderSlot === state.activePlayer;
  const leaderPower = effectivePower(defenderPlayer.leader, state, defenderIsActive) + combat.powerBoost;

  if (attackPower >= leaderPower) {
    if (defenderPlayer.life.length === 0) {
      return { ...state, winner: combat.attackerPlayer };
    }

    const [topLife, ...remainingLife] = defenderPlayer.life;
    const updatedDefender: PlayerState = {
      ...defenderPlayer,
      life: remainingLife,
      hand: [...defenderPlayer.hand, topLife],
    };
    return setPlayer(state, defenderSlot, updatedDefender);
  }

  return state;
}

export function clearCombat(state: GameState): GameState {
  return { ...state, combat: null };
}
