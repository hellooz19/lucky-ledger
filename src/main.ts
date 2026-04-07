import Phaser from "phaser";
import "./styles.css";
import { ResultScene } from "./scenes/ResultScene";
import { RunScene } from "./scenes/RunScene";
import { ShopScene } from "./scenes/ShopScene";
import { TitleScene } from "./scenes/TitleScene";

const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  antialias: true,
  backgroundColor: "#111418",
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    width: BASE_WIDTH,
    height: BASE_HEIGHT
  },
  scene: [TitleScene, RunScene, ShopScene, ResultScene]
});

window.addEventListener("resize", () => {
  game.scale.refresh();
});
