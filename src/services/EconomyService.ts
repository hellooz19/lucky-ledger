import type { GameRunState, SpinOutcome, SymbolDef, SymbolId } from "../types";
import { RngService } from "./RngService";
import { findMatches } from "../game/patternMatcher";

const BASE_SYMBOLS: SymbolDef[] = [
  { id: "coin", label: "COIN", weight: 35 },
  { id: "clover", label: "CLOVER", weight: 20 },
  { id: "star", label: "STAR", weight: 10 },
  { id: "wild", label: "WILD", weight: 8 },
  { id: "bomb", label: "BOMB", weight: 18 },
  { id: "bankrupt", label: "GHOST", weight: 9 },
];

export class EconomyService {
  spin(state: GameRunState, rng: RngService): SpinOutcome {
    const grid: SymbolId[] = [];
    for (let i = 0; i < 9; i++) {
      grid.push(this.pickSymbol(state, rng));
    }

    const matches = findMatches(grid, state.multiplier);

    let totalDelta = 0;
    let multiplierDelta = 0;
    let riskDelta = 0;
    const matchMessages: string[] = [];

    if (matches.length === 0) {
      totalDelta = -(5 + state.roundIndex * 2);
      return {
        grid,
        matches,
        totalDelta,
        multiplierDelta: 0,
        riskDelta: 0,
        message: "No match..."
      };
    }

    let shieldLeft = state.shield;

    for (const match of matches) {
      if (match.symbolId === "bomb" && shieldLeft > 0) {
        shieldLeft--;
        continue;
      }

      totalDelta += match.reward;

      if (match.symbolId === "clover") {
        multiplierDelta += 1;
      }
      if (match.symbolId === "bomb") {
        const patternValue = match.positions.length <= 3 ? 1 :
          match.positions.length <= 4 ? 4 :
          match.positions.length <= 5 ? 5 : 10;
        riskDelta += patternValue * 5;
      }
      if (match.symbolId === "bankrupt") {
        const patternValue = match.positions.length <= 3 ? 1 :
          match.positions.length <= 4 ? 4 :
          match.positions.length <= 5 ? 5 : 10;
        riskDelta += patternValue * 8;
        multiplierDelta -= 1;
      }

      matchMessages.push(match.patternId);
    }

    const total = Math.round(totalDelta);
    const sign = total >= 0 ? "+" : "";
    const summary = matches.length === 1
      ? `${matchMessages[0]}! ${sign}${total}`
      : `${matches.length} hits! ${sign}${total}`;

    return {
      grid,
      matches,
      totalDelta: total,
      multiplierDelta,
      riskDelta,
      message: summary
    };
  }

  applyOutcome(state: GameRunState, outcome: SpinOutcome): void {
    state.spinsLeft = Math.max(0, state.spinsLeft - 1);
    state.currentMoney = Math.max(0, state.currentMoney + outcome.totalDelta);
    state.multiplier = Math.max(1, Math.min(state.maxMultiplier, state.multiplier + outcome.multiplierDelta));
    state.riskMeter = Math.max(0, Math.min(100, state.riskMeter + outcome.riskDelta - 5));
    state.spinCount += 1;
    state.spinSeconds += 3;
    state.score += Math.max(0, outcome.totalDelta) + state.roundIndex * 5;
    state.lastOutcome = outcome;
    state.history.unshift(
      `[R${state.roundIndex}] ${outcome.message} | ${outcome.totalDelta >= 0 ? "+" : ""}${outcome.totalDelta}`
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
      if (sym.id === "wild") {
        return { ...sym, weight: sym.weight + (state.wildBoost || 0) };
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
