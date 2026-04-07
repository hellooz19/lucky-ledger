import { describe, expect, it } from "vitest";
import { findMatches } from "../src/game/patternMatcher";
import type { SymbolId } from "../src/types";

describe("patternMatcher", () => {
  it("finds a matching row of coins", () => {
    const grid: SymbolId[] = [
      "coin", "coin", "coin",
      "bomb", "clover", "star",
      "bankrupt", "wild", "bomb"
    ];
    const matches = findMatches(grid);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeDefined();
    expect(rowTop!.symbolId).toBe("coin");
  });

  it("wild substitutes for the majority symbol", () => {
    const grid: SymbolId[] = [
      "star", "wild", "star",
      "bomb", "bomb", "bomb",
      "coin", "coin", "coin"
    ];
    const matches = findMatches(grid);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeDefined();
    expect(rowTop!.symbolId).toBe("star");
  });

  it("all-wild line does not match", () => {
    const grid: SymbolId[] = [
      "wild", "wild", "wild",
      "coin", "bomb", "star",
      "clover", "bankrupt", "coin"
    ];
    const matches = findMatches(grid);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeUndefined();
  });

  it("mixed non-wild symbols do not match", () => {
    const grid: SymbolId[] = [
      "coin", "star", "bomb",
      "coin", "coin", "coin",
      "coin", "coin", "coin"
    ];
    const matches = findMatches(grid);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeUndefined();
  });

  it("finds multiple patterns simultaneously", () => {
    const grid: SymbolId[] = [
      "coin", "coin", "coin",
      "coin", "coin", "coin",
      "coin", "coin", "coin"
    ];
    const matches = findMatches(grid);
    expect(matches.length).toBe(14);
    expect(matches.find((m) => m.patternId === "full")).toBeDefined();
  });

  it("finds diagonal pattern", () => {
    const grid: SymbolId[] = [
      "star", "bomb", "coin",
      "bomb", "star", "bomb",
      "coin", "bomb", "star"
    ];
    const matches = findMatches(grid);
    const diag = matches.find((m) => m.patternId === "diag-main");
    expect(diag).toBeDefined();
    expect(diag!.symbolId).toBe("star");
  });

  it("finds cross pattern with wild", () => {
    const grid: SymbolId[] = [
      "bomb", "clover", "bomb",
      "clover", "wild", "clover",
      "bomb", "clover", "bomb"
    ];
    const matches = findMatches(grid);
    const cross = matches.find((m) => m.patternId === "cross");
    expect(cross).toBeDefined();
    expect(cross!.symbolId).toBe("clover");
  });

  it("calculates reward correctly for positive symbol", () => {
    const grid: SymbolId[] = [
      "coin", "coin", "coin",
      "bomb", "star", "bomb",
      "clover", "bomb", "clover"
    ];
    const matches = findMatches(grid, 2);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeDefined();
    expect(rowTop!.reward).toBe(12);
  });

  it("calculates reward correctly for negative symbol (no multiplier)", () => {
    const grid: SymbolId[] = [
      "bomb", "bomb", "bomb",
      "coin", "star", "coin",
      "clover", "coin", "clover"
    ];
    const matches = findMatches(grid, 3);
    const rowTop = matches.find((m) => m.patternId === "row-top");
    expect(rowTop).toBeDefined();
    expect(rowTop!.reward).toBe(-6);
  });
});
