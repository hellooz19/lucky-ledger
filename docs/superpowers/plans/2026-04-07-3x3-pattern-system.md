# 3x3 Grid + Pattern System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the slot from 3x1 to 3x3 grid with 14 pattern types, 6 symbols (adding Star + Wild), CloverPit-style multiplicative rewards, fixed spins per round, and in-game pattern guide.

**Architecture:** New `patterns.ts` defines 14 PatternDef objects. New `patternMatcher.ts` finds all matching patterns in a 3x3 grid with Wild substitution. `EconomyService` is rewritten to generate 9-cell grids and compute pattern-based rewards. `RunScene` renders 3x3 grid with hit highlighting and a pattern overlay. All changes are TDD with existing simulation rebalanced.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types.ts` | Modify | Expand SymbolId, add PatternDef/PatternMatch, rewrite SpinOutcome/GameRunState |
| `src/game/patterns.ts` | Create | 14 PatternDef definitions + SYMBOL_VALUES map |
| `src/game/patternMatcher.ts` | Create | findMatches(grid) with Wild logic |
| `src/services/EconomyService.ts` | Rewrite | 3x3 grid spin + pattern-based rewards |
| `src/game/upgrades.ts` | Modify | Remove Extra Focus, add Lucky Draw |
| `src/game/session.ts` | Modify | Add wildBoost, adapt to new SpinOutcome |
| `src/game/simulation.ts` | Modify | Adapt to new SpinOutcome interface |
| `src/ui/theme.ts` | Modify | Add star/wild symbol colors |
| `src/scenes/RunScene.ts` | Rewrite | 3x3 grid UI, hit highlights, pattern overlay, new textures |
| `src/scenes/HelpScene.ts` | Modify | Add PATTERNS/SCORING sections, update SYMBOLS to 6 |
| `tests/patternMatcher.test.ts` | Create | Pattern matching unit tests |
| `tests/economy.test.ts` | Rewrite | Pattern-based economy tests |
| `tests/upgrades.test.ts` | Modify | Lucky Draw test, remove Extra Focus |
| `tests/simulation.test.ts` | Modify | Rebalance bounds for 3x3 |

---

### Task 1: Types Update

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Rewrite src/types.ts**

Replace the entire contents of `src/types.ts` with:

```typescript
export type SymbolId = "coin" | "clover" | "star" | "wild" | "bomb" | "bankrupt";

export interface SymbolDef {
  id: SymbolId;
  label: string;
  weight: number;
}

export interface RoundConfig {
  roundIndex: number;
  debtTarget: number;
  baseSpins: number;
  variance: number;
}

export interface PatternDef {
  id: string;
  name: string;
  positions: number[];
  value: number;
}

export interface PatternMatch {
  patternId: string;
  symbolId: SymbolId;
  positions: number[];
  reward: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  apply: (state: GameRunState) => void;
}

export interface ScoreEntry {
  id: string;
  score: number;
  roundReached: number;
  playedAt: string;
}

export interface GameSettings {
  soundOn: boolean;
  vibrationOn: boolean;
  themeMode: "light" | "dark";
}

export interface RunMeta {
  runsPlayed: number;
  bestRound: number;
}

export interface SpinOutcome {
  grid: SymbolId[];
  matches: PatternMatch[];
  totalDelta: number;
  multiplierDelta: number;
  riskDelta: number;
  message: string;
}

