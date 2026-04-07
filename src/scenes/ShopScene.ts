import Phaser from "phaser";
import { session } from "../game/session";
import type { UpgradeOption } from "../types";
import { addSoftPanel } from "../ui/softUi";

const UI_FONT = "Segoe UI, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif";

export class ShopScene extends Phaser.Scene {
  private picking = false;

  constructor() {
    super("ShopScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    addSoftPanel(this, width / 2, px(78), px(304), px(76), 0x3f2f63, 0xffdeeb, px(18));
    this.add.text(width / 2, px(64), "Round Clear", {
      fontFamily: UI_FONT,
      fontSize: `${px(24)}px`,
      color: "#8ce99a"
    }).setOrigin(0.5);

    this.add.text(width / 2, px(96), "Pick 1 upgrade", {
      fontFamily: UI_FONT,
      fontSize: `${px(13)}px`,
      color: "#f8f9fa"
    }).setOrigin(0.5);

    const choices = session.getUpgradeChoices();
    choices.forEach((choice, idx) => this.renderChoice(choice, idx, s));
  }

  private renderChoice(choice: UpgradeOption, idx: number, s: number): void {
    const { width } = this.scale;
    const px = (n: number) => Math.round(n * s);
    const y = px(178 + idx * 130);
    const card = addSoftPanel(this, width / 2, y, px(286), px(106), 0x35294f, 0xeebefa, px(18)).setInteractive({ useHandCursor: true });

    this.add.text(width / 2, y - px(20), choice.title, {
      fontFamily: UI_FONT,
      fontSize: `${px(18)}px`,
      color: "#ffd43b"
    }).setOrigin(0.5);

    this.add.text(width / 2, y + px(14), choice.description, {
      fontFamily: UI_FONT,
      fontSize: `${px(12)}px`,
      color: "#f1f3f5"
    }).setOrigin(0.5);

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
