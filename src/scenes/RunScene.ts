import Phaser from "phaser";
import { session } from "../game/session";
import type { SymbolId } from "../types";
import { addSoftButton, addSoftPanel } from "../ui/softUi";

const UI_FONT = "Segoe UI, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif";

export class RunScene extends Phaser.Scene {
  private roundText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private needText!: Phaser.GameObjects.Text;
  private spinsText!: Phaser.GameObjects.Text;
  private multiText!: Phaser.GameObjects.Text;
  private riskText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private progressFill!: Phaser.GameObjects.Graphics;
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
    bankrupt: "sym-rip"
  };

  constructor() {
    super("RunScene");
  }

  create(): void {
    const { width, height } = this.scale;
    this.uiScale = Math.max(0.8, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * this.uiScale);

    this.buildSymbolTextures();

    addSoftPanel(this, width / 2, px(46), width - px(24), px(62), 0x3b2f5c, 0xffc9de, px(18));
    this.roundText = this.add.text(px(24), px(24), "", { fontFamily: UI_FONT, fontSize: `${px(15)}px`, color: "#ffe8cc" });
    this.scoreText = this.add.text(width - px(24), px(24), "", { fontFamily: UI_FONT, fontSize: `${px(15)}px`, color: "#fff0f6" }).setOrigin(1, 0);

    addSoftPanel(this, width / 2, px(116), width - px(24), px(88), 0x463a6d, 0xd0bfff, px(18));
    this.moneyText = this.add.text(px(24), px(94), "", { fontFamily: UI_FONT, fontSize: `${px(24)}px`, color: "#b2f2bb" });
    this.targetText = this.add.text(px(24), px(124), "", { fontFamily: UI_FONT, fontSize: `${px(13)}px`, color: "#ffe8cc" });
    this.needText = this.add.text(width - px(24), px(124), "", { fontFamily: UI_FONT, fontSize: `${px(13)}px`, color: "#ffd8a8" }).setOrigin(1, 0);

    addSoftPanel(this, width / 2, px(184), width - px(40), px(20), 0x2b223f, 0x9775fa, px(10));
    this.progressFill = this.add.graphics();
    this.progressText = this.add.text(width / 2, px(184), "", { fontFamily: UI_FONT, fontSize: `${px(11)}px`, color: "#fff0f6" }).setOrigin(0.5);

    addSoftPanel(this, width / 2, px(236), width - px(24), px(56), 0x2f2746, 0xb197fc, px(16));
    this.spinsText = this.add.text(px(24), px(218), "", { fontFamily: UI_FONT, fontSize: `${px(16)}px`, color: "#a5d8ff" });
    this.multiText = this.add.text(width / 2, px(218), "", { fontFamily: UI_FONT, fontSize: `${px(16)}px`, color: "#e5dbff" }).setOrigin(0.5, 0);
    this.riskText = this.add.text(width - px(24), px(218), "", { fontFamily: UI_FONT, fontSize: `${px(16)}px`, color: "#69db7c" }).setOrigin(1, 0);

    addSoftPanel(this, width / 2, px(352), px(312), px(178), 0x201933, 0xffdeeb, px(20));
    this.add.text(width / 2, px(274), "Reel", { fontFamily: UI_FONT, fontSize: `${px(14)}px`, color: "#ffd8a8" }).setOrigin(0.5);

    const reelX = [width / 2 - px(90), width / 2, width / 2 + px(90)];
    reelX.forEach((x) => {
      addSoftPanel(this, x, px(352), px(76), px(122), 0x3a2f57, 0xeebefa, px(14));
      const icon = this.add.image(x, px(352), this.symbolTextureById.coin).setDisplaySize(px(58), px(58));
      this.reelIcons.push(icon);
    });

    this.log = this.add.text(width / 2, px(430), "", {
      fontFamily: UI_FONT,
      fontSize: `${px(13)}px`,
      color: "#fff5f5",
      wordWrap: { width: width - px(70) },
      align: "center"
    }).setOrigin(0.5, 0.5);

    this.spinButton = addSoftButton(this, width / 2, height - px(96), px(292), px(86), 0xfa5252, 0xff8787);
    this.spinLabel = this.add.text(width / 2, height - px(96), "SPIN", { fontFamily: UI_FONT, fontSize: `${px(32)}px`, color: "#fff5f5" }).setOrigin(0.5);

    this.spinButton.on("pointerup", () => this.onSpin());
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
          this.spawnSparkleBurst(this.scale.width / 2, Math.round(352 * this.uiScale), Math.min(18, 8 + Math.floor(outcome.deltaMoney / 22)));
        }
        this.log.setText(`${outcome.message}\n${outcome.deltaMoney >= 0 ? "+" : ""}${outcome.deltaMoney}`);
      }

      if (session.settingsRepository.getSettings().vibrationOn && navigator.vibrate) {
        navigator.vibrate(20);
      }
      this.renderState();
      this.isSpinning = false;
      this.spinButton.setInteractive({ useHandCursor: true });
      this.spinLabel.setText("SPIN");

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
    const progressRatio = Phaser.Math.Clamp(s.currentMoney / s.debtTarget, 0, 1);
    const progressWidth = (this.scale.width - px(44)) * progressRatio;
    const needMoney = Math.max(0, s.debtTarget - s.currentMoney);

    this.roundText.setText(`ROUND ${s.roundIndex}`);
    this.scoreText.setText(`SCORE ${s.score}`);
    this.moneyText.setText(`$${s.currentMoney}`);
    this.targetText.setText(`TARGET $${s.debtTarget}`);
    this.needText.setText(`NEED $${needMoney}`);
    this.spinsText.setText(`SPINS ${s.spinsLeft}/${s.maxSpinsPerRound}`);
    this.multiText.setText(`MULTI x${s.multiplier}/${s.maxMultiplier}`);
    this.riskText.setText(`RISK ${s.riskMeter}%`);
    this.progressText.setText(`${Math.round(progressRatio * 100)}% CLEARED`);
    this.riskText.setColor(this.getRiskColor(s.riskMeter));

    this.progressFill.clear();
    const fillColor = progressRatio >= 1 ? 0x69db7c : progressRatio > 0.6 ? 0xa9e34b : 0xff922b;
    this.progressFill.fillStyle(fillColor, 1);
    this.progressFill.fillRect(px(22), px(175), progressWidth, px(18));
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
          icon.angle += 16;
        });
      }
    });

    this.time.delayedCall(740, () => {
      ticker.remove(false);
      this.reelIcons.forEach((icon) => {
        icon.angle = 0;
      });
      onComplete();
    });
  }

  private spawnSparkleBurst(x: number, y: number, amount: number): void {
    for (let i = 0; i < amount; i += 1) {
      const star = this.add.image(x, y, "fx-star").setScale(Phaser.Math.FloatBetween(0.42, 0.76) * this.uiScale);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(30, 90) * this.uiScale;
      const tx = x + Math.cos(angle) * distance;
      const ty = y + Math.sin(angle) * distance;
      this.tweens.add({
        targets: star,
        x: tx,
        y: ty,
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-2, 2),
        duration: Phaser.Math.Between(300, 500),
        onComplete: () => star.destroy()
      });
    }
  }

  private getRiskColor(risk: number): string {
    if (risk < 35) {
      return "#69db7c";
    }
    if (risk < 70) {
      return "#ffd43b";
    }
    return "#ff6b6b";
  }

  private buildSymbolTextures(): void {
    if (this.textures.exists("sym-coin")) {
      return;
    }

    const tileSize = 72;
    const createTile = (key: string, painter: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0);
      g.fillRoundedRect(0, 0, tileSize, tileSize, 14);
      painter(g);
      g.generateTexture(key, tileSize, tileSize);
      g.destroy();
    };

    createTile("fx-star", (g) => {
      g.fillStyle(0xffec99, 1);
      g.fillTriangle(18, 36, 36, 18, 54, 36);
      g.fillTriangle(18, 36, 36, 54, 54, 36);
      g.lineStyle(2, 0xffd43b, 1);
      g.strokeTriangle(18, 36, 36, 18, 54, 36);
      g.strokeTriangle(18, 36, 36, 54, 54, 36);
    });

    createTile("sym-coin", (g) => {
      g.fillStyle(0xffe066, 1);
      g.fillCircle(36, 36, 26);
      g.lineStyle(4, 0xf08c00, 1);
      g.strokeCircle(36, 36, 26);
      g.fillStyle(0x212529, 1);
      g.fillCircle(29, 33, 2.7);
      g.fillCircle(43, 33, 2.7);
      g.lineStyle(2, 0x212529, 1);
      g.strokeLineShape(new Phaser.Geom.Line(30, 41, 36, 44));
      g.strokeLineShape(new Phaser.Geom.Line(36, 44, 42, 41));
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(28, 25, 6);
    });

    createTile("sym-clover", (g) => {
      g.fillStyle(0x69db7c, 1);
      g.fillCircle(28, 28, 11);
      g.fillCircle(44, 28, 11);
      g.fillCircle(28, 44, 11);
      g.fillCircle(44, 44, 11);
      g.fillRoundedRect(34, 45, 4, 14, 2);
      g.lineStyle(3, 0x2f9e44, 1);
      g.strokeCircle(28, 28, 11);
      g.strokeCircle(44, 28, 11);
      g.strokeCircle(28, 44, 11);
      g.strokeCircle(44, 44, 11);
      g.fillStyle(0x1b4332, 1);
      g.fillCircle(33, 35, 2.4);
      g.fillCircle(39, 35, 2.4);
      g.lineStyle(1.8, 0x1b4332, 1);
      g.strokeLineShape(new Phaser.Geom.Line(32, 39, 36, 41));
      g.strokeLineShape(new Phaser.Geom.Line(36, 41, 40, 39));
    });

    createTile("sym-bomb", (g) => {
      g.fillStyle(0x495057, 1);
      g.fillCircle(36, 41, 20);
      g.fillStyle(0xadb5bd, 1);
      g.fillCircle(28, 33, 5);
      g.fillStyle(0xf08c00, 1);
      g.fillRoundedRect(35, 14, 4, 12, 1);
      g.fillStyle(0xff6b6b, 1);
      g.fillCircle(37, 11, 5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(31, 39, 2.2);
      g.fillCircle(41, 39, 2.2);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeLineShape(new Phaser.Geom.Line(31, 46, 36, 43));
      g.strokeLineShape(new Phaser.Geom.Line(36, 43, 41, 46));
    });

    createTile("sym-rip", (g) => {
      g.fillStyle(0x364fc7, 1);
      g.fillRoundedRect(14, 14, 44, 44, 12);
      g.lineStyle(4, 0xff8787, 1);
      g.strokeLineShape(new Phaser.Geom.Line(24, 24, 48, 48));
      g.strokeLineShape(new Phaser.Geom.Line(48, 24, 24, 48));
      g.fillStyle(0xffffff, 1);
      g.fillCircle(28, 34, 2.3);
      g.fillCircle(44, 34, 2.3);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeLineShape(new Phaser.Geom.Line(31, 43, 36, 40));
      g.strokeLineShape(new Phaser.Geom.Line(36, 40, 41, 43));
    });
  }
}
