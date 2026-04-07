import { describe, expect, it } from "vitest";
import { EconomyService } from "../src/services/EconomyService";
import { RngService } from "../src/services/RngService";
import type { GameRunState } from "../src/types";

function makeState(): GameRunState {
  return {
    roundIndex: 1,
    debtTarget: 100,
    currentMoney: 50,
    spinsLeft: 10,
    maxSpinsPerRound: 10,
    multiplier: 1,
    maxMultiplier: 5,
    riskMeter: 0,
    coinBias: 0,
    shield: 0,
    spinCount: 0,
    spinSeconds: 0,
    history: [],
    lastOutcome: null,
    score: 0,
    gameOver: false
  };
}

describe("EconomyService", () => {
  it("applies outcome with clamped lower bounds", () => {
    const eco = new EconomyService();
    const state = makeState();
    eco.applyOutcome(state, {
      symbols: ["bomb", "bankrupt", "bomb"],
      deltaMoney: -999,
      multiplierDelta: -3,
      spinsDelta: -1,
      riskDelta: 40,
      message: "test"
    });
    expect(state.currentMoney).toBe(0);
    expect(state.multiplier).toBe(1);
    expect(state.spinsLeft).toBe(8);
    expect(state.riskMeter).toBeGreaterThan(0);
  });

  it("detects clear/fail conditions", () => {
    const eco = new EconomyService();
    const state = makeState();
    state.currentMoney = 120;
    expect(eco.isRoundCleared(state)).toBe(true);
    state.currentMoney = 10;
    state.spinsLeft = 0;
    expect(eco.isRunFailed(state)).toBe(true);
  });

  it("generates deterministic outcome from seeded rng", () => {
    const eco = new EconomyService();
    const state = makeState();
    const rngA = new RngService(123);
    const rngB = new RngService(123);
    const a = eco.spin(state, rngA);
    const b = eco.spin(state, rngB);
    expect(a.symbols).toEqual(b.symbols);
    expect(a.deltaMoney).toEqual(b.deltaMoney);
  });

  it("never exceeds max spins per round", () => {
    const eco = new EconomyService();
    const state = makeState();
    eco.applyOutcome(state, {
      symbols: ["clover", "clover", "clover"],
      deltaMoney: 10,
      multiplierDelta: 2,
      spinsDelta: 3,
      riskDelta: 0,
      message: "bonus"
    });
    expect(state.spinsLeft).toBe(10);
  });
});
