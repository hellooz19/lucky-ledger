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
    wildBoost: 0,
    shield: 0,
    spinCount: 0,
    spinSeconds: 0,
    history: [],
    lastOutcome: null,
    score: 0,
    gameOver: false
  };
}

describe("EconomyService (3x3)", () => {
  it("spin returns a grid of 9 symbols", () => {
    const eco = new EconomyService();
    const state = makeState();
    const rng = new RngService(123);
    const outcome = eco.spin(state, rng);
    expect(outcome.grid).toHaveLength(9);
  });

  it("generates deterministic outcome from seeded rng", () => {
    const eco = new EconomyService();
    const state = makeState();
    const a = eco.spin(state, new RngService(123));
    const b = eco.spin(state, new RngService(123));
    expect(a.grid).toEqual(b.grid);
    expect(a.totalDelta).toEqual(b.totalDelta);
  });

  it("applies outcome: money clamped to 0", () => {
    const eco = new EconomyService();
    const state = makeState();
    eco.applyOutcome(state, {
      grid: ["bomb", "bomb", "bomb", "bomb", "bomb", "bomb", "bomb", "bomb", "bomb"],
      matches: [],
      totalDelta: -999,
      multiplierDelta: -3,
      riskDelta: 40,
      message: "test"
    });
    expect(state.currentMoney).toBe(0);
    expect(state.multiplier).toBe(1);
  });

  it("applies outcome: spins decrement by 1 (fixed)", () => {
    const eco = new EconomyService();
    const state = makeState();
    eco.applyOutcome(state, {
      grid: ["coin", "coin", "coin", "bomb", "bomb", "bomb", "star", "star", "star"],
      matches: [],
      totalDelta: 10,
      multiplierDelta: 0,
      riskDelta: 0,
      message: "test"
    });
    expect(state.spinsLeft).toBe(9);
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

  it("no match gives penalty", () => {
    const eco = new EconomyService();
    const state = makeState();
    const rng = new RngService(42);
    let hadPenalty = false;
    for (let i = 0; i < 50; i++) {
      const outcome = eco.spin(state, rng);
      if (outcome.matches.length === 0 && outcome.totalDelta < 0) {
        hadPenalty = true;
        break;
      }
    }
    expect(hadPenalty).toBe(true);
  });

  it("clover match increases multiplier", () => {
    const eco = new EconomyService();
    const state = makeState();
    eco.applyOutcome(state, {
      grid: ["clover", "clover", "clover", "bomb", "coin", "star", "wild", "bomb", "coin"],
      matches: [{ patternId: "row-top", symbolId: "clover", positions: [0, 1, 2], reward: 8 }],
      totalDelta: 8,
      multiplierDelta: 1,
      riskDelta: 0,
      message: "Row Top Clover! +8"
    });
    expect(state.multiplier).toBe(2);
  });

  it("wildBoost increases wild weight", () => {
    const eco = new EconomyService();
    const state = makeState();
    state.wildBoost = 50;
    let wildCount = 0;
    for (let i = 0; i < 100; i++) {
      const outcome = eco.spin(state, new RngService(100 + i));
      wildCount += outcome.grid.filter((s) => s === "wild").length;
    }
    expect(wildCount).toBeGreaterThan(50);
  });
});
