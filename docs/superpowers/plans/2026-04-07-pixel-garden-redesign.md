# Pixel Garden UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Lucky Ledger's dark purple/pink visual theme with a bright, cute "Pixel Garden" pixel-art style across all 4 scenes, with light/dark theme support.

**Architecture:** Introduce a theme system (`src/ui/theme.ts`) with light/dark color objects. Update `softUi.ts` to use pixel-style rendering with theme colors. Rebuild each scene's layout using the new theme, with RunScene using Layout A (reel + money focus). All symbol textures get redrawn in pixel-art style. No game logic changes.

**Tech Stack:** TypeScript, Phaser 3, Google Fonts (Press Start 2P), Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/ui/theme.ts` | Create | Theme interface, light/dark theme objects, get/set/init |
| `src/ui/pixelDeco.ts` | Create | Pixel cloud and grass decoration drawing helpers |
| `src/types.ts` | Modify (line 30-33) | Add `themeMode` to `GameSettings` |
| `src/services/SettingsRepository.ts` | Modify (line 6, 24) | Persist `themeMode` |
| `src/ui/softUi.ts` | Rewrite | Pixel-style panels/buttons using theme colors |
| `index.html` | Modify (line 5) | Add Google Fonts link |
| `src/styles.css` | Rewrite | Replace purple gradient with Pixel Garden colors |
| `src/main.ts` | Modify (line 11-15) | Font preload, pixelArt rendering flag |
| `src/scenes/RunScene.ts` | Rewrite | Layout A + new symbol textures |
| `src/scenes/TitleScene.ts` | Rewrite | Pixel Garden title screen + dark mode toggle |
| `src/scenes/ShopScene.ts` | Rewrite | Pixel-style upgrade cards |
| `src/scenes/ResultScene.ts` | Rewrite | Pixel-style result screen |
| `tests/theme.test.ts` | Create | Theme system unit tests |

---

### Task 1: Theme System

**Files:**
- Create: `src/ui/theme.ts`
- Create: `tests/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/theme.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { getTheme, setTheme, lightTheme, darkTheme, parseHex } from "../src/ui/theme";
import type { Theme } from "../src/ui/theme";

