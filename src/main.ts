import Phaser from "phaser";
import "./styles.css";
import { ResultScene } from "./scenes/ResultScene";
import { RunScene } from "./scenes/RunScene";
import { ShopScene } from "./scenes/ShopScene";
import { TitleScene } from "./scenes/TitleScene";
import { setTheme } from "./ui/theme";
import { SettingsRepository } from "./services/SettingsRepository";

const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

function boot(): void {
  const settings = new SettingsRepository().getSettings();
  setTheme(settings.themeMode);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    antialias: false,
    backgroundColor: "#D4F5FF",
    render: {
      antialias: false,
      pixelArt: true,
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
}

document.fonts.ready.then(() => boot());
