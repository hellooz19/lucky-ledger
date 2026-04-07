import type { PatternMatch, SymbolId } from "../types";
import { PATTERNS, SYMBOL_VALUES, POSITIVE_SYMBOLS } from "./patterns";

export function findMatches(grid: SymbolId[], multiplier = 1): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const pattern of PATTERNS) {
    const symbols = pattern.positions.map((i) => grid[i]);
    const nonWild = symbols.filter((s) => s !== "wild");

    if (nonWild.length === 0) {
      continue;
    }

    const uniqueNonWild = new Set(nonWild);
    if (uniqueNonWild.size !== 1) {
      continue;
    }

    const matchedSymbol = nonWild[0];
    const symValue = SYMBOL_VALUES[matchedSymbol];
    const isPositive = POSITIVE_SYMBOLS.includes(matchedSymbol);

    let reward: number;
    if (isPositive) {
      reward = (symValue + 1) * (pattern.value + 1) * multiplier;
    } else {
      reward = -((Math.abs(symValue) + 1) * (pattern.value + 1));
    }

    matches.push({
      patternId: pattern.id,
      symbolId: matchedSymbol,
      positions: pattern.positions,
      reward,
    });
  }

  return matches;
}
