import Phaser from "phaser";

function textureKey(prefix: string, w: number, h: number, fill: number, border: number, radius: number): string {
  return `${prefix}-${w}x${h}-${fill.toString(16)}-${border.toString(16)}-${radius}`;
}

export function addSoftPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  border: number,
  radius = 18
): Phaser.GameObjects.Image {
  const key = textureKey("soft-panel", w, h, fill, border, radius);
  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    g.fillStyle(fill, 1);
    g.fillRoundedRect(0, 0, w, h, radius);

    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(2, 2, w - 4, Math.max(10, Math.floor(h * 0.35)), Math.max(8, radius - 3));

    g.fillStyle(0x000000, 0.14);
    g.fillRoundedRect(2, h - Math.max(10, Math.floor(h * 0.16)), w - 4, Math.max(8, Math.floor(h * 0.14)), Math.max(6, radius - 4));

    g.lineStyle(2, border, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, radius);
    g.generateTexture(key, w, h);
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
  fill: number,
  border: number
): Phaser.GameObjects.Image {
  const button = addSoftPanel(scene, x, y, w, h, fill, border, 20).setInteractive({ useHandCursor: true });
  button.on("pointerdown", () => button.setScale(0.98));
  button.on("pointerup", () => button.setScale(1));
  button.on("pointerout", () => button.setScale(1));
  return button;
}
