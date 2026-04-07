import Phaser from "phaser";
import { session } from "../game/session";
import { addSoftButton, addSoftPanel } from "../ui/softUi";

const UI_FONT = "Segoe UI, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif";

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    const saved = session.saveResultIfNeeded();
    const topScores = session.leaderboard.getTopScores(5);

    addSoftPanel(this, width / 2, px(118), px(322), px(154), 0x3f2f63, 0xffdeeb, px(18));
    this.add.text(width / 2, px(64), "Run Over", {
      fontFamily: UI_FONT,
      fontSize: `${px(26)}px`,
      color: "#ff8787"
    }).setOrigin(0.5);

    this.add.text(width / 2, px(118), `Score ${session.state.score}`, {
      fontFamily: UI_FONT,
      fontSize: `${px(20)}px`,
      color: "#f8f9fa"
    }).setOrigin(0.5);

    this.add.text(width / 2, px(146), `Round ${session.state.roundIndex}`, {
      fontFamily: UI_FONT,
      fontSize: `${px(14)}px`,
      color: "#dee2e6"
    }).setOrigin(0.5);

    if (saved) {
      this.add.text(width / 2, px(176), "Saved to local leaderboard", {
        fontFamily: UI_FONT,
        fontSize: `${px(12)}px`,
        color: "#69db7c"
      }).setOrigin(0.5);
    }

    addSoftPanel(this, width / 2, px(266), px(322), px(128), 0x2e234a, 0xb197fc, px(18));
    this.add.text(width / 2, px(218), "Top 5", {
      fontFamily: UI_FONT,
      fontSize: `${px(14)}px`,
      color: "#ffd43b"
    }).setOrigin(0.5);

    topScores.forEach((row, idx) => {
      this.add.text(width / 2, px(244 + idx * 22), `${idx + 1}. ${row.score} (R${row.roundReached})`, {
        fontFamily: UI_FONT,
        fontSize: `${px(12)}px`,
        color: "#ced4da"
      }).setOrigin(0.5);
    });

    const retryY = height - px(136);
    const retryButton = addSoftButton(this, width / 2, retryY, px(232), px(58), 0x37b24d, 0x8ce99a);
    this.add.text(width / 2, retryY, "Retry", {
      fontFamily: UI_FONT,
      fontSize: `${px(20)}px`,
      color: "#081c15"
    }).setOrigin(0.5);
    retryButton.on("pointerup", () => {
      session.startNewRun();
      this.scene.start("RunScene");
    });

    const titleY = height - px(70);
    const titleButton = addSoftButton(this, width / 2, titleY, px(232), px(48), 0x4c6ef5, 0xa5d8ff);
    this.add.text(width / 2, titleY, "Title", {
      fontFamily: UI_FONT,
      fontSize: `${px(16)}px`,
      color: "#edf2ff"
    }).setOrigin(0.5);
    titleButton.on("pointerup", () => this.scene.start("TitleScene"));
  }
}
