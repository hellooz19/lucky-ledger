import Phaser from "phaser";
import { getTheme, parseHex } from "./theme";

/**
 * Draw pixel-style clouds at the top of a scene.
 * Each cloud is a cluster of rectangles.
 */
export function drawClouds(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const theme = getTheme();
  const color = parseHex(theme.decoration.cloud);
  const g = scene.add.graphics();

  const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
    g.fillStyle(color, alpha);
    const s = scale;
    g.fillRect(cx, cy, 24 * s, 8 * s);
    g.fillRect(cx + 4 * s, cy - 6 * s, 16 * s, 6 * s);
    g.fillRect(cx + 8 * s, cy - 10 * s, 8 * s, 4 * s);
  };

  drawCloud(20, 14, 1.0, 0.55);
  drawCloud(120, 8, 0.7, 0.35);
  drawCloud(260, 18, 0.85, 0.45);

  return g;
}

/**
 * Draw a pixel grass bar at the bottom of a scene.
 */
export function drawGrassBar(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const { width, height } = scene.scale;
  const theme = getTheme();
  const color = parseHex(theme.decoration.grass);
  const g = scene.add.graphics();

  g.fillStyle(color, 1);
  g.fillRect(0, height - 10, width, 10);

  const darkGrass = parseHex(theme.decoration.grass) - 0x202020;
  for (let x = 0; x < width; x += 12) {
    const bladeHeight = 4 + (x * 7) % 6;
    g.fillStyle(x % 24 === 0 ? darkGrass : color, 1);
    g.fillRect(x, height - 10 - bladeHeight, 4, bladeHeight);
  }

  return g;
}