describe("Theme System", () => {
  it("returns light theme by default", () => {
    setTheme("light");
    const theme = getTheme();
    expect(theme).toBe(lightTheme);
    expect(theme.bg.top).toBe("#D4F5FF");
  });

  it("switches to dark theme", () => {
    setTheme("dark");
    const theme = getTheme();
    expect(theme).toBe(darkTheme);
    expect(theme.bg.top).toBe("#1A2332");
  });

  it("both themes have all required keys", () => {
    const requiredKeys: (keyof Theme)[] = [
      "bg", "panel", "button", "text", "progress",
      "stats", "symbols", "decoration"
    ];
    for (const key of requiredKeys) {
      expect(lightTheme).toHaveProperty(key);
      expect(darkTheme).toHaveProperty(key);
    }
  });

  it("parseHex converts hex strings to Phaser-compatible numbers", () => {
    expect(parseHex("#FF9A3C")).toBe(0xFF9A3C);
    expect(parseHex("#1A2332")).toBe(0x1A2332);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/theme.test.ts`
Expected: FAIL — module `../src/ui/theme` does not exist

- [ ] **Step 3: Write the theme module**

Create `src/ui/theme.ts`:

```typescript
export interface Theme {
  bg: { top: string; bottom: string };
  panel: { fill: string; border: string };
  button: { fill: string; border: string; shadow: string; text: string };
  text: { primary: string; secondary: string; accent: string };
  progress: { bg: string; border: string; fillStart: string; fillEnd: string };
  stats: {
    spins: { bg: string; border: string; text: string };
    mult: { bg: string; border: string; text: string };
    risk: { bg: string; border: string; text: string };
  };
  symbols: {
    coin: { bg: string; border: string };
    clover: { bg: string; border: string };
    bomb: { bg: string; border: string };
    bankrupt: { bg: string; border: string };
  };
  decoration: { cloud: string; grass: string };
}

export const lightTheme: Theme = {
  bg: { top: "#D4F5FF", bottom: "#E8FFF0" },
  panel: { fill: "#FFFFF0", border: "#7BC67E" },
  button: { fill: "#FF9A3C", border: "#FFB86C", shadow: "#D47A1C", text: "#FFFFFF" },
  text: { primary: "#1A2332", secondary: "#888888", accent: "#FF9A3C" },
  progress: { bg: "#D4F0D4", border: "#7BC67E", fillStart: "#FFD43B", fillEnd: "#FF9A3C" },
  stats: {
    spins: { bg: "#FFF3BF", border: "#F0C040", text: "#8B6914" },
    mult: { bg: "#D4F0D4", border: "#7BC67E", text: "#2B8A3E" },
    risk: { bg: "#FFE8E8", border: "#FFA0A0", text: "#E03131" },
  },
  symbols: {
    coin: { bg: "#FFF8DC", border: "#F0C040" },
    clover: { bg: "#F0FFF0", border: "#7BC67E" },
    bomb: { bg: "#FFF0F0", border: "#FFA0A0" },
    bankrupt: { bg: "#F3E8FF", border: "#C9A0FF" },
  },
  decoration: { cloud: "#FFFFFF", grass: "#7BC67E" },
};

export const darkTheme: Theme = {
  bg: { top: "#1A2332", bottom: "#1E2A3A" },
  panel: { fill: "#2A3442", border: "#5CAD78" },
  button: { fill: "#FF9A3C", border: "#FFB86C", shadow: "#D47A1C", text: "#FFFFFF" },
  text: { primary: "#E8F0E8", secondary: "#8899AA", accent: "#FF9A3C" },
  progress: { bg: "#1E3328", border: "#5CAD78", fillStart: "#FFD43B", fillEnd: "#FF9A3C" },
  stats: {
    spins: { bg: "#3A3420", border: "#F0C040", text: "#FFD43B" },
    mult: { bg: "#1E3328", border: "#5CAD78", text: "#69DB7C" },
    risk: { bg: "#3A2020", border: "#FFA0A0", text: "#FF6B6B" },
  },
  symbols: {
    coin: { bg: "#3A3420", border: "#F0C040" },
    clover: { bg: "#1E3328", border: "#7BC67E" },
    bomb: { bg: "#3A2020", border: "#FFA0A0" },
    bankrupt: { bg: "#2A2040", border: "#C9A0FF" },
  },
  decoration: { cloud: "#FFFFFF", grass: "#5CAD78" },
};

let current: Theme = lightTheme;

export function getTheme(): Theme {
  return current;
}

export function setTheme(mode: "light" | "dark"): void {
  current = mode === "dark" ? darkTheme : lightTheme;
}

export function parseHex(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/ui/theme.ts tests/theme.test.ts
git commit -m "feat: add theme system with light/dark Pixel Garden themes"
```

---

### Task 2: Settings — Persist themeMode

**Files:**
- Modify: `src/types.ts` (lines 30-33)
- Modify: `src/services/SettingsRepository.ts` (lines 6, 22-27)

- [ ] **Step 1: Add themeMode to GameSettings interface**

In `src/types.ts`, change:

```typescript
export interface GameSettings {
  soundOn: boolean;
  vibrationOn: boolean;
}
```

to:

```typescript
export interface GameSettings {
  soundOn: boolean;
  vibrationOn: boolean;
  themeMode: "light" | "dark";
}
```

- [ ] **Step 2: Update SettingsRepository defaults and parsing**

In `src/services/SettingsRepository.ts`, change:

```typescript
const DEFAULT_SETTINGS: GameSettings = {
  soundOn: true,
  vibrationOn: true
};
```

to:

```typescript
const DEFAULT_SETTINGS: GameSettings = {
  soundOn: true,
  vibrationOn: true,
  themeMode: "light"
};
```

In the same file, change the `getSettings` return inside the try block:

```typescript
      return {
        soundOn: parsed.soundOn ?? DEFAULT_SETTINGS.soundOn,
        vibrationOn: parsed.vibrationOn ?? DEFAULT_SETTINGS.vibrationOn
      };
```

to:

```typescript
      return {
        soundOn: parsed.soundOn ?? DEFAULT_SETTINGS.soundOn,
        vibrationOn: parsed.vibrationOn ?? DEFAULT_SETTINGS.vibrationOn,
        themeMode: parsed.themeMode === "dark" ? "dark" : "light"
      };
```

- [ ] **Step 3: Run all tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All existing tests pass

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/services/SettingsRepository.ts
git commit -m "feat: add themeMode to GameSettings for dark mode persistence"
```

---

### Task 3: Pixel-Style softUi.ts

**Files:**
- Rewrite: `src/ui/softUi.ts`

- [ ] **Step 1: Rewrite softUi.ts with pixel-style rendering**

Replace the entire contents of `src/ui/softUi.ts` with:

```typescript
import Phaser from "phaser";
import { getTheme, parseHex } from "./theme";

function textureKey(prefix: string, w: number, h: number, fill: number, border: number): string {
  return `${prefix}-${w}x${h}-${fill.toString(16)}-${border.toString(16)}`;
}

export function addSoftPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: number,
  border?: number
): Phaser.GameObjects.Image {
  const theme = getTheme();
  const f = fill ?? parseHex(theme.panel.fill);
  const b = border ?? parseHex(theme.panel.border);
  const key = textureKey("pixel-panel", w, h, f, b);

  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    // Solid fill — no rounded corners for pixel look
    g.fillStyle(f, 1);
    g.fillRect(0, 0, w, h);
    // Border
    g.lineStyle(3, b, 1);
    g.strokeRect(1, 1, w - 2, h - 2);
    // Drop shadow (bottom + right, 3px)
    g.fillStyle(0x000000, 0.18);
    g.fillRect(3, h, w, 3);
    g.fillRect(w, 3, 3, h);
    g.generateTexture(key, w + 3, h + 3);
    g.destroy();
  }
  return scene.add.image(x, y, key);
}

export function addSoftButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: number,
  border?: number
): Phaser.GameObjects.Image {
  const theme = getTheme();
  const f = fill ?? parseHex(theme.button.fill);
  const b = border ?? parseHex(theme.button.border);
  const shadowColor = parseHex(theme.button.shadow);
  const key = textureKey("pixel-btn", w, h, f, b);

  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    // Drop shadow
    g.fillStyle(shadowColor, 1);
    g.fillRect(4, 4, w, h);
    // Button body
    g.fillStyle(f, 1);
    g.fillRect(0, 0, w, h);
    // Border
    g.lineStyle(3, b, 1);
    g.strokeRect(1, 1, w - 2, h - 2);
    g.generateTexture(key, w + 4, h + 4);
    g.destroy();
  }

  const button = scene.add.image(x, y, key).setInteractive({ useHandCursor: true });
  button.on("pointerdown", () => button.setScale(0.96));
  button.on("pointerup", () => button.setScale(1));
  button.on("pointerout", () => button.setScale(1));
  return button;
}
```

- [ ] **Step 2: Run all tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All existing tests pass (tests don't import softUi)

- [ ] **Step 3: Commit**

```bash
git add src/ui/softUi.ts
git commit -m "feat: rewrite softUi with pixel-style panels and theme support"
```

---

### Task 4: Pixel Decorations Helper

**Files:**
- Create: `src/ui/pixelDeco.ts`

- [ ] **Step 1: Create pixel decoration helpers**

Create `src/ui/pixelDeco.ts`:

```typescript
import Phaser from "phaser";
import { getTheme, parseHex } from "./theme";

/**
 * Draw pixel-style clouds at the top of a scene.
 * Each cloud is a cluster of rectangles.
 */
export function drawClouds(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const theme = getTheme();
  const color = parseHex(theme.decoration.cloud);
  const g = scene.add.graphics();

  const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
    g.fillStyle(color, alpha);
    const s = scale;
    // Cloud body: overlapping rectangles
    g.fillRect(cx, cy, 24 * s, 8 * s);
    g.fillRect(cx + 4 * s, cy - 6 * s, 16 * s, 6 * s);
    g.fillRect(cx + 8 * s, cy - 10 * s, 8 * s, 4 * s);
  };

  drawCloud(20, 14, 1.0, 0.55);
  drawCloud(120, 8, 0.7, 0.35);
  drawCloud(260, 18, 0.85, 0.45);

  return g;
}

/**
 * Draw a pixel grass bar at the bottom of a scene.
 */
export function drawGrassBar(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const { width, height } = scene.scale;
  const theme = getTheme();
  const color = parseHex(theme.decoration.grass);
  const g = scene.add.graphics();

  // Solid grass strip
  g.fillStyle(color, 1);
  g.fillRect(0, height - 10, width, 10);

  // Grass blades sticking up
  const darkGrass = parseHex(theme.decoration.grass) - 0x202020;
  for (let x = 0; x < width; x += 12) {
    const bladeHeight = 4 + (x * 7) % 6;
    g.fillStyle(x % 24 === 0 ? darkGrass : color, 1);
    g.fillRect(x, height - 10 - bladeHeight, 4, bladeHeight);
  }

  return g;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/pixelDeco.ts
git commit -m "feat: add pixel cloud and grass decoration helpers"
```

---

### Task 5: Font Loading + styles.css + main.ts

**Files:**
- Modify: `index.html` (line 5)
- Rewrite: `src/styles.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Add Google Font link to index.html**

In `index.html`, after the viewport meta tag, add:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace styles.css**

Replace the entire contents of `src/styles.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

:root {
  --bg-top: #D4F5FF;
  --bg-bottom: #E8FFF0;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  -webkit-font-smoothing: none;
  image-rendering: pixelated;
  background: linear-gradient(180deg, var(--bg-top) 0%, var(--bg-bottom) 100%);
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

canvas {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  touch-action: manipulation;
}
```

- [ ] **Step 3: Update main.ts for pixelArt rendering and font preload**

Replace the entire contents of `src/main.ts` with:

```typescript
import Phaser from "phaser";
import "./styles.css";
import { ResultScene } from "./scenes/ResultScene";
import { RunScene } from "./scenes/RunScene";
import { ShopScene } from "./scenes/ShopScene";
import { TitleScene } from "./scenes/TitleScene";
import { setTheme } from "./ui/theme";
import { SettingsRepository } from "./services/SettingsRepository";

const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

function boot(): void {
  // Load saved theme
  const settings = new SettingsRepository().getSettings();
  setTheme(settings.themeMode);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    antialias: false,
    backgroundColor: "#D4F5FF",
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
      width: BASE_WIDTH,
      height: BASE_HEIGHT
    },
    scene: [TitleScene, RunScene, ShopScene, ResultScene]
  });

  window.addEventListener("resize", () => {
    game.scale.refresh();
  });
}

// Wait for pixel font before starting Phaser
document.fonts.ready.then(() => boot());
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles.css src/main.ts
git commit -m "feat: add pixel font, update styles and main.ts for Pixel Garden theme"
```

---

### Task 6: RunScene Redesign — Layout A + Symbol Textures

**Files:**
- Rewrite: `src/scenes/RunScene.ts`

This is the largest task. RunScene gets Layout A (reel + money focus) and all 4 symbol textures are redrawn in pixel-art style.

- [ ] **Step 1: Rewrite RunScene.ts**

Replace the entire contents of `src/scenes/RunScene.ts` with:

```typescript
import Phaser from "phaser";
import { session } from "../game/session";
import type { SymbolId } from "../types";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

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
  private reelIcons: Phaser.GameObjects.Image[] = [];
  private uiScale = 1;

  private readonly symbolTextureById: Record<SymbolId, string> = {
    coin: "sym-coin",
    clover: "sym-clover",
    bomb: "sym-bomb",
    bankrupt: "sym-ghost"
  };

  constructor() {
    super("RunScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    this.uiScale = Math.max(0.8, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * this.uiScale);

    // Background gradient
    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    // Decorations
    drawClouds(this);

    this.buildSymbolTextures();

    // --- Top bar: Round + Score ---
    this.roundText = this.add.text(px(14), px(14), "", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
    });
    this.scoreText = this.add.text(width - px(14), px(14), "", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
    }).setOrigin(1, 0);

    // --- Big Money Display ---
    this.moneyText = this.add.text(width / 2, px(56), "", {
      fontFamily: PX_FONT, fontSize: `${px(22)}px`, color: theme.text.accent
    }).setOrigin(0.5);
    this.goalText = this.add.text(width / 2, px(82), "", {
      fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    // --- Progress Bar ---
    const progY = px(100);
    const progW = width - px(28);
    const progBg = this.add.graphics();
    progBg.lineStyle(3, parseHex(theme.progress.border), 1);
    progBg.strokeRect(px(14), progY, progW, px(12));
    progBg.fillStyle(parseHex(theme.progress.bg), 1);
    progBg.fillRect(px(14) + 2, progY + 2, progW - 4, px(12) - 4);
    this.progressFill = this.add.graphics();

    // --- Reel Area ---
    const reelY = px(200);
    const reelPanel = addSoftPanel(this, width / 2, reelY, px(312), px(140));

    // Grass blades on top of reel panel
    const reelGrass = this.add.graphics();
    const grassColor = parseHex(theme.decoration.grass);
    const reelLeft = width / 2 - px(156);
    for (let gx = 0; gx < px(312); gx += px(10)) {
      const bh = px(3 + (gx * 7) % 5);
      reelGrass.fillStyle(gx % (px(20)) === 0 ? grassColor - 0x202020 : grassColor, 1);
      reelGrass.fillRect(reelLeft + gx, reelY - px(70) - bh, px(4), bh);
    }

    const reelX = [width / 2 - px(90), width / 2, width / 2 + px(90)];
    reelX.forEach((x) => {
      addSoftPanel(this, x, reelY, px(80), px(80));
      const icon = this.add.image(x, reelY, this.symbolTextureById.coin).setDisplaySize(px(64), px(64));
      this.reelIcons.push(icon);
    });

    // --- Log (inside reel area, below icons) ---
    this.log = this.add.text(width / 2, reelY + px(52), "", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.accent,
      align: "center"
    }).setOrigin(0.5);

    // --- Stats Chips ---
    const chipY = px(296);
    const chipW = px(84);
    const chipH = px(28);

    const spinsChip = addSoftPanel(this, width / 2 - px(96), chipY, chipW, chipH,
      parseHex(theme.stats.spins.bg), parseHex(theme.stats.spins.border));
    this.spinsText = this.add.text(width / 2 - px(96), chipY, "", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.spins.text
    }).setOrigin(0.5);

    const multChip = addSoftPanel(this, width / 2, chipY, chipW, chipH,
      parseHex(theme.stats.mult.bg), parseHex(theme.stats.mult.border));
    this.multiText = this.add.text(width / 2, chipY, "", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.mult.text
    }).setOrigin(0.5);

    const riskChip = addSoftPanel(this, width / 2 + px(96), chipY, chipW, chipH,
      parseHex(theme.stats.risk.bg), parseHex(theme.stats.risk.border));
    this.riskText = this.add.text(width / 2 + px(96), chipY, "", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.risk.text
    }).setOrigin(0.5);

    // --- SPIN Button ---
    this.spinButton = addSoftButton(this, width / 2, height - px(80), px(280), px(60));
    this.spinLabel = this.add.text(width / 2, height - px(80), "SPIN!", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: getTheme().button.text
    }).setOrigin(0.5);

    this.spinButton.on("pointerup", () => this.onSpin());

    // Grass bar at bottom
    drawGrassBar(this);

    this.renderState();
  }

  private onSpin(): void {
    if (session.isGameOver() || this.isSpinning) {
      return;
    }
    this.isSpinning = true;
    this.spinButton.disableInteractive();
    this.spinLabel.setText("ROLL...");

    this.animateSpin(() => {
      session.spin();
      const outcome = session.state.lastOutcome;
      if (outcome) {
        outcome.symbols.forEach((symbol, index) => {
          this.reelIcons[index].setTexture(this.symbolTextureById[symbol]);
          this.tweens.add({
            targets: this.reelIcons[index],
            scaleX: 1.16,
            scaleY: 1.16,
            yoyo: true,
            duration: 120
          });
        });
        if (outcome.deltaMoney > 0) {
          this.spawnSparkleBurst(this.scale.width / 2, Math.round(200 * this.uiScale), Math.min(18, 8 + Math.floor(outcome.deltaMoney / 22)));
        }
        this.log.setText(`${outcome.message} ${outcome.deltaMoney >= 0 ? "+" : ""}${outcome.deltaMoney}`);
      }

      if (session.settingsRepository.getSettings().vibrationOn && navigator.vibrate) {
        navigator.vibrate(20);
      }
      this.renderState();
      this.isSpinning = false;
      this.spinButton.setInteractive({ useHandCursor: true });
      this.spinLabel.setText("SPIN!");

      if (session.isGameOver()) {
        this.scene.start("ResultScene");
        return;
      }
      if (session.isRoundCleared()) {
        this.scene.start("ShopScene");
      }
    });
  }

  private renderState(): void {
    const s = session.state;
    const px = (n: number) => Math.round(n * this.uiScale);
    const theme = getTheme();
    const progressRatio = Phaser.Math.Clamp(s.currentMoney / s.debtTarget, 0, 1);
    const progW = (this.scale.width - px(28) - 4) * progressRatio;
    const needMoney = Math.max(0, s.debtTarget - s.currentMoney);

    this.roundText.setText(`R.${s.roundIndex}`);
    this.scoreText.setText(`SC ${s.score}`);
    this.moneyText.setText(`$${s.currentMoney}`);
    this.goalText.setText(`GOAL $${s.debtTarget}  NEED $${needMoney}`);
    this.spinsText.setText(`SP ${s.spinsLeft}`);
    this.multiText.setText(`x${s.multiplier}`);
    this.riskText.setText(`${s.riskMeter}%`);

    // Risk color changes
    if (s.riskMeter >= 70) {
      this.riskText.setColor("#FF4444");
    } else if (s.riskMeter >= 35) {
      this.riskText.setColor("#FFD43B");
    } else {
      this.riskText.setColor(theme.stats.risk.text);
    }

    this.progressFill.clear();
    const fillStart = parseHex(theme.progress.fillStart);
    const fillEnd = parseHex(theme.progress.fillEnd);
    this.progressFill.fillGradientStyle(fillStart, fillEnd, fillStart, fillEnd, 1);
    this.progressFill.fillRect(px(14) + 2, px(100) + 2, progW, px(12) - 4);
  }

  private animateSpin(onComplete: () => void): void {
    const symbolIds: SymbolId[] = ["coin", "clover", "bomb", "bankrupt"];

    const ticker = this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        this.reelIcons.forEach((icon, i) => {
          const sym = symbolIds[(Math.floor((this.time.now + i * 71) / 50) + i) % symbolIds.length];
          icon.setTexture(this.symbolTextureById[sym]);
        });
      }
    });

    this.time.delayedCall(740, () => {
      ticker.remove(false);
      onComplete();
    });
  }

  private spawnSparkleBurst(x: number, y: number, amount: number): void {
    const theme = getTheme();
    const colors = [parseHex(theme.text.accent), parseHex(theme.progress.fillStart), parseHex(theme.decoration.grass)];

    for (let i = 0; i < amount; i += 1) {
      const star = this.add.graphics();
      const c = colors[i % colors.length];
      star.fillStyle(c, 1);
      star.fillRect(0, 0, 6, 6);
      star.setPosition(x, y);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(30, 90) * this.uiScale;
      const tx = x + Math.cos(angle) * distance;
      const ty = y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: star,
        x: tx,
        y: ty,
        alpha: 0,
        duration: Phaser.Math.Between(300, 500),
        onComplete: () => star.destroy()
      });
    }
  }

  private buildSymbolTextures(): void {
    if (this.textures.exists("sym-coin")) {
      return;
    }

    const theme = getTheme();
    const tileSize = 72;

    const createTile = (key: string, bgHex: string, borderHex: string, painter: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      // Background square
      g.fillStyle(parseHex(bgHex), 1);
      g.fillRect(0, 0, tileSize, tileSize);
      // Border
      g.lineStyle(3, parseHex(borderHex), 1);
      g.strokeRect(1, 1, tileSize - 2, tileSize - 2);
      // Draw character
      painter(g);
      g.generateTexture(key, tileSize, tileSize);
      g.destroy();
    };

    // Coin: cute face on yellow bg
    createTile("sym-coin", theme.symbols.coin.bg, theme.symbols.coin.border, (g) => {
      // Gold circle body
      g.fillStyle(0xFFD43B, 1);
      g.fillCircle(36, 36, 22);
      g.lineStyle(3, 0xF0C040, 1);
      g.strokeCircle(36, 36, 22);
      // Eyes (pixel squares)
      g.fillStyle(0x5D4037, 1);
      g.fillRect(28, 30, 5, 6);
      g.fillRect(39, 30, 5, 6);
      // Smile
      g.fillStyle(0x5D4037, 1);
      g.fillRect(30, 41, 3, 3);
      g.fillRect(33, 43, 6, 3);
      g.fillRect(39, 41, 3, 3);
    });

    // Clover: flower with pink petals
    createTile("sym-clover", theme.symbols.clover.bg, theme.symbols.clover.border, (g) => {
      // Four pink petals
      g.fillStyle(0xFF8FAB, 1);
      g.fillCircle(36, 24, 10); // top
      g.fillCircle(24, 36, 10); // left
      g.fillCircle(48, 36, 10); // right
      g.fillCircle(36, 48, 10); // bottom
      // Yellow center
      g.fillStyle(0xFFE066, 1);
      g.fillCircle(36, 36, 7);
      // Stem
      g.fillStyle(0x2B8A3E, 1);
      g.fillRect(34, 52, 4, 12);
    });

    // Bomb: angry face on gray sphere
    createTile("sym-bomb", theme.symbols.bomb.bg, theme.symbols.bomb.border, (g) => {
      // Fuse
      g.fillStyle(0xFF6B6B, 1);
      g.fillRect(34, 8, 4, 8);
      // Flame
      g.fillStyle(0xFFD43B, 1);
      g.fillRect(33, 4, 6, 6);
      // Body
      g.fillStyle(0x555555, 1);
      g.fillCircle(36, 40, 20);
      // Angry eyes (V shape pixels)
      g.fillStyle(0xFF4444, 1);
      g.fillRect(26, 34, 4, 3);
      g.fillRect(28, 36, 4, 3);
      g.fillRect(42, 34, 4, 3);
      g.fillRect(40, 36, 4, 3);
      // Frown
      g.fillStyle(0xFF4444, 1);
      g.fillRect(30, 48, 3, 3);
      g.fillRect(33, 46, 6, 3);
      g.fillRect(39, 48, 3, 3);
    });

    // Bankrupt: ghost with wavy tail
    createTile("sym-ghost", theme.symbols.bankrupt.bg, theme.symbols.bankrupt.border, (g) => {
      // Ghost body (white)
      g.fillStyle(0xFFFFFF, 1);
      // Head (rounded top via overlapping rects)
      g.fillRect(24, 18, 24, 6);
      g.fillRect(22, 24, 28, 24);
      g.fillRect(26, 14, 20, 4);
      // Wavy bottom
      g.fillRect(22, 48, 8, 6);
      g.fillRect(34, 48, 8, 6);
      g.fillRect(28, 48, 6, 3);
      g.fillRect(42, 48, 8, 6);
      // Eyes (big round pixel eyes)
      g.fillStyle(0x2D2D2D, 1);
      g.fillRect(28, 28, 6, 8);
      g.fillRect(38, 28, 6, 8);
      // Mouth (open O)
      g.fillStyle(0x2D2D2D, 1);
      g.fillRect(32, 40, 8, 5);
    });

    // Sparkle particle (pixel square)
    if (!this.textures.exists("fx-star")) {
      const g = this.add.graphics();
      g.fillStyle(0xFFD43B, 1);
      g.fillRect(0, 0, 8, 8);
      g.generateTexture("fx-star", 8, 8);
      g.destroy();
    }
  }
}
```

- [ ] **Step 2: Run all tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All tests pass (tests don't test scene rendering directly)

- [ ] **Step 3: Verify visually in dev server**

Run: `npm run dev`
Open http://localhost:5173, click Start Run, verify:
- Pixel Garden background (sky/mint gradient)
- Cute pixel symbol textures (coin face, flower clover, angry bomb, ghost)
- Layout A: big money at top, large reel, small stat chips
- Pixel-style panels and buttons with drop shadows

- [ ] **Step 4: Commit**

```bash
git add src/scenes/RunScene.ts
git commit -m "feat: redesign RunScene with Pixel Garden Layout A and new symbol textures"
```

---

### Task 7: TitleScene Redesign

**Files:**
- Rewrite: `src/scenes/TitleScene.ts`

- [ ] **Step 1: Rewrite TitleScene.ts**

Replace the entire contents of `src/scenes/TitleScene.ts` with:

```typescript
import Phaser from "phaser";
import { session } from "../game/session";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex, setTheme } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    // Background
    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    // Title
    this.add.text(width / 2, px(60), "LUCKY", {
      fontFamily: PX_FONT, fontSize: `${px(24)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    this.add.text(width / 2, px(90), "LEDGER", {
      fontFamily: PX_FONT, fontSize: `${px(24)}px`, color: "#FF9A3C",
      shadow: { offsetX: 2, offsetY: 2, color: "#FFD8A8", fill: true, blur: 0 }
    }).setOrigin(0.5);

    this.add.text(width / 2, px(116), "~ DEBT RUN ROGUELITE ~", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    // Start Run button
    const startY = px(170);
    const startBtn = addSoftButton(this, width / 2, startY, px(240), px(56));
    this.add.text(width / 2, startY, "START RUN", {
      fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: theme.button.text
    }).setOrigin(0.5);

    startBtn.on("pointerup", () => {
      session.startNewRun();
      this.scene.start("RunScene");
    });

    // Leaderboard
    const lbY = px(310);
    addSoftPanel(this, width / 2, lbY, px(300), px(170));
    this.add.text(width / 2, lbY - px(60), "TOP SCORES", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    const scores = session.leaderboard.getTopScores(5);
    if (scores.length > 0) {
      scores.forEach((row, idx) => {
        this.add.text(width / 2, lbY - px(34) + idx * px(22),
          `${idx + 1}. ${row.score}  R${row.roundReached}`, {
          fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.primary
        }).setOrigin(0.5);
      });
    } else {
      this.add.text(width / 2, lbY, "No run yet", {
        fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.secondary
      }).setOrigin(0.5);
    }

    // Bottom toggles
    const settings = session.settingsRepository.getSettings();
    const rowY = height - px(52);
    const btnW = px(100);
    const btnH = px(30);

    // Sound toggle
    const soundBtn = addSoftButton(this, width / 2 - px(110), rowY, btnW, btnH,
      parseHex(theme.panel.fill), parseHex(theme.panel.border));
    const soundText = this.add.text(width / 2 - px(110), rowY,
      settings.soundOn ? "SND ON" : "SND OFF", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    soundBtn.on("pointerup", () => {
      const next = session.settingsRepository.getSettings();
      next.soundOn = !next.soundOn;
      session.settingsRepository.setSettings(next);
      soundText.setText(next.soundOn ? "SND ON" : "SND OFF");
    });

    // Vibration toggle
    const vibeBtn = addSoftButton(this, width / 2, rowY, btnW, btnH,
      parseHex(theme.panel.fill), parseHex(theme.panel.border));
    const vibeText = this.add.text(width / 2, rowY,
      settings.vibrationOn ? "VIB ON" : "VIB OFF", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    vibeBtn.on("pointerup", () => {
      const next = session.settingsRepository.getSettings();
      next.vibrationOn = !next.vibrationOn;
      session.settingsRepository.setSettings(next);
      vibeText.setText(next.vibrationOn ? "VIB ON" : "VIB OFF");
    });

    // Dark mode toggle
    const themeBtn = addSoftButton(this, width / 2 + px(110), rowY, btnW, btnH,
      parseHex(theme.panel.fill), parseHex(theme.panel.border));
    const themeIcon = settings.themeMode === "dark" ? "MOON" : "SUN";
    const themeText = this.add.text(width / 2 + px(110), rowY, themeIcon, {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    themeBtn.on("pointerup", () => {
      const next = session.settingsRepository.getSettings();
      next.themeMode = next.themeMode === "dark" ? "light" : "dark";
      session.settingsRepository.setSettings(next);
      setTheme(next.themeMode);
      this.scene.restart();
    });

    // Grass bar
    drawGrassBar(this);
  }
}
```

- [ ] **Step 2: Verify visually**

Run dev server, check title screen shows:
- Pixel Garden gradient background with clouds
- "LUCKY" (green) + "LEDGER" (orange) pixel text with drop shadow
- Orange START RUN button with pixel shadow
- Leaderboard in pixel panel
- 3 bottom toggles: SND, VIB, SUN/MOON (dark mode)
- Green grass bar at bottom

- [ ] **Step 3: Test dark mode toggle**

Click the SUN button → scene restarts with dark theme colors. Click MOON → returns to light.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/TitleScene.ts
git commit -m "feat: redesign TitleScene with Pixel Garden theme and dark mode toggle"
```

---

### Task 8: ShopScene Redesign

**Files:**
- Rewrite: `src/scenes/ShopScene.ts`

- [ ] **Step 1: Rewrite ShopScene.ts**

Replace the entire contents of `src/scenes/ShopScene.ts` with:

```typescript
import Phaser from "phaser";
import { session } from "../game/session";
import type { UpgradeOption } from "../types";
import { addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

const UPGRADE_COLORS: Record<string, { bg: string; border: string }> = {
  "cash-boost":      { bg: "#FFF3BF", border: "#F0C040" },
  "coin-bias":       { bg: "#FFF8DC", border: "#F0C040" },
  "reinforced-core": { bg: "#D4F0D4", border: "#7BC67E" },
  "banker-focus":    { bg: "#E8F4FD", border: "#5BB8FF" },
  "cap-breaker":     { bg: "#F3E8FF", border: "#C9A0FF" },
  "risk-cooler":     { bg: "#FFE8E8", border: "#FFA0A0" },
};

export class ShopScene extends Phaser.Scene {
  private picking = false;

  constructor() {
    super("ShopScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    // Background
    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    // Header
    this.add.text(width / 2, px(50), "ROUND CLEAR!", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    // Star decorations
    this.add.text(width / 2 - px(120), px(48), "*", {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: "#FFD43B"
    }).setOrigin(0.5);
    this.add.text(width / 2 + px(120), px(48), "*", {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: "#FFD43B"
    }).setOrigin(0.5);

    this.add.text(width / 2, px(74), "Pick 1 upgrade", {
      fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    const choices = session.getUpgradeChoices();
    choices.forEach((choice, idx) => this.renderChoice(choice, idx, s));

    drawGrassBar(this);
  }

  private renderChoice(choice: UpgradeOption, idx: number, s: number): void {
    const { width } = this.scale;
    const theme = getTheme();
    const px = (n: number) => Math.round(n * s);
    const y = px(150 + idx * 140);

    const colors = UPGRADE_COLORS[choice.id] ?? { bg: theme.panel.fill, border: theme.panel.border };
    const card = addSoftPanel(this, width / 2, y, px(290), px(110),
      parseHex(colors.bg), parseHex(colors.border)
    ).setInteractive({ useHandCursor: true });

    this.add.text(width / 2, y - px(22), choice.title, {
      fontFamily: PX_FONT, fontSize: `${px(9)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    this.add.text(width / 2, y + px(10), choice.description, {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.secondary,
      wordWrap: { width: px(250) }, align: "center"
    }).setOrigin(0.5);

    card.on("pointerdown", () => card.setScale(0.98));
    card.on("pointerout", () => card.setScale(1));

    card.on("pointerup", () => {
      if (this.picking) {
        return;
      }
      this.picking = true;
      this.input.enabled = false;
      session.applyUpgrade(choice);
      session.moveToNextRound();
      this.time.delayedCall(30, () => this.scene.start("RunScene"));
    });
  }
}
```

- [ ] **Step 2: Verify visually**

Play until round clear, check ShopScene shows:
- Pixel Garden gradient + clouds
- "ROUND CLEAR!" in green pixel text with star decorations
- 3 upgrade cards with type-specific colored borders
- Pixel font throughout

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ShopScene.ts
git commit -m "feat: redesign ShopScene with Pixel Garden theme and colored upgrade cards"
```

---

### Task 9: ResultScene Redesign

**Files:**
- Rewrite: `src/scenes/ResultScene.ts`

- [ ] **Step 1: Rewrite ResultScene.ts**

Replace the entire contents of `src/scenes/ResultScene.ts` with:

```typescript
import Phaser from "phaser";
import { session } from "../game/session";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    // Background
    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    const saved = session.saveResultIfNeeded();
    const isVictory = session.state.roundIndex >= 12;

    // Header
    const headerText = isVictory ? "VICTORY!" : "RUN OVER";
    const headerColor = isVictory ? "#1B9E5A" : "#E03131";
    const headerShadow = isVictory ? "#A8E6CF" : "#FFA0A0";

    this.add.text(width / 2, px(50), headerText, {
      fontFamily: PX_FONT, fontSize: `${px(16)}px`, color: headerColor,
      shadow: { offsetX: 2, offsetY: 2, color: headerShadow, fill: true, blur: 0 }
    }).setOrigin(0.5);

    // Score panel
    addSoftPanel(this, width / 2, px(130), px(280), px(100));

    this.add.text(width / 2, px(105), `SCORE`, {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    this.add.text(width / 2, px(130), `${session.state.score}`, {
      fontFamily: PX_FONT, fontSize: `${px(20)}px`, color: theme.text.accent
    }).setOrigin(0.5);

    this.add.text(width / 2, px(158), `ROUND ${session.state.roundIndex}`, {
      fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    if (saved) {
      this.add.text(width / 2, px(190), "Saved to leaderboard!", {
        fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: "#1B9E5A"
      }).setOrigin(0.5);
    }

    // Leaderboard
    const lbY = px(290);
    const topScores = session.leaderboard.getTopScores(5);
    addSoftPanel(this, width / 2, lbY, px(280), px(130));

    this.add.text(width / 2, lbY - px(44), "TOP 5", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    topScores.forEach((row, idx) => {
      this.add.text(width / 2, lbY - px(22) + idx * px(20),
        `${idx + 1}. ${row.score}  R${row.roundReached}`, {
        fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.primary
      }).setOrigin(0.5);
    });

    // Buttons
    const retryY = height - px(110);
    const retryBtn = addSoftButton(this, width / 2, retryY, px(220), px(46));
    this.add.text(width / 2, retryY, "RETRY", {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.button.text
    }).setOrigin(0.5);
    retryBtn.on("pointerup", () => {
      session.startNewRun();
      this.scene.start("RunScene");
    });

    const titleY = height - px(54);
    const titleBtn = addSoftButton(this, width / 2, titleY, px(220), px(40),
      parseHex(theme.decoration.grass), parseHex(theme.panel.border));
    this.add.text(width / 2, titleY, "TITLE", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: "#FFFFFF"
    }).setOrigin(0.5);
    titleBtn.on("pointerup", () => this.scene.start("TitleScene"));

    drawGrassBar(this);
  }
}
```

- [ ] **Step 2: Verify visually**

Trigger game over, check ResultScene shows:
- "RUN OVER" (red) or "VICTORY!" (green) pixel text
- Score panel with big number
- Leaderboard in pixel panel
- RETRY (orange) + TITLE (green) pixel buttons
- Grass bar at bottom

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ResultScene.ts
git commit -m "feat: redesign ResultScene with Pixel Garden theme"
```

---

### Task 10: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (economy, upgrades, simulation, theme)

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds, outputs to `/dist`

- [ ] **Step 4: Full visual playthrough**

Run: `npm run dev`
Play through the complete loop:
1. TitleScene → verify pixel theme, clouds, grass, dark mode toggle
2. Start Run → RunScene Layout A, pixel symbols, stat chips
3. Play until round clear → ShopScene, colored upgrade cards
4. Continue → RunScene next round
5. Fail or reach round 12 → ResultScene, victory/game over
6. Toggle dark mode on TitleScene → verify all scenes use dark palette

- [ ] **Step 5: Commit all remaining changes (if any)**

```bash
git add -A
git commit -m "chore: final Pixel Garden redesign verification"
```
