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

    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    const saved = session.saveResultIfNeeded();
    const isVictory = session.state.roundIndex >= 12;

    const headerText = isVictory ? "VICTORY!" : "RUN OVER";
    const headerColor = isVictory ? "#1B9E5A" : "#E03131";
    const headerShadow = isVictory ? "#A8E6CF" : "#FFA0A0";

    this.add.text(width / 2, px(50), headerText, {
      fontFamily: PX_FONT, fontSize: `${px(16)}px`, color: headerColor,
      shadow: { offsetX: 2, offsetY: 2, color: headerShadow, fill: true, blur: 0 }
    }).setOrigin(0.5);

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
