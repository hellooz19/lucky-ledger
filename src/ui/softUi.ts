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
    g.fillStyle(f, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(3, b, 1);
    g.strokeRect(1, 1, w - 2, h - 2);
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
    g.fillStyle(shadowColor, 1);
    g.fillRect(4, 4, w, h);
    g.fillStyle(f, 1);
    g.fillRect(0, 0, w, h);
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
