import Phaser from "phaser";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";
import { PATTERNS } from "../game/patterns";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";

const HELP_SECTIONS = [
  {
    title: "HOW TO PLAY",
    lines: [
      "Spin the 3x3 grid!",
      "Match patterns to",
      "earn money. Reach",
      "the GOAL to clear.",
      "Clear 12 rounds to win!"
    ]
  },
  {
    title: "SYMBOLS (6)",
    lines: [
      "COIN   = +Money (val 2)",
      "FLOWER = +Multi (val 3)",
      "STAR   = Big $! (val 5)",
      "WILD   = Any sym (val 0)",
      "BOMB   = -Money  (val 2)",
      "GHOST  = Big loss(val 4)"
    ]
  },
  {
    title: "SCORING",
    lines: [
      "Reward per pattern:",
      "(symVal+1)x(patVal+1)",
      "  x multiplier",
      "Multiple patterns can",
      "hit at once = sum all!",
      "Negative syms ignore",
      "multiplier."
    ]
  },
  {
    title: "STATS",
    lines: [
      "SPINS = Fixed per round",
      "MULTI = Positive bonus",
      "RISK  = Bad luck up"
    ]
  },
  {
    title: "UPGRADES",
    lines: [
      "Pick 1 after each",
      "round clear. Boost",
      "money, bias, shield,",
      "multiplier cap, risk",
      "cool, or wild chance!"
    ]
  }
];

export class HelpScene extends Phaser.Scene {
  constructor() { super("HelpScene"); }

  create(): void {
    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    const bg = this.add.graphics();
    bg.fillGradientStyle(parseHex(theme.bg.top), parseHex(theme.bg.top), parseHex(theme.bg.bottom), parseHex(theme.bg.bottom), 1);
    bg.fillRect(0, 0, width, height);
    drawClouds(this);

    this.add.text(width / 2, px(30), "HELP", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    let yOffset = px(56);
    for (const section of HELP_SECTIONS) {
      const sectionH = px(12 + section.lines.length * 12);
      addSoftPanel(this, width / 2, yOffset + sectionH / 2, px(320), sectionH);
      this.add.text(px(30), yOffset + px(2), section.title, {
        fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.accent
      });
      section.lines.forEach((line, i) => {
        this.add.text(px(30), yOffset + px(12 + i * 12), line, {
          fontFamily: PX_FONT, fontSize: `${px(5)}px`, color: theme.text.primary
        });
      });
      yOffset += sectionH + px(6);
    }

    // Patterns section with mini grids
    const patH = px(12 + 14 * 10);
    addSoftPanel(this, width / 2, yOffset + patH / 2, px(320), patH);
    this.add.text(px(30), yOffset + px(2), "PATTERNS (14)", {
      fontFamily: PX_FONT, fontSize: `${px(6)}px`, color: theme.text.accent
    });

    const miniCell = px(6);
    const miniGap = px(1);
    PATTERNS.forEach((pat, idx) => {
      const bx = px(30);
      const by = yOffset + px(14) + idx * px(10);

      const gridG = this.add.graphics();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const ci = r * 3 + c;
          gridG.fillStyle(pat.positions.includes(ci) ? 0xFF9A3C : 0x888888, 1);
          gridG.fillRect(bx + c * (miniCell + miniGap), by + r * (miniCell + miniGap), miniCell, miniCell);
        }
      }

      this.add.text(bx + px(28), by + px(3), `${pat.name} (${pat.value})`, {
        fontFamily: PX_FONT, fontSize: `${px(4)}px`, color: theme.text.primary
      });
    });

    yOffset += patH + px(6);

    const backY = yOffset + px(24);
    const backBtn = addSoftButton(this, width / 2, backY, px(200), px(36));
    this.add.text(width / 2, backY, "BACK", {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.button.text
    }).setOrigin(0.5);
    backBtn.on("pointerup", () => this.scene.start("TitleScene"));

    drawGrassBar(this);
  }
}
