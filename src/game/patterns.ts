import type { PatternDef, SymbolId } from "../types";

export const PATTERNS: PatternDef[] = [
  { id: "row-top", name: "Row Top", positions: [0, 1, 2], value: 1 },
  { id: "row-mid", name: "Row Mid", positions: [3, 4, 5], value: 1 },
  { id: "row-bot", name: "Row Bot", positions: [6, 7, 8], value: 1 },
  { id: "col-left", name: "Col Left", positions: [0, 3, 6], value: 1 },
  { id: "col-mid", name: "Col Mid", positions: [1, 4, 7], value: 1 },
  { id: "col-right", name: "Col Right", positions: [2, 5, 8], value: 1 },
  { id: "diag-main", name: "Diag \\", positions: [0, 4, 8], value: 2 },
  { id: "diag-anti", name: "Diag /", positions: [2, 4, 6], value: 2 },
  { id: "v-shape", name: "V Shape", positions: [0, 4, 2], value: 3 },
  { id: "v-inverse", name: "Inv V", positions: [6, 4, 8], value: 3 },
  { id: "corners", name: "Corners", positions: [0, 2, 6, 8], value: 4 },
  { id: "cross", name: "Cross", positions: [1, 3, 4, 5, 7], value: 5 },
  { id: "x-shape", name: "X Shape", positions: [0, 2, 4, 6, 8], value: 6 },
  { id: "full", name: "Full", positions: [0, 1, 2, 3, 4, 5, 6, 7, 8], value: 10 },
];

export const SYMBOL_VALUES: Record<SymbolId, number> = {
  coin: 2,
  clover: 3,
  star: 5,
  wild: 0,
  bomb: -2,
  bankrupt: -4,
};

export const POSITIVE_SYMBOLS: SymbolId[] = ["coin", "clover", "star"];
export const NEGATIVE_SYMBOLS: SymbolId[] = ["bomb", "bankrupt"];
