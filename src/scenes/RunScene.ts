import Phaser from "phaser";
import { session } from "../game/session";
import { PATTERNS } from "../game/patterns";
import type { SymbolId, PatternMatch } from "../types";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";
const KR_FONT = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
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
  private gridCenterY = 0;
  private cellSize = 0;
  private cellGap = 0;
  private comboCount = 0;
  private probBars: { bar: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; pct: Phaser.GameObjects.Text }[] = [];

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

    // Top bar — back button + round + score
    const backBtn = addSoftButton(this, px(16), px(18), px(24), px(20), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(px(16), px(18), "<", { fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.accent }).setOrigin(0.5);
    backBtn.on("pointerup", () => this.scene.start("TitleScene"));

    this.roundText = this.add.text(px(42), px(16), "", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.primary });
    this.scoreText = this.add.text(width - px(14), px(16), "", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.primary }).setOrigin(1, 0);

    // Money
    this.moneyText = this.add.text(width / 2, px(52), "", { fontFamily: PX_FONT, fontSize: `${px(22)}px`, color: theme.text.accent }).setOrigin(0.5);
    this.goalText = this.add.text(width / 2, px(76), "", { fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.secondary }).setOrigin(0.5);

    // Progress bar
    const progY = px(94);
    const progW = width - px(28);
    const progBg = this.add.graphics();
    progBg.fillStyle(parseHex(theme.progress.bg), 1);
    progBg.fillRect(px(14), progY, progW, px(10));
    progBg.lineStyle(2, parseHex(theme.progress.border), 1);
    progBg.strokeRect(px(14), progY, progW, px(10));
    this.progressFill = this.add.graphics();

    // 3x3 Grid
    this.gridCenterY = px(240);
    this.cellSize = px(52);
    this.cellGap = px(4);
    const gridCenterY = this.gridCenterY;
    const cellSize = this.cellSize;
    const gap = this.cellGap;
    const gridSize = cellSize * 3 + gap * 2;
    addSoftPanel(this, width / 2, gridCenterY, gridSize + px(18), gridSize + px(18));

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = width / 2 + (col - 1) * (cellSize + gap);
        const cy = gridCenterY + (row - 1) * (cellSize + gap);
        addSoftPanel(this, cx, cy, cellSize, cellSize);
        const icon = this.add.image(cx, cy, this.symTex.coin).setDisplaySize(px(38), px(38));
        this.gridIcons.push(icon);
        const hl = this.add.graphics();
        hl.setVisible(false);
        this.gridHighlights.push(hl);
      }
    }

    // Log (below grid)
    this.log = this.add.text(width / 2, gridCenterY + gridSize / 2 + px(20), "", {
      fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.accent,
      align: "center", wordWrap: { width: width - px(40) }
    }).setOrigin(0.5);

    // Stats chips
    const chipY = px(378);
    const chipW = px(96);
    const chipH = px(36);
    addSoftPanel(this, width / 2 - px(104), chipY, chipW, chipH, parseHex(theme.stats.spins.bg), parseHex(theme.stats.spins.border));
    this.add.text(width / 2 - px(104), chipY - px(8), "SPINS", { fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.spins.text }).setOrigin(0.5);
    this.spinsText = this.add.text(width / 2 - px(104), chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.stats.spins.text }).setOrigin(0.5);

    addSoftPanel(this, width / 2, chipY, chipW, chipH, parseHex(theme.stats.mult.bg), parseHex(theme.stats.mult.border));
    this.add.text(width / 2, chipY - px(8), "MULTI", { fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.mult.text }).setOrigin(0.5);
    this.multiText = this.add.text(width / 2, chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.stats.mult.text }).setOrigin(0.5);

    addSoftPanel(this, width / 2 + px(104), chipY, chipW, chipH, parseHex(theme.stats.risk.bg), parseHex(theme.stats.risk.border));
    this.add.text(width / 2 + px(104), chipY - px(8), "RISK", { fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.stats.risk.text }).setOrigin(0.5);
    this.riskText = this.add.text(width / 2 + px(104), chipY + px(6), "", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.stats.risk.text }).setOrigin(0.5);

    // Probability bars (below stats)
    const probNames = ["COIN", "FLOWER", "STAR", "JOKER", "BOMB", "GHOST"];
    const probPanelH = px(106);
    const probPanelCenterY = px(460);
    this.probBars = [];
    addSoftPanel(this, width / 2, probPanelCenterY, width - px(24), probPanelH);
    const probStartY = probPanelCenterY - px(38);
    probNames.forEach((name, i) => {
      const by = probStartY + i * px(15);
      const label = this.add.text(px(20), by, name, {
        fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.secondary
      }).setOrigin(0, 0.5);
      const bar = this.add.graphics();
      const pct = this.add.text(width - px(18), by, "", {
        fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.primary
      }).setOrigin(1, 0.5);
      this.probBars.push({ bar, label, pct });
    });

    // Lever (right side of grid, decorative + clickable)
    const leverX = width / 2 + gridSize / 2 + px(34);
    const leverTopY = gridCenterY - px(50);
    const leverH = px(100);
    const leverG = this.add.graphics();
    // Slot housing (metallic frame)
    leverG.fillStyle(0xAAAAAA, 1);
    leverG.fillRect(leverX - px(6), leverTopY + px(20), px(12), leverH - px(20));
    // Slot track groove
    leverG.fillStyle(0x777777, 1);
    leverG.fillRect(leverX - px(3), leverTopY + px(24), px(6), leverH - px(28));
    // Base plate
    leverG.fillStyle(0x888888, 1);
    leverG.fillRect(leverX - px(10), leverTopY + leverH - px(4), px(20), px(8));
    leverG.fillStyle(0x666666, 1);
    leverG.fillRect(leverX - px(12), leverTopY + leverH + px(2), px(24), px(6));
    // Lever arm (shiny rod)
    const handleG = this.add.graphics();
    handleG.fillStyle(0xCCCCCC, 1);
    handleG.fillRect(-px(2), 0, px(4), px(30));
    // Handle ball (red, glossy)
    handleG.fillStyle(0xCC2222, 1);
    handleG.fillCircle(0, -px(4), px(10));
    handleG.fillStyle(0xE03131, 1);
    handleG.fillCircle(0, -px(4), px(8));
    // Highlight on ball
    handleG.fillStyle(0xFF8888, 1);
    handleG.fillCircle(-px(2), -px(7), px(3));
    handleG.setPosition(leverX, leverTopY);
    handleG.setInteractive(new Phaser.Geom.Circle(0, -px(4), px(14)), Phaser.Geom.Circle.Contains);
    handleG.on("pointerover", () => handleG.setScale(1.08));
    handleG.on("pointerout", () => { if (!this.isSpinning) handleG.setScale(1); });

    handleG.on("pointerup", () => {
      if (this.isSpinning || this.overlayGroup) return;
      // Quick pull down
      this.tweens.add({
        targets: handleG,
        y: leverTopY + px(70),
        duration: 120,
        ease: "Back.easeIn",
        onComplete: () => {
          this.onSpin();
          // Slow spring back up
          this.tweens.add({
            targets: handleG,
            y: leverTopY,
            duration: 600,
            ease: "Bounce.easeOut"
          });
        }
      });
    });

    // SPIN button (kept as alternative)
    this.spinButton = addSoftButton(this, width / 2, height - px(80), px(220), px(44));
    this.spinLabel = this.add.text(width / 2, height - px(80), "SPIN!", { fontFamily: PX_FONT, fontSize: `${px(16)}px`, color: theme.button.text }).setOrigin(0.5);
    this.spinButton.on("pointerup", () => this.onSpin());

    // Bottom buttons: ? and COMBO
    const bottomY = height - px(34);
    const helpBtn = addSoftButton(this, px(30), bottomY, px(36), px(28), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(px(30), bottomY, "?", { fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.accent }).setOrigin(0.5);
    helpBtn.on("pointerup", () => this.scene.start("HelpScene", { from: "RunScene" }));

    const patBtn = addSoftButton(this, width - px(50), bottomY, px(70), px(28), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(width - px(50), bottomY, "COMBO", { fontFamily: PX_FONT, fontSize: `${px(7)}px`, color: theme.text.accent }).setOrigin(0.5);
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

        const matchCount = outcome.matches.length;
        const delta = outcome.totalDelta;

        if (matchCount > 0) {
          this.highlightMatches(outcome.matches);
          this.comboCount++;

          // --- POPUP TEXT ---
          const popupText = delta >= 0 ? `+${delta}` : `${delta}`;
          const popupColor = delta >= 0 ? "#FFD43B" : "#FF4444";
          const popupSize = Math.min(30, 14 + matchCount * 3);
          this.spawnPopupText(popupText, popupColor, popupSize);

          // --- COMBO COUNTER ---
          if (this.comboCount >= 2) {
            this.spawnPopupText(`COMBO x${this.comboCount}!`, "#FF9A3C", 12, 40);
          }

          // --- SPARKLE (bigger with more matches) ---
          const sparkleAmount = Math.min(24, 8 + matchCount * 4 + Math.floor(Math.abs(delta) / 8));
          this.spawnSparkleBurst(this.scale.width / 2, this.gridCenterY, sparkleAmount);

          // --- SCREEN SHAKE (scales with reward) ---
          if (matchCount >= 3 || Math.abs(delta) >= 30) {
            this.shakeCamera(Math.min(8, 2 + matchCount), 150);
          }

          // --- BIG WIN effect ---
          if (delta >= 50 || matchCount >= 5) {
            this.spawnBigWinEffect();
          }

          // --- FULL COMBO fireworks (all 14 patterns) ---
          if (outcome.matches.some(m => m.patternId === "full")) {
            this.spawnFireworks();
          }
        } else {
          // No match — reset combo
          this.comboCount = 0;
        }

        // --- SCREEN SHAKE on big loss ---
        if (delta <= -20) {
          this.shakeCamera(4, 200);
        }

        this.log.setText(outcome.message);
      }
      if (session.settingsRepository.getSettings().vibrationOn && navigator.vibrate) {
        const matchCount = outcome?.matches.length ?? 0;
        navigator.vibrate(matchCount >= 3 ? [30, 20, 30] : 20);
      }
      this.renderState();

      // Money text bounce on change
      if (outcome && outcome.totalDelta !== 0) {
        this.tweens.add({
          targets: this.moneyText,
          scaleX: 1.2, scaleY: 1.2,
          yoyo: true, duration: 100
        });
      }

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
    this.progressFill.fillRect(px(14) + 1, px(94) + 1, progW, px(10) - 2);

    // Update probability bars
    this.updateProbBars();
  }

  private updateProbBars(): void {
    const s = session.state;
    const px = (n: number) => Math.round(n * this.uiScale);
    const { width } = this.scale;

    // Calculate adjusted weights (same logic as EconomyService.pickSymbol)
    const weights = [
      35 + s.coinBias,                                    // coin
      20,                                                  // clover
      10,                                                  // star
      8 + (s.wildBoost || 0),                             // wild
      Math.max(5, 18 + Math.floor(s.riskMeter / 18)),    // bomb
      Math.max(3, 9 + Math.floor(s.riskMeter / 12)),     // ghost
    ];
    const total = weights.reduce((a, b) => a + b, 0);
    const probColors = ["#FFD43B", "#FF8FAB", "#FFD43B", "#C9A0FF", "#FFA0A0", "#C9A0FF"];
    const barLeft = px(80);
    const barMaxW = width - px(120);
    const probStartY = px(460) - px(38);

    this.probBars.forEach(({ bar, pct: pctText }, i) => {
      const pctVal = weights[i] / total;
      const barW = Math.round(barMaxW * pctVal);
      const by = probStartY + i * px(15);

      bar.clear();
      bar.fillStyle(0x888888, 0.2);
      bar.fillRect(barLeft, by - px(3), barMaxW, px(6));
      bar.fillStyle(parseHex(probColors[i]), 1);
      bar.fillRect(barLeft, by - px(3), barW, px(6));

      pctText.setText(`${Math.round(pctVal * 100)}%`);
    });
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
    this.time.delayedCall(1100, () => {
      ticker.remove(false);
      onComplete();
    });
  }

  private highlightMatches(matches: PatternMatch[]): void {
    const cellSize = this.cellSize;
    const gap = this.cellGap;
    const { width } = this.scale;
    const gridCenterY = this.gridCenterY;

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
    this.overlayGroup = this.add.group();

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.7);
    dim.fillRect(0, 0, width, height);
    dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    dim.on("pointerup", () => this.toggleOverlay());
    this.overlayGroup.add(dim);

    const title = this.add.text(width / 2, px(18), "GUIDE", { fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: "#FFD43B" }).setOrigin(0.5);
    this.overlayGroup.add(title);

    // --- Symbol info section ---
    const symTitle = this.add.text(width / 2, px(38), "SYMBOLS", { fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: "#8CE99A" }).setOrigin(0.5);
    this.overlayGroup.add(symTitle);

    const symbolInfo = [
      { icon: "sym-coin",   name: "COIN",   val: "+2", desc: "돈 획득" },
      { icon: "sym-clover", name: "FLOWER", val: "+3", desc: "배율 증가" },
      { icon: "sym-star",   name: "STAR",   val: "+5", desc: "고가 보너스" },
      { icon: "sym-wild",   name: "JOKER",  val: " 0", desc: "아무 심볼 대체" },
      { icon: "sym-bomb",   name: "BOMB",   val: "-2", desc: "돈 손실 + 위험" },
      { icon: "sym-ghost",  name: "GHOST",  val: "-4", desc: "대규모 손실" },
    ];

    symbolInfo.forEach((sym, idx) => {
      const col = idx < 3 ? 0 : 1;
      const row = idx < 3 ? idx : idx - 3;
      const sx = width / 2 + (col === 0 ? -px(80) : px(10));
      const sy = px(54) + row * px(24);

      const icon = this.add.image(sx, sy, sym.icon).setDisplaySize(px(16), px(16));
      this.overlayGroup!.add(icon);

      const nameText = this.add.text(sx + px(14), sy - px(6), `${sym.name} (${sym.val})`, {
        fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: "#FFFFFF"
      });
      this.overlayGroup!.add(nameText);

      const descText = this.add.text(sx + px(14), sy + px(2), sym.desc, {
        fontFamily: KR_FONT, fontSize: `${px(6)}px`, color: "#AAAAAA"
      });
      this.overlayGroup!.add(descText);
    });

    // --- Formula ---
    const formulaY = px(132);
    const formula = this.add.text(width / 2, formulaY, "보상 = (심볼+1)x(패턴+1)x배율", {
      fontFamily: KR_FONT, fontSize: `${px(7)}px`, color: "#FFD43B"
    }).setOrigin(0.5);
    this.overlayGroup.add(formula);

    // --- Pattern section ---
    const patTitle = this.add.text(width / 2, px(148), "PATTERNS", { fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: "#8CE99A" }).setOrigin(0.5);
    this.overlayGroup.add(patTitle);

    const miniCell = px(8);
    const miniGap = px(1);
    const colWidth = px(150);
    const startY = px(164);

    PATTERNS.forEach((pat, idx) => {
      const col = idx < 7 ? 0 : 1;
      const row = idx < 7 ? idx : idx - 7;
      const baseX = width / 2 + (col === 0 ? -colWidth / 2 - px(10) : colWidth / 2 - px(40));
      const baseY = startY + row * px(58);

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

      const label = this.add.text(baseX + (miniCell + miniGap) * 3 + px(4), baseY + px(2), pat.name, {
        fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: "#FFFFFF"
      });
      this.overlayGroup!.add(label);

      const valText = this.add.text(baseX + (miniCell + miniGap) * 3 + px(4), baseY + px(14), `x${pat.value + 1}`, {
        fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: "#AAAAAA"
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

  private spawnPopupText(text: string, color: string, size: number, extraY = 0): void {
    const px = (n: number) => Math.round(n * this.uiScale);
    const popup = this.add.text(this.scale.width / 2, this.gridCenterY - px(20) - extraY, text, {
      fontFamily: PX_FONT, fontSize: `${px(size)}px`, color,
      stroke: "#000000", strokeThickness: px(2)
    }).setOrigin(0.5).setAlpha(1);

    this.tweens.add({
      targets: popup,
      y: popup.y - px(40),
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: "Power2",
      onComplete: () => popup.destroy()
    });
  }

  private shakeCamera(intensity: number, duration: number): void {
    this.cameras.main.shake(duration, intensity / 1000);
  }

  private spawnBigWinEffect(): void {
    const { width, height } = this.scale;
    const px = (n: number) => Math.round(n * this.uiScale);
    const theme = getTheme();
    const colors = [0xFFD43B, 0xFF9A3C, 0xFF6BA6, 0x51CF66, 0x5BB8FF];

    // Burst of colored squares from center
    for (let i = 0; i < 30; i++) {
      const particle = this.add.graphics();
      const c = colors[i % colors.length];
      const size = Phaser.Math.Between(4, 10);
      particle.fillStyle(c, 1);
      particle.fillRect(0, 0, size, size);
      particle.setPosition(width / 2, this.gridCenterY);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(60, 160) * this.uiScale;

      this.tweens.add({
        targets: particle,
        x: width / 2 + Math.cos(angle) * dist,
        y: this.gridCenterY + Math.sin(angle) * dist,
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(500, 900),
        ease: "Power2",
        onComplete: () => particle.destroy()
      });
    }

    // Flash overlay
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 0.3);
    flash.fillRect(0, 0, width, height);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  private spawnFireworks(): void {
    const { width, height } = this.scale;
    const px = (n: number) => Math.round(n * this.uiScale);
    const colors = [0xFFD43B, 0xFF6BA6, 0x5BB8FF, 0x51CF66, 0xFF9A3C, 0xC9A0FF, 0xE03131];

    // Launch 5 fireworks from different positions with staggered timing
    const launchPoints = [
      { x: width * 0.2, delay: 0 },
      { x: width * 0.8, delay: 200 },
      { x: width * 0.5, delay: 400 },
      { x: width * 0.3, delay: 600 },
      { x: width * 0.7, delay: 800 },
    ];

    launchPoints.forEach(({ x: launchX, delay }) => {
      this.time.delayedCall(delay, () => {
        const burstY = Phaser.Math.Between(px(60), px(200));

        // Trail going up
        const trail = this.add.graphics();
        trail.fillStyle(0xFFFFFF, 1);
        trail.fillRect(-1, 0, 2, px(8));
        trail.setPosition(launchX, height);

        this.tweens.add({
          targets: trail,
          y: burstY,
          alpha: 0.5,
          duration: 400,
          ease: "Power2",
          onComplete: () => {
            trail.destroy();

            // Explosion burst
            const burstCount = Phaser.Math.Between(15, 25);
            for (let i = 0; i < burstCount; i++) {
              const spark = this.add.graphics();
              const c = colors[i % colors.length];
              const sz = Phaser.Math.Between(2, 6);
              spark.fillStyle(c, 1);
              spark.fillRect(0, 0, sz, sz);
              spark.setPosition(launchX, burstY);

              const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
              const dist = Phaser.Math.FloatBetween(30, 120) * this.uiScale;
              const gravity = Phaser.Math.FloatBetween(20, 60);

              this.tweens.add({
                targets: spark,
                x: launchX + Math.cos(angle) * dist,
                y: burstY + Math.sin(angle) * dist + gravity,
                alpha: 0,
                duration: Phaser.Math.Between(600, 1200),
                ease: "Power3",
                onComplete: () => spark.destroy()
              });
            }

            // Flash at burst point
            const burstFlash = this.add.graphics();
            burstFlash.fillStyle(0xFFFFFF, 0.6);
            burstFlash.fillCircle(launchX, burstY, px(20));
            this.tweens.add({
              targets: burstFlash,
              alpha: 0,
              scaleX: 2, scaleY: 2,
              duration: 200,
              onComplete: () => burstFlash.destroy()
            });
          }
        });
      });
    });

    // "FULL COMBO!" text
    const comboText = this.add.text(width / 2, this.gridCenterY, "FULL COMBO!", {
      fontFamily: PX_FONT, fontSize: `${px(18)}px`, color: "#FFD43B",
      stroke: "#000000", strokeThickness: px(3)
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: comboText,
      alpha: 1, scaleX: 1.3, scaleY: 1.3,
      duration: 300,
      yoyo: true,
      hold: 800,
      onComplete: () => comboText.destroy()
    });

    // Strong screen shake
    this.shakeCamera(10, 400);
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

    tile("sym-coin", theme.symbols.coin.bg, theme.symbols.coin.border, (g) => {
      g.fillStyle(0xFFD43B, 1); g.fillCircle(36, 36, 22);
      g.lineStyle(3, 0xF0C040, 1); g.strokeCircle(36, 36, 22);
      g.fillStyle(0x5D4037, 1);
      g.fillRect(28, 30, 5, 6); g.fillRect(39, 30, 5, 6);
      g.fillRect(30, 41, 3, 3); g.fillRect(33, 43, 6, 3); g.fillRect(39, 41, 3, 3);
    });

    tile("sym-clover", theme.symbols.clover.bg, theme.symbols.clover.border, (g) => {
      g.fillStyle(0xFF8FAB, 1);
      g.fillCircle(36, 24, 10); g.fillCircle(24, 36, 10);
      g.fillCircle(48, 36, 10); g.fillCircle(36, 48, 10);
      g.fillStyle(0xFFE066, 1); g.fillCircle(36, 36, 7);
      g.fillStyle(0x2B8A3E, 1); g.fillRect(34, 52, 4, 12);
    });

    // Star: clean 5-pointed star silhouette
    tile("sym-star", theme.symbols.star.bg, theme.symbols.star.border, (g) => {
      g.fillStyle(0xFFD43B, 1);
      // Large 5-pointed star using polygon points
      const cx = 36, cy = 36, outerR = 26, innerR = 12;
      const points: number[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        points.push(cx + Math.cos(outerAngle) * outerR, cy + Math.sin(outerAngle) * outerR);
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push(cx + Math.cos(innerAngle) * innerR, cy + Math.sin(innerAngle) * innerR);
      }
      // Draw as triangles from center
      for (let i = 0; i < 10; i++) {
        const ni = (i + 1) % 10;
        g.fillTriangle(cx, cy, points[i * 2], points[i * 2 + 1], points[ni * 2], points[ni * 2 + 1]);
      }
      // Border
      g.lineStyle(2, 0xF0C040, 1);
      for (let i = 0; i < 10; i++) {
        const ni = (i + 1) % 10;
        g.strokeLineShape(new Phaser.Geom.Line(points[i * 2], points[i * 2 + 1], points[ni * 2], points[ni * 2 + 1]));
      }
    });

    // Joker/Wild: rainbow gradient background + large joker face
    // Joker/Wild: playing card style with big joker icon
    tile("sym-wild", theme.symbols.wild.bg, theme.symbols.wild.border, (g) => {
      // White card inner
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(8, 4, 56, 64);
      // Card border
      g.lineStyle(2, 0x7C6EF0, 1);
      g.strokeRect(8, 4, 56, 64);
      // Top-left corner: J + diamond
      g.fillStyle(0x7C6EF0, 1);
      g.fillRect(12, 8, 5, 8);   // J vertical
      g.fillRect(10, 14, 5, 3);  // J hook
      g.fillStyle(0xE03131, 1);
      // Diamond shape (4 pixels)
      g.fillRect(14, 20, 4, 4);
      g.fillRect(12, 22, 2, 2);
      g.fillRect(18, 22, 2, 2);
      g.fillRect(14, 24, 4, 2);
      // Center: large joker face
      g.fillStyle(0x7C6EF0, 1);
      // Hat
      g.fillRect(24, 22, 24, 5);
      g.fillRect(30, 18, 12, 5);
      g.fillStyle(0xFFD43B, 1);
      g.fillRect(34, 15, 5, 5); // bell
      // Face
      g.fillStyle(0xFFE0BD, 1);
      g.fillRect(24, 27, 24, 20);
      // Eyes
      g.fillStyle(0x7C6EF0, 1);
      g.fillRect(28, 32, 5, 5);
      g.fillRect(40, 32, 5, 5);
      // Smile
      g.fillStyle(0xE03131, 1);
      g.fillRect(30, 42, 3, 3);
      g.fillRect(33, 43, 6, 3);
      g.fillRect(40, 42, 3, 3);
      // Bottom-right corner: J inverted
      g.fillStyle(0x7C6EF0, 1);
      g.fillRect(54, 52, 5, 8);
      g.fillRect(52, 52, 5, 3);
    });

    tile("sym-bomb", theme.symbols.bomb.bg, theme.symbols.bomb.border, (g) => {
      g.fillStyle(0xFF6B6B, 1); g.fillRect(34, 8, 4, 8);
      g.fillStyle(0xFFD43B, 1); g.fillRect(33, 4, 6, 6);
      g.fillStyle(0x555555, 1); g.fillCircle(36, 40, 20);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(26, 34, 4, 3); g.fillRect(28, 36, 4, 3);
      g.fillRect(42, 34, 4, 3); g.fillRect(40, 36, 4, 3);
      g.fillRect(30, 48, 3, 3); g.fillRect(33, 46, 6, 3); g.fillRect(39, 48, 3, 3);
    });

    tile("sym-ghost", theme.symbols.bankrupt.bg, theme.symbols.bankrupt.border, (g) => {
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(24, 18, 24, 6); g.fillRect(22, 24, 28, 24); g.fillRect(26, 14, 20, 4);
      g.fillRect(22, 48, 8, 6); g.fillRect(34, 48, 8, 6);
      g.fillRect(28, 48, 6, 3); g.fillRect(42, 48, 8, 6);
      g.fillStyle(0x2D2D2D, 1);
      g.fillRect(28, 28, 6, 8); g.fillRect(38, 28, 6, 8);
      g.fillRect(32, 40, 8, 5);
    });

    if (!this.textures.exists("fx-star")) {
      const g = this.add.graphics();
      g.fillStyle(0xFFD43B, 1); g.fillRect(0, 0, 8, 8);
      g.generateTexture("fx-star", 8, 8); g.destroy();
    }
  }
}
