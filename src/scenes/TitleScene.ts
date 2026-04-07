import Phaser from "phaser";
import { session } from "../game/session";
import { addSoftButton, addSoftPanel } from "../ui/softUi";

const UI_FONT = "Segoe UI, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    addSoftPanel(this, width / 2, px(88), px(320), px(110), 0x3f2f63, 0xffdeeb, px(20));
    this.add.text(width / 2, px(66), "Lucky Ledger", {
      fontFamily: UI_FONT,
      fontSize: `${px(34)}px`,
      color: "#ffe066"
    }).setOrigin(0.5);

    this.add.text(width / 2, px(100), "Debt Run Roguelite", {
      fontFamily: UI_FONT,
      fontSize: `${px(14)}px`,
      color: "#c0f5c8"
    }).setOrigin(0.5);

    const startY = px(188);
    const startBtn = addSoftButton(this, width / 2, startY, px(250), px(66), 0xff6b81, 0xffc2d1);
    this.add.text(width / 2, startY, "Start Run", {
      fontFamily: UI_FONT,
      fontSize: `${px(24)}px`,
      color: "#fff5f5"
    }).setOrigin(0.5);

    startBtn.on("pointerup", () => {
      session.startNewRun();
      this.scene.start("RunScene");
    });

    addSoftPanel(this, width / 2, px(356), px(320), px(230), 0x2e234a, 0xb197fc, px(18));
    this.add.text(width / 2, px(258), "Local Top Scores", {
      fontFamily: UI_FONT,
      fontSize: `${px(14)}px`,
      color: "#f8f9fa"
    }).setOrigin(0.5);

    const scores = session.leaderboard.getTopScores(5);
    if (scores.length > 0) {
      scores.forEach((row, idx) => {
        this.add.text(width / 2, px(286 + idx * 26), `#${idx + 1}  ${row.score}  /  R${row.roundReached}`, {
          fontFamily: UI_FONT,
          fontSize: `${px(13)}px`,
          color: "#e9ecef"
        }).setOrigin(0.5);
      });
    } else {
      this.add.text(width / 2, px(330), "No run yet", {
        fontFamily: UI_FONT,
        fontSize: `${px(13)}px`,
        color: "#adb5bd"
      }).setOrigin(0.5);
    }

    const settings = session.settingsRepository.getSettings();
    const rowY = height - px(56);
    const soundBtn = addSoftButton(this, width / 2 - px(84), rowY, px(156), px(36), 0x3b2f5c, 0xd0bfff);
    const vibeBtn = addSoftButton(this, width / 2 + px(84), rowY, px(156), px(36), 0x3b2f5c, 0xd0bfff);

    const soundText = this.add.text(width / 2 - px(84), rowY, `Sound: ${settings.soundOn ? "ON" : "OFF"}`, {
      fontFamily: UI_FONT,
      fontSize: `${px(12)}px`,
      color: "#f1f3f5"
    }).setOrigin(0.5);

    const vibeText = this.add.text(width / 2 + px(84), rowY, `Vibration: ${settings.vibrationOn ? "ON" : "OFF"}`, {
      fontFamily: UI_FONT,
      fontSize: `${px(12)}px`,
      color: "#f1f3f5"
    }).setOrigin(0.5);

    soundBtn.on("pointerup", () => {
      const next = session.settingsRepository.getSettings();
      next.soundOn = !next.soundOn;
      session.settingsRepository.setSettings(next);
      soundText.setText(`Sound: ${next.soundOn ? "ON" : "OFF"}`);
    });

    vibeBtn.on("pointerup", () => {
      const next = session.settingsRepository.getSettings();
      next.vibrationOn = !next.vibrationOn;
      session.settingsRepository.setSettings(next);
      vibeText.setText(`Vibration: ${next.vibrationOn ? "ON" : "OFF"}`);
    });
  }
}
