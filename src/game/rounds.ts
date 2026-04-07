import type { RoundConfig } from "../types";

export function createRoundConfig(roundIndex: number): RoundConfig {
  const ramp = Math.pow(roundIndex, 1.18);
  return {
    roundIndex,
    debtTarget: Math.round(95 + ramp * 55),
    baseSpins: Math.max(8, 14 - Math.floor(roundIndex / 2)),
    variance: Math.round(12 + roundIndex * 3)
  };
}

