import Phaser from "phaser";
import { session } from "../game/session";
import type { UpgradeOption } from "../types";
import { addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";
const KR_FONT = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

const UPGRADE_COLORS: Record<string, { bg: string; border: string }> = {
  "cash-boost":      { bg: "#FFF3BF", border: "#F0C040" },
  "coin-bias":       { bg: "#FFF8DC", border: "#F0C040" },
  "reinforced-core": { bg: "#D4F0D4", border: "#7BC67E" },
  "lucky-draw":      { bg: "#F0E8FF", border: "#C9A0FF" },
  "cap-breaker":     { bg: "#F3E8FF", border: "#C9A0FF" },
  "risk-cooler":     { bg: "#FFE8E8", border: "#FFA0A0" },
};

export class ShopScene extends Phaser.Scene {
  private picking = false;

  constructor() {
    super("ShopScene");
  }

  create(): void {
    this.picking = false;
    this.input.enabled = true;
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    this.add.text(width / 2, px(50), "ROUND CLEAR!", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

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
    const y = px(190 + idx * 140);

    const colors = UPGRADE_COLORS[choice.id] ?? { bg: theme.panel.fill, border: theme.panel.border };
    const card = addSoftPanel(this, width / 2, y, px(290), px(110),
      parseHex(colors.bg), parseHex(colors.border)
    ).setInteractive({ useHandCursor: true });

    this.add.text(width / 2, y - px(22), choice.title, {
      fontFamily: PX_FONT, fontSize: `${px(9)}px`, color: theme.text.primary
    }).setOrigin(0.5);

    this.add.text(width / 2, y + px(14), choice.description, {
      fontFamily: KR_FONT, fontSize: `${px(12)}px`, color: theme.text.secondary,
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
      if (session.state.roundIndex >= 12) {
        session.state.gameOver = true;
        this.time.delayedCall(30, () => this.scene.start("ResultScene"));
      } else {
        this.time.delayedCall(30, () => this.scene.start("RunScene"));
      }
    });
  }
}
