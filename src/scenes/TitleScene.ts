import Phaser from "phaser";
import { session } from "../game/session";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex, setTheme } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";
import { applyBodyTheme } from "../main";

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

    const bgTop = parseHex(theme.bg.top);
    const bgBot = parseHex(theme.bg.bottom);
    const bg = this.add.graphics();
    bg.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
    bg.fillRect(0, 0, width, height);

    drawClouds(this);

    this.add.text(width / 2, px(60), "LUCKY", {
      fontFamily: PX_FONT, fontSize: `${px(24)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    this.add.text(width / 2, px(90), "LEDGER", {
      fontFamily: PX_FONT, fontSize: `${px(24)}px`, color: "#FF9A3C",
      shadow: { offsetX: 2, offsetY: 2, color: "#FFD8A8", fill: true, blur: 0 }
    }).setOrigin(0.5);

    this.add.text(width / 2, px(116), "~ DEBT RUN ROGUELIKE ~", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    const startY = px(170);
    const startBtn = addSoftButton(this, width / 2, startY, px(240), px(56));
    this.add.text(width / 2, startY, "START RUN", {
      fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: theme.button.text
    }).setOrigin(0.5);

    startBtn.on("pointerup", () => {
      session.startNewRun();
      this.scene.start("RunScene");
    });

    // Help button
    const helpBtn = addSoftButton(this, width - px(30), px(30), px(36), px(36),
      parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(width - px(30), px(30), "?", {
      fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: theme.text.accent
    }).setOrigin(0.5);
    helpBtn.on("pointerup", () => this.scene.start("HelpScene", { from: "TitleScene" }));

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

    const settings = session.settingsRepository.getSettings();
    const rowY = height - px(52);
    const btnW = px(100);
    const btnH = px(30);

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
      applyBodyTheme(next.themeMode);
      this.scene.restart();
    });

    drawGrassBar(this);
  }
}
