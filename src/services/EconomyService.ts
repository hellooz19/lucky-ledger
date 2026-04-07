import type { GameRunState, SpinOutcome, SymbolDef, SymbolId } from "../types";
import { RngService } from "./RngService";

const BASE_SYMBOLS: SymbolDef[] = [
  { id: "coin", label: "COIN", weight: 45 },
  { id: "clover", label: "CLOVER", weight: 25 },
  { id: "bomb", label: "BOMB", weight: 20 },
  { id: "bankrupt", label: "RIP", weight: 10 }
];

export class EconomyService {
  spin(state: GameRunState, rng: RngService): SpinOutcome {
    const symbols = [0, 1, 2].map(() => this.pickSymbol(state, rng));
    const coinCount = symbols.filter((s) => s === "coin").length;
    const cloverCount = symbols.filter((s) => s === "clover").length;
    const bombCount = symbols.filter((s) => s === "bomb").length;
    const bankruptCount = symbols.filter((s) => s === "bankrupt").length;

    const baseCoinValue = 16 + state.roundIndex * 6;
    const shieldedBombs = Math.max(0, bombCount - state.shield);
    const riskPenalty = Math.round(state.riskMeter * 0.3);

    let deltaMoney = 0;
    let multiplierDelta = 0;
    let spinsDelta = 0;
    let riskDelta = 0;
    let message = "Calm spin.";

    if (coinCount > 0) {
      deltaMoney += Math.round(baseCoinValue * coinCount * state.multiplier);
      message = `Coin x${coinCount} gained`;
    }

    if (cloverCount > 0) {
      multiplierDelta += cloverCount;
      spinsDelta += cloverCount >= 2 ? 1 : 0;
      message = `Clover x${cloverCount} boosted multiplier`;
    }

    if (shieldedBombs > 0) {
      const bombLoss = Math.round((20 + state.roundIndex * 4) * shieldedBombs + riskPenalty);
      deltaMoney -= bombLoss;
      riskDelta += shieldedBombs * 12;
      message = `Bomb x${shieldedBombs} damaged funds`;
    }

    if (bankruptCount > 0) {
      const crashLoss = Math.round((35 + state.roundIndex * 5) * bankruptCount + state.currentMoney * 0.08);
      deltaMoney -= crashLoss;
      riskDelta += bankruptCount * 18;
      multiplierDelta -= bankruptCount;
      message = `RIP x${bankruptCount} caused crash`;
    }

    if (coinCount === 3) {
      deltaMoney += Math.round(baseCoinValue * 2.4 * state.multiplier);
      message = "Triple coin jackpot";
    }

    if (cloverCount === 3) {
      spinsDelta += 2;
      multiplierDelta += 2;
      message = "Triple clover luck burst";
    }

    if (bombCount === 3 || bankruptCount === 3) {
      deltaMoney -= Math.round((50 + state.roundIndex * 8) + riskPenalty);
      riskDelta += 22;
      message = "Disaster combo";
    }

    deltaMoney = Math.round(deltaMoney);
    return {
      symbols,
      deltaMoney,
      multiplierDelta,
      spinsDelta,
      riskDelta,
      message
    };
  }

  applyOutcome(state: GameRunState, outcome: SpinOutcome): void {
    const cap = Number.isFinite(state.maxSpinsPerRound) && state.maxSpinsPerRound > 0 ? state.maxSpinsPerRound : 10;
    const nextSpins = Number.isFinite(state.spinsLeft) ? state.spinsLeft - 1 + outcome.spinsDelta : cap - 1 + outcome.spinsDelta;
    state.maxSpinsPerRound = cap;
    state.spinsLeft = Math.max(0, Math.min(cap, nextSpins));
    state.currentMoney = Math.max(0, state.currentMoney + outcome.deltaMoney);
    state.multiplier = Math.max(1, Math.min(state.maxMultiplier, state.multiplier + outcome.multiplierDelta));
    state.riskMeter = Math.max(0, Math.min(100, state.riskMeter + outcome.riskDelta - 5));
    state.spinCount += 1;
    state.spinSeconds += 3;
    state.score += Math.max(0, outcome.deltaMoney) + state.roundIndex * 5;
    state.lastOutcome = outcome;
    state.history.unshift(
      `[R${state.roundIndex}] ${outcome.symbols.join("-")} | ${outcome.message} | ${outcome.deltaMoney >= 0 ? "+" : ""}${outcome.deltaMoney}`
    );
    if (state.history.length > 8) {
      state.history.length = 8;
    }
  }

  isRoundCleared(state: GameRunState): boolean {
    return state.currentMoney >= state.debtTarget;
  }

  isRunFailed(state: GameRunState): boolean {
    return state.spinsLeft <= 0 && !this.isRoundCleared(state);
  }

  private pickSymbol(state: GameRunState, rng: RngService): SymbolId {
    const adjusted = BASE_SYMBOLS.map((sym) => {
      if (sym.id === "coin") {
        return { ...sym, weight: sym.weight + state.coinBias };
      }
      if (sym.id === "bankrupt") {
        return { ...sym, weight: Math.max(3, sym.weight + Math.floor(state.riskMeter / 12)) };
      }
      if (sym.id === "bomb") {
        return { ...sym, weight: Math.max(5, sym.weight + Math.floor(state.riskMeter / 18)) };
      }
      return sym;
    });
    return rng.pickWeighted(adjusted).id;
  }
}
