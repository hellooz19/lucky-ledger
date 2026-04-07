import Phaser from "phaser";
import "./styles.css";
import { ResultScene } from "./scenes/ResultScene";
import { RunScene } from "./scenes/RunScene";
import { ShopScene } from "./scenes/ShopScene";
import { TitleScene } from "./scenes/TitleScene";
import { HelpScene } from "./scenes/HelpScene";
import { setTheme } from "./ui/theme";
import { SettingsRepository } from "./services/SettingsRepository";

// Detect mobile vs desktop and set resolution accordingly
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 600;
const BASE_WIDTH = isMobile ? 360 : 540;
const BASE_HEIGHT = isMobile ? 640 : 960;

export function applyBodyTheme(mode: "light" | "dark"): void {
  document.body.classList.toggle("dark", mode === "dark");
}

function boot(): void {
  const settings = new SettingsRepository().getSettings();
  setTheme(settings.themeMode);
  applyBodyTheme(settings.themeMode);

  const bgColor = settings.themeMode === "dark" ? "#1E2D3D" : "#D4F5FF";
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    antialias: false,
    backgroundColor: bgColor,
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
    scene: [TitleScene, RunScene, ShopScene, ResultScene, HelpScene]
  });

  window.addEventListener("resize", () => {
    game.scale.refresh();
  });
}

document.fonts.ready.then(() => boot());