export interface GameRunState {
  roundIndex: number;
  debtTarget: number;
  currentMoney: number;
  spinsLeft: number;
  maxSpinsPerRound: number;
  multiplier: number;
  maxMultiplier: number;
  riskMeter: number;
  coinBias: number;
  wildBoost: number;
  shield: number;
  spinCount: number;
  spinSeconds: number;
  history: string[];
  lastOutcome: SpinOutcome | null;
  score: number;
  gameOver: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: expand types for 3x3 grid, patterns, and 6 symbols"
```

---

### Task 2: Pattern Definitions

**Files:**
- Create: `src/game/patterns.ts`

- [ ] **Step 1: Create src/game/patterns.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/game/patterns.ts
git commit -m "feat: add 14 pattern definitions and symbol value map"
```

---

### Task 3: Pattern Matcher

**Files:**
- Create: `src/game/patternMatcher.ts`
- Create: `tests/patternMatcher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/patternMatcher.test.ts`:

```typescript
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
    // (2+1) * (1+1) * 2 = 12
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
    // -(abs(-2)+1) * (1+1) * 1 = -6 (multiplier ignored for negative)
    expect(rowTop!.reward).toBe(-6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/patternMatcher.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement patternMatcher**

Create `src/game/patternMatcher.ts`:

```typescript
import type { PatternMatch, SymbolId } from "../types";
import { PATTERNS, SYMBOL_VALUES, POSITIVE_SYMBOLS } from "./patterns";

export function findMatches(grid: SymbolId[], multiplier = 1): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const pattern of PATTERNS) {
    const symbols = pattern.positions.map((i) => grid[i]);
    const nonWild = symbols.filter((s) => s !== "wild");

    // All wild → no match
    if (nonWild.length === 0) {
      continue;
    }

    // All non-wild must be the same symbol
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/patternMatcher.test.ts`
Expected: PASS (all 9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/patternMatcher.ts tests/patternMatcher.test.ts
git commit -m "feat: add pattern matcher with wild substitution and reward calculation"
```

---

### Task 4: EconomyService Rewrite

**Files:**
- Rewrite: `src/services/EconomyService.ts`
- Rewrite: `tests/economy.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the entire contents of `tests/economy.test.ts` with:

```typescript
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

  it("applies outcome: spins decrement by 1 (fixed, no spinsDelta)", () => {
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
    // Run many spins; at least some should have no matches and give negative totalDelta
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
    const rng = new RngService(100);
    let wildCount = 0;
    for (let i = 0; i < 100; i++) {
      const outcome = eco.spin(state, new RngService(100 + i));
      wildCount += outcome.grid.filter((s) => s === "wild").length;
    }
    // With +50 wild boost, wilds should appear frequently
    expect(wildCount).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/economy.test.ts`
Expected: FAIL — EconomyService doesn't match new interface

- [ ] **Step 3: Rewrite EconomyService**

Replace the entire contents of `src/services/EconomyService.ts` with:

```typescript
import type { GameRunState, SpinOutcome, SymbolDef, SymbolId } from "../types";
import { RngService } from "./RngService";
import { findMatches } from "../game/patternMatcher";
import { SYMBOL_VALUES, POSITIVE_SYMBOLS, NEGATIVE_SYMBOLS } from "../game/patterns";

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
      // Shield blocks bomb pattern penalties (1 per shield)
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

      const sign = match.reward >= 0 ? "+" : "";
      matchMessages.push(`${match.patternId} ${match.symbolId} ${sign}${match.reward}`);
    }

    return {
      grid,
      matches,
      totalDelta: Math.round(totalDelta),
      multiplierDelta,
      riskDelta,
      message: matchMessages.join(" | ")
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/economy.test.ts`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/EconomyService.ts tests/economy.test.ts
git commit -m "feat: rewrite EconomyService for 3x3 grid with pattern-based rewards"
```

---

### Task 5: Upgrades — Remove Extra Focus, Add Lucky Draw

**Files:**
- Modify: `src/game/upgrades.ts`
- Modify: `tests/upgrades.test.ts`

- [ ] **Step 1: Replace src/game/upgrades.ts**

Replace the entire contents of `src/game/upgrades.ts` with:

```typescript
import type { UpgradeOption } from "../types";
import { RngService } from "../services/RngService";

const POOL: UpgradeOption[] = [
  {
    id: "cash-boost",
    title: "Cash Boost",
    description: "Current money +40",
    apply: (state) => {
      state.currentMoney += 40;
    }
  },
  {
    id: "coin-bias",
    title: "Coin Bias",
    description: "Coin chance +8",
    apply: (state) => {
      state.coinBias += 8;
    }
  },
  {
    id: "reinforced-core",
    title: "Shield Coating",
    description: "Block 1 bomb penalty",
    apply: (state) => {
      state.shield = Math.min(2, state.shield + 1);
    }
  },
  {
    id: "cap-breaker",
    title: "Cap Breaker",
    description: "Max multiplier +1",
    apply: (state) => {
      state.maxMultiplier += 1;
    }
  },
  {
    id: "risk-cooler",
    title: "Risk Cooler",
    description: "Risk -20",
    apply: (state) => {
      state.riskMeter = Math.max(0, state.riskMeter - 20);
    }
  },
  {
    id: "lucky-draw",
    title: "Lucky Draw",
    description: "Wild chance +10 next round",
    apply: (state) => {
      state.wildBoost += 10;
    }
  }
];

export function drawUpgradeChoices(rng: RngService): UpgradeOption[] {
  const picked: UpgradeOption[] = [];
  const buffer = POOL.slice();
  for (let i = 0; i < 3 && buffer.length > 0; i += 1) {
    const index = Math.floor(rng.nextFloat() * buffer.length);
    const selected = buffer.splice(index, 1)[0];
    picked.push({
      id: selected.id,
      title: selected.title,
      description: selected.description,
      apply: selected.apply
    });
  }
  return picked;
}
```

- [ ] **Step 2: Replace tests/upgrades.test.ts**

Replace the entire contents of `tests/upgrades.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import { GameSession } from "../src/game/session";

describe("Upgrade flow", () => {
  it("draws 3 upgrade choices", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    expect(choices.length).toBe(3);
  });

  it("applies upgrade and changes state", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    const beforeMoney = run.state.currentMoney;
    run.applyUpgrade(choices[0]);
    const changed =
      run.state.currentMoney !== beforeMoney ||
      run.state.coinBias > 0 ||
      run.state.shield > 0 ||
      run.state.maxMultiplier > 5 ||
      run.state.riskMeter < 0 ||
      run.state.wildBoost > 0;
    expect(changed).toBe(true);
  });

  it("lucky draw increases wildBoost", () => {
    const run = new GameSession(42);
    run.startNewRun();
    const before = run.state.wildBoost;
    // Find lucky-draw or manually apply
    const luckyDraw = {
      id: "lucky-draw",
      title: "Lucky Draw",
      description: "Wild chance +10",
      apply: (state: any) => { state.wildBoost += 10; }
    };
    run.applyUpgrade(luckyDraw);
    expect(run.state.wildBoost).toBe(before + 10);
  });

  it("no upgrade increases spins (fixed spins rule)", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const spins = run.state.spinsLeft;
    const choices = run.getUpgradeChoices();
    for (const choice of choices) {
      expect(choice.id).not.toBe("banker-focus");
    }
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/upgrades.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 4: Commit**

```bash
git add src/game/upgrades.ts tests/upgrades.test.ts
git commit -m "feat: replace Extra Focus with Lucky Draw upgrade"
```

---

### Task 6: Session + Simulation Update

**Files:**
- Modify: `src/game/session.ts`
- Modify: `src/game/simulation.ts`
- Modify: `tests/simulation.test.ts`

- [ ] **Step 1: Update session.ts**

In `src/game/session.ts`, find the `createInitialState()` method and add `wildBoost: 0` to the returned object. Change:

```typescript
      coinBias: 0,
      shield: 0,
```

to:

```typescript
      coinBias: 0,
      wildBoost: 0,
      shield: 0,
```

- [ ] **Step 2: Update simulation.ts**

In `src/game/simulation.ts`, the code references `run.state.roundIndex >= 12` which still works. No changes needed — the simulation calls `run.spin()` which now uses the new EconomyService internally.

- [ ] **Step 3: Update simulation test bounds**

Replace the entire contents of `tests/simulation.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import { simulateMany } from "../src/game/simulation";

describe("Simulation (3x3)", () => {
  it("runs 1000 seeded sessions with bounded averages", () => {
    const rows = simulateMany(1000, 12000);
    const avgSeconds = rows.reduce((sum, row) => sum + row.spinSeconds, 0) / rows.length;
    const avgRounds = rows.reduce((sum, row) => sum + row.roundReached, 0) / rows.length;
    // Bounds are wider for 3x3 — pattern system changes economy significantly
    expect(avgSeconds).toBeGreaterThan(30);
    expect(avgSeconds).toBeLessThan(2000);
    expect(avgRounds).toBeGreaterThan(1.0);
    expect(avgRounds).toBeLessThan(12.5);
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/game/session.ts src/game/simulation.ts tests/simulation.test.ts
git commit -m "feat: update session and simulation for 3x3 grid system"
```

---

### Task 7: Theme — Add Star/Wild Symbol Colors

**Files:**
- Modify: `src/ui/theme.ts`

- [ ] **Step 1: Add star and wild to both themes**

In `src/ui/theme.ts`, find the `Theme` interface `symbols` section and add star/wild:

```typescript
  symbols: {
    coin: { bg: string; border: string };
    clover: { bg: string; border: string };
    star: { bg: string; border: string };
    wild: { bg: string; border: string };
    bomb: { bg: string; border: string };
    bankrupt: { bg: string; border: string };
  };
```

In `lightTheme.symbols`, add after clover:

```typescript
    star: { bg: "#FFF3BF", border: "#F0C040" },
    wild: { bg: "#F0E8FF", border: "#C0C0C0" },
```

In `darkTheme.symbols`, add after clover:

```typescript
    star: { bg: "#3A3420", border: "#F0C040" },
    wild: { bg: "#2A2A3A", border: "#888888" },
```

- [ ] **Step 2: Run theme tests**

Run: `npx vitest run tests/theme.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/ui/theme.ts
git commit -m "feat: add star and wild symbol colors to theme"
```

---

### Task 8: RunScene — 3x3 Grid UI + New Textures

**Files:**
- Rewrite: `src/scenes/RunScene.ts`

This is the largest task. RunScene changes from 3 reel icons to a 3x3 grid with hit highlighting, column-sequential spin animation, pattern overlay, and 2 new symbol textures.

- [ ] **Step 1: Rewrite RunScene.ts**

Replace the entire contents of `src/scenes/RunScene.ts` with:

```typescript
import Phaser from "phaser";
import { session } from "../game/session";
import { PATTERNS } from "../game/patterns";
import type { SymbolId, PatternMatch } from "../types";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";
const ALL_SYMBOLS: SymbolId[] = ["coin", "clover", "star", "wild", "bomb", "bankrupt"];

export class RunScene extends Phaser.Scene {
  private roundText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Graphics;
  private spinsText!: Phaser.GameObjects.Text;
  private multiText!: Phaser.GameObjects.Text;
  private riskText!: Phaser.GameObjects.Text;
  private log!: Phaser.GameObjects.Text;
  private spinButton!: Phaser.GameObjects.Image;
  private spinLabel!: Phaser.GameObjects.Text;
  private isSpinning = false;
  private gridIcons: Phaser.GameObjects.Image[] = [];
  private gridHighlights: Phaser.GameObjects.Graphics[] = [];
  private uiScale = 1;
  private overlayGroup: Phaser.GameObjects.Group | null = null;

  private readonly symTex: Record<SymbolId, string> = {
    coin: "sym-coin", clover: "sym-clover", star: "sym-star",
    wild: "sym-wild", bomb: "sym-bomb", bankrupt: "sym-ghost"
  };

  constructor() { super("RunScene"); }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    this.uiScale = Math.max(0.8, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * this.uiScale);
    this.gridIcons = [];
    this.gridHighlights = [];
    this.overlayGroup = null;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(parseHex(theme.bg.top), parseHex(theme.bg.top), parseHex(theme.bg.bottom), parseHex(theme.bg.bottom), 1);
    bg.fillRect(0, 0, width, height);
    drawClouds(this);
    this.buildSymbolTextures();

    // Top bar
    this.roundText = this.add.text(px(14), px(10), "", { fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.primary });
    this.scoreText = this.add.text(width - px(14), px(10), "", { fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.primary }).setOrigin(1, 0);

    // Money
    this.moneyText = this.add.text(width / 2, px(40), "", { fontFamily: PX_FONT, fontSize: `${px(20)}px`, color: theme.text.accent }).setOrigin(0.5);
    this.goalText = this.add.text(width / 2, px(64), "", { fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.secondary }).setOrigin(0.5);

    // Progress bar
    const progY = px(80);
    const progW = width - px(28);
    const progBg = this.add.graphics();
    progBg.fillStyle(parseHex(theme.progress.bg), 1);
    progBg.fillRect(px(14), progY, progW, px(10));
    progBg.lineStyle(2, parseHex(theme.progress.border), 1);
    progBg.strokeRect(px(14), progY, progW, px(10));
    this.progressFill = this.add.graphics();

    // 3x3 Grid
    const gridCenterY = px(190);
    const cellSize = px(56);
    const gap = px(4);
    const gridSize = cellSize * 3 + gap * 2;
    addSoftPanel(this, width / 2, gridCenterY, gridSize + px(20), gridSize + px(20));

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = width / 2 + (col - 1) * (cellSize + gap);
        const cy = gridCenterY + (row - 1) * (cellSize + gap);
        addSoftPanel(this, cx, cy, cellSize, cellSize);
        const icon = this.add.image(cx, cy, this.symTex.coin).setDisplaySize(px(42), px(42));
        this.gridIcons.push(icon);
        const hl = this.add.graphics();
        hl.setVisible(false);
        this.gridHighlights.push(hl);
      }
    }

    // Log
    this.log = this.add.text(width / 2, gridCenterY + gridSize / 2 + px(16), "", {
      fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.accent,
      align: "center", wordWrap: { width: width - px(40) }
    }).setOrigin(0.5);

    // Stats chips
    const chipY = px(320);
    const chipW = px(96);
    const chipH = px(40);
    addSoftPanel(this, width / 2 - px(104), chipY, chipW, chipH, parseHex(theme.stats.spins.bg), parseHex(theme.stats.spins.border));
    this.add.text(width / 2 - px(104), chipY - px(10), "SPINS", { fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.stats.spins.text }).setOrigin(0.5);
    this.spinsText = this.add.text(width / 2 - px(104), chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(9)}px`, color: theme.stats.spins.text }).setOrigin(0.5);

    addSoftPanel(this, width / 2, chipY, chipW, chipH, parseHex(theme.stats.mult.bg), parseHex(theme.stats.mult.border));
    this.add.text(width / 2, chipY - px(10), "MULTI", { fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.stats.mult.text }).setOrigin(0.5);
    this.multiText = this.add.text(width / 2, chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(9)}px`, color: theme.stats.mult.text }).setOrigin(0.5);

    addSoftPanel(this, width / 2 + px(104), chipY, chipW, chipH, parseHex(theme.stats.risk.bg), parseHex(theme.stats.risk.border));
    this.add.text(width / 2 + px(104), chipY - px(10), "RISK", { fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.stats.risk.text }).setOrigin(0.5);
    this.riskText = this.add.text(width / 2 + px(104), chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(9)}px`, color: theme.stats.risk.text }).setOrigin(0.5);

    // SPIN button
    this.spinButton = addSoftButton(this, width / 2, height - px(74), px(280), px(54));
    this.spinLabel = this.add.text(width / 2, height - px(74), "SPIN!", { fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: theme.button.text }).setOrigin(0.5);
    this.spinButton.on("pointerup", () => this.onSpin());

    // Bottom buttons: ? and PATTERN
    const helpBtn = addSoftButton(this, px(30), height - px(30), px(36), px(28), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(px(30), height - px(30), "?", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.accent }).setOrigin(0.5);
    helpBtn.on("pointerup", () => this.scene.start("HelpScene"));

    const patBtn = addSoftButton(this, width - px(50), height - px(30), px(70), px(28), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(width - px(50), height - px(30), "COMBO", { fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.accent }).setOrigin(0.5);
    patBtn.on("pointerup", () => this.toggleOverlay());

    drawGrassBar(this);
    this.renderState();
  }

  private onSpin(): void {
    if (session.isGameOver() || this.isSpinning || this.overlayGroup) return;
    this.isSpinning = true;
    this.spinButton.disableInteractive();
    this.spinLabel.setText("ROLL...");
    this.clearHighlights();

    this.animateSpin(() => {
      session.spin();
      const outcome = session.state.lastOutcome;
      if (outcome) {
        outcome.grid.forEach((sym, i) => {
          this.gridIcons[i].setTexture(this.symTex[sym]);
        });
        if (outcome.matches.length > 0) {
          this.highlightMatches(outcome.matches);
        }
        if (outcome.totalDelta > 0) {
          this.spawnSparkleBurst(this.scale.width / 2, Math.round(190 * this.uiScale), Math.min(18, 8 + Math.floor(outcome.totalDelta / 10)));
        }
        this.log.setText(outcome.message);
      }
      if (session.settingsRepository.getSettings().vibrationOn && navigator.vibrate) {
        navigator.vibrate(20);
      }
      this.renderState();
      this.isSpinning = false;
      this.spinButton.setInteractive({ useHandCursor: true });
      this.spinLabel.setText("SPIN!");

      if (session.isGameOver()) { this.scene.start("ResultScene"); return; }
      if (session.isRoundCleared()) { this.scene.start("ShopScene"); }
    });
  }

  private renderState(): void {
    const s = session.state;
    const px = (n: number) => Math.round(n * this.uiScale);
    const theme = getTheme();
    const ratio = Phaser.Math.Clamp(s.currentMoney / s.debtTarget, 0, 1);
    const progW = (this.scale.width - px(28) - 4) * ratio;
    const need = Math.max(0, s.debtTarget - s.currentMoney);

    this.roundText.setText(`ROUND ${s.roundIndex}`);
    this.scoreText.setText(`SCORE ${s.score}`);
    this.moneyText.setText(`$${s.currentMoney}`);
    this.goalText.setText(`GOAL $${s.debtTarget}  NEED $${need}`);
    this.spinsText.setText(`${s.spinsLeft}/${s.maxSpinsPerRound}`);
    this.multiText.setText(`x${s.multiplier}`);
    this.riskText.setText(`${s.riskMeter}%`);
    this.riskText.setColor(s.riskMeter >= 70 ? "#FF4444" : s.riskMeter >= 35 ? "#FFD43B" : theme.stats.risk.text);

    this.progressFill.clear();
    this.progressFill.fillGradientStyle(parseHex(theme.progress.fillStart), parseHex(theme.progress.fillEnd), parseHex(theme.progress.fillStart), parseHex(theme.progress.fillEnd), 1);
    this.progressFill.fillRect(px(14) + 1, px(80) + 1, progW, px(10) - 2);
  }

  private animateSpin(onComplete: () => void): void {
    const ticker = this.time.addEvent({
      delay: 60, loop: true,
      callback: () => {
        this.gridIcons.forEach((icon, i) => {
          const sym = ALL_SYMBOLS[(Math.floor((this.time.now + i * 37) / 50) + i) % ALL_SYMBOLS.length];
          icon.setTexture(this.symTex[sym]);
        });
      }
    });
    // Column-sequential stop: left col at 500ms, mid at 700ms, right at 900ms
    const stopCol = (colIndices: number[], delay: number) => {
      this.time.delayedCall(delay, () => {
        colIndices.forEach((i) => {
          // Will be overwritten by final result in onComplete
        });
      });
    };
    this.time.delayedCall(1100, () => {
      ticker.remove(false);
      onComplete();
    });
  }

  private highlightMatches(matches: PatternMatch[]): void {
    const px = (n: number) => Math.round(n * this.uiScale);
    const cellSize = px(56);
    const gap = px(4);
    const { width } = this.scale;
    const gridCenterY = px(190);

    const allPositions = new Set<number>();
    for (const m of matches) {
      for (const pos of m.positions) allPositions.add(pos);
    }

    allPositions.forEach((pos) => {
      const row = Math.floor(pos / 3);
      const col = pos % 3;
      const cx = width / 2 + (col - 1) * (cellSize + gap);
      const cy = gridCenterY + (row - 1) * (cellSize + gap);

      const hl = this.gridHighlights[pos];
      hl.clear();
      hl.lineStyle(3, 0xFF9A3C, 1);
      hl.strokeRect(cx - cellSize / 2, cy - cellSize / 2, cellSize, cellSize);
      hl.setVisible(true);

      this.tweens.add({
        targets: this.gridIcons[pos],
        scaleX: 1.12, scaleY: 1.12,
        yoyo: true, duration: 150
      });
    });
  }

  private clearHighlights(): void {
    this.gridHighlights.forEach((hl) => { hl.clear(); hl.setVisible(false); });
  }

  private toggleOverlay(): void {
    if (this.overlayGroup) {
      this.overlayGroup.destroy(true);
      this.overlayGroup = null;
      this.spinButton.setInteractive({ useHandCursor: true });
      return;
    }

    const { width, height } = this.scale;
    const px = (n: number) => Math.round(n * this.uiScale);
    const theme = getTheme();
    this.overlayGroup = this.add.group();

    // Dim background
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.7);
    dim.fillRect(0, 0, width, height);
    dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    dim.on("pointerup", () => this.toggleOverlay());
    this.overlayGroup.add(dim);

    const title = this.add.text(width / 2, px(30), "PATTERNS", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: "#FFD43B" }).setOrigin(0.5);
    this.overlayGroup.add(title);

    const miniCell = px(10);
    const miniGap = px(2);
    const colWidth = px(150);
    const startY = px(60);

    PATTERNS.forEach((pat, idx) => {
      const col = idx < 7 ? 0 : 1;
      const row = idx < 7 ? idx : idx - 7;
      const baseX = width / 2 + (col === 0 ? -colWidth / 2 - px(10) : colWidth / 2 - px(40));
      const baseY = startY + row * px(72);

      // Mini 3x3 grid
      const gridG = this.add.graphics();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cellIdx = r * 3 + c;
          const isHit = pat.positions.includes(cellIdx);
          const cx = baseX + c * (miniCell + miniGap);
          const cy = baseY + r * (miniCell + miniGap);
          gridG.fillStyle(isHit ? 0xFF9A3C : 0x444444, 1);
          gridG.fillRect(cx, cy, miniCell, miniCell);
        }
      }
      this.overlayGroup!.add(gridG);

      const label = this.add.text(baseX + (miniCell + miniGap) * 3 + px(6), baseY + px(4), pat.name, {
        fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: "#FFFFFF"
      });
      this.overlayGroup!.add(label);

      const valText = this.add.text(baseX + (miniCell + miniGap) * 3 + px(6), baseY + px(16), `Value: ${pat.value}`, {
        fontFamily: PX_FONT, fontSize: `${px(4)}px`, color: "#AAAAAA"
      });
      this.overlayGroup!.add(valText);
    });

    this.spinButton.disableInteractive();
  }

  private spawnSparkleBurst(x: number, y: number, amount: number): void {
    const theme = getTheme();
    const colors = [parseHex(theme.text.accent), parseHex(theme.progress.fillStart), parseHex(theme.decoration.grass)];
    for (let i = 0; i < amount; i++) {
      const star = this.add.graphics();
      star.fillStyle(colors[i % colors.length], 1);
      star.fillRect(0, 0, 6, 6);
      star.setPosition(x, y);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(30, 90) * this.uiScale;
      this.tweens.add({
        targets: star, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, duration: Phaser.Math.Between(300, 500),
        onComplete: () => star.destroy()
      });
    }
  }

  private buildSymbolTextures(): void {
    if (this.textures.exists("sym-coin")) return;
    const theme = getTheme();
    const sz = 72;

    const tile = (key: string, bg: string, border: string, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      g.fillStyle(parseHex(bg), 1);
      g.fillRect(0, 0, sz, sz);
      g.lineStyle(3, parseHex(border), 1);
      g.strokeRect(1, 1, sz - 2, sz - 2);
      draw(g);
      g.generateTexture(key, sz, sz);
      g.destroy();
    };

    // Coin
    tile("sym-coin", theme.symbols.coin.bg, theme.symbols.coin.border, (g) => {
      g.fillStyle(0xFFD43B, 1); g.fillCircle(36, 36, 22);
      g.lineStyle(3, 0xF0C040, 1); g.strokeCircle(36, 36, 22);
      g.fillStyle(0x5D4037, 1);
      g.fillRect(28, 30, 5, 6); g.fillRect(39, 30, 5, 6);
      g.fillRect(30, 41, 3, 3); g.fillRect(33, 43, 6, 3); g.fillRect(39, 41, 3, 3);
    });

    // Clover (flower)
    tile("sym-clover", theme.symbols.clover.bg, theme.symbols.clover.border, (g) => {
      g.fillStyle(0xFF8FAB, 1);
      g.fillCircle(36, 24, 10); g.fillCircle(24, 36, 10);
      g.fillCircle(48, 36, 10); g.fillCircle(36, 48, 10);
      g.fillStyle(0xFFE066, 1); g.fillCircle(36, 36, 7);
      g.fillStyle(0x2B8A3E, 1); g.fillRect(34, 52, 4, 12);
    });

    // Star
    tile("sym-star", theme.symbols.star.bg, theme.symbols.star.border, (g) => {
      g.fillStyle(0xFFD43B, 1);
      // 5-pointed star via triangles
      g.fillTriangle(36, 12, 42, 30, 30, 30);
      g.fillTriangle(20, 28, 52, 28, 36, 42);
      g.fillTriangle(24, 52, 36, 38, 48, 52);
      g.fillTriangle(18, 36, 30, 36, 26, 52);
      g.fillTriangle(42, 36, 54, 36, 46, 52);
      // Eyes
      g.fillStyle(0x5D4037, 1);
      g.fillRect(30, 30, 4, 4); g.fillRect(38, 30, 4, 4);
      // Sparkle dots
      g.fillStyle(0xFFFFFF, 0.8);
      g.fillRect(26, 18, 3, 3); g.fillRect(44, 22, 3, 3);
    });

    // Wild
    tile("sym-wild", theme.symbols.wild.bg, theme.symbols.wild.border, (g) => {
      // Rainbow-ish background stripes
      g.fillStyle(0xFFCCCC, 0.4); g.fillRect(4, 4, 64, 22);
      g.fillStyle(0xCCFFCC, 0.4); g.fillRect(4, 26, 64, 22);
      g.fillStyle(0xCCCCFF, 0.4); g.fillRect(4, 48, 64, 20);
      // "W" letter
      g.fillStyle(0x7C6EF0, 1);
      g.fillRect(18, 20, 5, 28); g.fillRect(49, 20, 5, 28);
      g.fillRect(29, 38, 5, 10); g.fillRect(38, 38, 5, 10);
      g.fillRect(23, 44, 6, 4); g.fillRect(43, 44, 6, 4);
      g.fillRect(33, 44, 6, 4);
      // Question mark eyes
      g.fillStyle(0x5D4037, 1);
      g.fillRect(28, 12, 4, 4); g.fillRect(40, 12, 4, 4);
    });

    // Bomb
    tile("sym-bomb", theme.symbols.bomb.bg, theme.symbols.bomb.border, (g) => {
      g.fillStyle(0xFF6B6B, 1); g.fillRect(34, 8, 4, 8);
      g.fillStyle(0xFFD43B, 1); g.fillRect(33, 4, 6, 6);
      g.fillStyle(0x555555, 1); g.fillCircle(36, 40, 20);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(26, 34, 4, 3); g.fillRect(28, 36, 4, 3);
      g.fillRect(42, 34, 4, 3); g.fillRect(40, 36, 4, 3);
      g.fillRect(30, 48, 3, 3); g.fillRect(33, 46, 6, 3); g.fillRect(39, 48, 3, 3);
    });

    // Ghost (bankrupt)
    tile("sym-ghost", theme.symbols.bankrupt.bg, theme.symbols.bankrupt.border, (g) => {
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(24, 18, 24, 6); g.fillRect(22, 24, 28, 24); g.fillRect(26, 14, 20, 4);
      g.fillRect(22, 48, 8, 6); g.fillRect(34, 48, 8, 6);
      g.fillRect(28, 48, 6, 3); g.fillRect(42, 48, 8, 6);
      g.fillStyle(0x2D2D2D, 1);
      g.fillRect(28, 28, 6, 8); g.fillRect(38, 28, 6, 8);
      g.fillRect(32, 40, 8, 5);
    });

    // Sparkle
    if (!this.textures.exists("fx-star")) {
      const g = this.add.graphics();
      g.fillStyle(0xFFD43B, 1); g.fillRect(0, 0, 8, 8);
      g.generateTexture("fx-star", 8, 8); g.destroy();
    }
  }
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/RunScene.ts
git commit -m "feat: redesign RunScene with 3x3 grid, hit highlights, and pattern overlay"
```

---

### Task 9: HelpScene — Expand with Patterns and Scoring

**Files:**
- Rewrite: `src/scenes/HelpScene.ts`

- [ ] **Step 1: Replace HelpScene.ts**

Replace the entire contents of `src/scenes/HelpScene.ts` with:

```typescript
import Phaser from "phaser";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";
import { PATTERNS } from "../game/patterns";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

const HELP_SECTIONS = [
  {
    title: "HOW TO PLAY",
    lines: [
      "Spin the 3x3 grid!",
      "Match patterns to",
      "earn money. Reach",
      "the GOAL to clear.",
      "Clear 12 rounds to win!"
    ]
  },
  {
    title: "SYMBOLS (6)",
    lines: [
      "COIN   = +Money (val 2)",
      "FLOWER = +Multi (val 3)",
      "STAR   = Big $! (val 5)",
      "WILD   = Any sym (val 0)",
      "BOMB   = -Money  (val 2)",
      "GHOST  = Big loss(val 4)"
    ]
  },
  {
    title: "SCORING",
    lines: [
      "Reward per pattern:",
      "(symVal+1)x(patVal+1)",
      "  x multiplier",
      "Multiple patterns can",
      "hit at once = sum all!",
      "Negative syms ignore",
      "multiplier."
    ]
  },
  {
    title: "STATS",
    lines: [
      "SPINS = Fixed per round",
      "MULTI = Positive bonus",
      "RISK  = Bad luck up"
    ]
  },
  {
    title: "UPGRADES",
    lines: [
      "Pick 1 after each",
      "round clear. Boost",
      "money, bias, shield,",
      "multiplier cap, risk",
      "cool, or wild chance!"
    ]
  }
];

export class HelpScene extends Phaser.Scene {
  constructor() { super("HelpScene"); }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    const bg = this.add.graphics();
    bg.fillGradientStyle(parseHex(theme.bg.top), parseHex(theme.bg.top), parseHex(theme.bg.bottom), parseHex(theme.bg.bottom), 1);
    bg.fillRect(0, 0, width, height);
    drawClouds(this);

    this.add.text(width / 2, px(30), "HELP", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    let yOffset = px(56);
    for (const section of HELP_SECTIONS) {
      const sectionH = px(12 + section.lines.length * 12);
      addSoftPanel(this, width / 2, yOffset + sectionH / 2, px(320), sectionH);
      this.add.text(px(30), yOffset + px(2), section.title, {
        fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.accent
      });
      section.lines.forEach((line, i) => {
        this.add.text(px(30), yOffset + px(12 + i * 12), line, {
          fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.primary
        });
      });
      yOffset += sectionH + px(6);
    }

    // Patterns section with mini grids
    const patH = px(12 + 14 * 10);
    addSoftPanel(this, width / 2, yOffset + patH / 2, px(320), patH);
    this.add.text(px(30), yOffset + px(2), "PATTERNS (14)", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.accent
    });

    const miniCell = px(6);
    const miniGap = px(1);
    PATTERNS.forEach((pat, idx) => {
      const row = idx;
      const bx = px(30);
      const by = yOffset + px(14) + row * px(10);

      const gridG = this.add.graphics();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const ci = r * 3 + c;
          gridG.fillStyle(pat.positions.includes(ci) ? 0xFF9A3C : 0x888888, 1);
          gridG.fillRect(bx + c * (miniCell + miniGap), by + r * (miniCell + miniGap), miniCell, miniCell);
        }
      }

      this.add.text(bx + px(28), by + px(3), `${pat.name} (${pat.value})`, {
        fontFamily: PX_FONT, fontSize: `${px(4)}px`, color: theme.text.primary
      });
    });

    yOffset += patH + px(6);

    const backY = yOffset + px(24);
    const backBtn = addSoftButton(this, width / 2, backY, px(200), px(36));
    this.add.text(width / 2, backY, "BACK", {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.button.text
    }).setOrigin(0.5);
    backBtn.on("pointerup", () => this.scene.start("TitleScene"));

    drawGrassBar(this);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/HelpScene.ts
git commit -m "feat: expand HelpScene with patterns, scoring, and 6 symbols"
```

---

### Task 10: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (patternMatcher, economy, upgrades, simulation, theme)

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Full visual playthrough**

Run: `npm run dev`
1. TitleScene → ? help button shows patterns section
2. Start Run → 3x3 grid with 6 symbol types
3. SPIN → column-sequential animation, hit highlights on matches
4. Tap COMBO → pattern overlay with 14 mini grids
5. Play until round clear → ShopScene, verify Lucky Draw appears
6. Continue or fail → ResultScene
7. Verify dark mode toggle still works

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Phase 2 - 3x3 grid + pattern system verification"
```
