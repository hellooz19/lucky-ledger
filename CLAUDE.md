# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lucky Ledger — a mobile web (portrait, 360x640 base) casual slot roguelite built with Phaser 3 and TypeScript. Players spin slots to clear debt targets across progressive rounds, selecting upgrades between rounds. Runs end at round 12 (win) or when spins are exhausted (loss).

## Commands

```bash
npm run dev        # Vite dev server on port 5173
npm run build      # tsc --noEmit + Vite production build to /dist
npm run preview    # Preview production build
npm run test       # Vitest (all tests)
npx vitest run tests/economy.test.ts  # Run a single test file
```

No linter is configured.

## Architecture

**Scene flow:** TitleScene → RunScene (spin loop) → ShopScene (upgrade pick) → RunScene (next round) or ResultScene (game over)

**Key layers:**

- `src/game/` — Core logic decoupled from Phaser. `GameSession` orchestrates run state; `EconomyService` handles spin outcomes and symbol weights; `RngService` provides deterministic Xorshift32 RNG seeded by `Date.now()`.
- `src/scenes/` — Phaser scenes (Title, Run, Shop, Result). Scenes read/write through the shared `session` singleton.
- `src/services/` — Persistence via `localStorage` (LeaderboardRepository for top-50 scores, SettingsRepository for sound/vibration toggles).
- `src/ui/softUi.ts` — Reusable Phaser graphics helpers for soft-shadow panels and buttons.
- `src/types.ts` — All shared TypeScript interfaces (symbols, upgrades, game state).

**State model:** A single `GameSession` instance holds mutable run state. Economy mutations flow through `EconomyService.applySpin()` which adjusts coins based on symbol weights influenced by `coinBias` and `riskMeter`.

**Upgrade system:** Pool of 6 upgrade types in `upgrades.ts`, 3 randomly drawn per shop visit. Upgrades modify session state (spins, bias, shield, multiplier cap, risk cooling).

## Testing

Tests live in `tests/` and use Vitest with a setup file (`tests/setup.ts`) that mocks `localStorage`. Tests cover economy outcomes, upgrade application, and a simulation harness (`simulation.test.ts`) that validates 1000 seeded runs stay within expected bounds.

## Notes

- The game targets Korean users (`lang="ko"` in index.html).
- The canvas is notch-aware with safe area insets.
- All randomness is deterministic via seeded RNG — important for reproducible tests and simulations.
