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
      g.fillStyle(parseHex(bgHex), 1);
      g.fillRect(0, 0, tileSize, tileSize);
      g.lineStyle(3, parseHex(borderHex), 1);
      g.strokeRect(1, 1, tileSize - 2, tileSize - 2);
      painter(g);
      g.generateTexture(key, tileSize, tileSize);
      g.destroy();
    };

    // Coin: cute face on yellow bg
    createTile("sym-coin", theme.symbols.coin.bg, theme.symbols.coin.border, (g) => {
      g.fillStyle(0xFFD43B, 1);
      g.fillCircle(36, 36, 22);
      g.lineStyle(3, 0xF0C040, 1);
      g.strokeCircle(36, 36, 22);
      g.fillStyle(0x5D4037, 1);
      g.fillRect(28, 30, 5, 6);
      g.fillRect(39, 30, 5, 6);
      g.fillStyle(0x5D4037, 1);
      g.fillRect(30, 41, 3, 3);
      g.fillRect(33, 43, 6, 3);
      g.fillRect(39, 41, 3, 3);
    });

    // Clover: flower with pink petals
    createTile("sym-clover", theme.symbols.clover.bg, theme.symbols.clover.border, (g) => {
      g.fillStyle(0xFF8FAB, 1);
      g.fillCircle(36, 24, 10);
      g.fillCircle(24, 36, 10);
      g.fillCircle(48, 36, 10);
      g.fillCircle(36, 48, 10);
      g.fillStyle(0xFFE066, 1);
      g.fillCircle(36, 36, 7);
      g.fillStyle(0x2B8A3E, 1);
      g.fillRect(34, 52, 4, 12);
    });

    // Bomb: angry face on gray sphere
    createTile("sym-bomb", theme.symbols.bomb.bg, theme.symbols.bomb.border, (g) => {
      g.fillStyle(0xFF6B6B, 1);
      g.fillRect(34, 8, 4, 8);
      g.fillStyle(0xFFD43B, 1);
      g.fillRect(33, 4, 6, 6);
      g.fillStyle(0x555555, 1);
      g.fillCircle(36, 40, 20);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(26, 34, 4, 3);
      g.fillRect(28, 36, 4, 3);
      g.fillRect(42, 34, 4, 3);
      g.fillRect(40, 36, 4, 3);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(30, 48, 3, 3);
      g.fillRect(33, 46, 6, 3);
      g.fillRect(39, 48, 3, 3);
    });

    // Bankrupt: ghost with wavy tail
    createTile("sym-ghost", theme.symbols.bankrupt.bg, theme.symbols.bankrupt.border, (g) => {
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(24, 18, 24, 6);
      g.fillRect(22, 24, 28, 24);
      g.fillRect(26, 14, 20, 4);
      g.fillRect(22, 48, 8, 6);
      g.fillRect(34, 48, 8, 6);
      g.fillRect(28, 48, 6, 3);
      g.fillRect(42, 48, 8, 6);
      g.fillStyle(0x2D2D2D, 1);
      g.fillRect(28, 28, 6, 8);
      g.fillRect(38, 28, 6, 8);
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
