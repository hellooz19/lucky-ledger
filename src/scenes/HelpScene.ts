import Phaser from "phaser";
import { addSoftButton, addSoftPanel } from "../ui/softUi";
import { getTheme, parseHex } from "../ui/theme";
import { drawClouds, drawGrassBar } from "../ui/pixelDeco";
import { PATTERNS } from "../game/patterns";

const PX_FONT = "'Press Start 2P', 'Courier New', monospace";
const KR_FONT = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

interface HelpPage {
  title: string;
  render: (scene: Phaser.Scene, px: (n: number) => number, width: number, startY: number) => void;
}

const PAGES: HelpPage[] = [
  {
    title: "RULES",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const lines = [
        "3x3 그리드를 돌려서",
        "패턴을 맞추면 돈을 벌어요!",
        "",
        "목표 금액에 도달하면",
        "라운드 클리어!",
        "",
        "12라운드를 클리어하면 승리!",
        "",
        "스핀이 다 떨어지기 전에",
        "목표를 달성하세요!",
      ];
      let lineY = y;
      lines.forEach((line) => {
        if (line === "") { lineY += px(14); return; }
        scene.add.text(width / 2, lineY, line, {
          fontFamily: KR_FONT, fontSize: `${px(12)}px`, color: theme.text.primary
        }).setOrigin(0.5);
        lineY += px(24);
      });
    }
  },
  {
    title: "SYMBOLS",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const symbols = [
        { name: "COIN", val: "+2", desc: "돈을 벌어요" },
        { name: "FLOWER", val: "+3", desc: "배율이 올라요" },
        { name: "STAR", val: "+5", desc: "큰 보너스" },
        { name: "JOKER", val: " 0", desc: "아무 심볼 대체" },
        { name: "BOMB", val: "-2", desc: "돈 손실 + 위험" },
        { name: "GHOST", val: "-4", desc: "대규모 손실" },
      ];
      symbols.forEach((sym, i) => {
        const sy = y + i * px(42);
        addSoftPanel(scene, width / 2, sy, px(300), px(32));
        scene.add.text(px(36), sy, sym.name, {
          fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.accent
        }).setOrigin(0, 0.5);
        scene.add.text(px(160), sy, `(${sym.val})`, {
          fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.secondary
        }).setOrigin(0, 0.5);
        scene.add.text(width - px(36), sy, sym.desc, {
          fontFamily: KR_FONT, fontSize: `${px(10)}px`, color: theme.text.primary
        }).setOrigin(1, 0.5);
      });
    }
  },
  {
    title: "SCORING",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const lines = [
        { text: "[ 보상 계산 공식 ]", accent: true },
        { text: "", accent: false },
        { text: "(심볼가치 + 1)", accent: false },
        { text: "x (패턴가치 + 1)", accent: false },
        { text: "x 배율", accent: false },
        { text: "", accent: false },
        { text: "여러 패턴이 동시에", accent: false },
        { text: "맞으면 전부 합산!", accent: false },
        { text: "", accent: false },
        { text: "폭탄/유령은", accent: false },
        { text: "배율 적용 안 됨", accent: true },
      ];
      let lineY = y;
      lines.forEach((line) => {
        if (line.text === "") { lineY += px(14); return; }
        scene.add.text(width / 2, lineY, line.text, {
          fontFamily: KR_FONT, fontSize: `${px(12)}px`,
          color: line.accent ? theme.text.accent : theme.text.primary
        }).setOrigin(0.5);
        lineY += px(24);
      });
    }
  },
  {
    title: "PATTERNS 1/2",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const half = PATTERNS.slice(0, 7);
      const miniCell = px(12);
      const miniGap = px(2);
      const rowH = miniCell * 3 + miniGap * 2;

      half.forEach((pat, idx) => {
        const by = y + idx * (rowH + px(14));
        const bx = px(40);

        addSoftPanel(scene, width / 2, by + rowH / 2, px(300), rowH + px(8));

        const gridG = scene.add.graphics();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const ci = r * 3 + c;
            gridG.fillStyle(pat.positions.includes(ci) ? 0xFF9A3C : 0x555555, 1);
            gridG.fillRect(bx + c * (miniCell + miniGap), by + r * (miniCell + miniGap), miniCell, miniCell);
          }
        }

        scene.add.text(bx + px(56), by + rowH / 2, pat.name, {
          fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
        }).setOrigin(0, 0.5);
        scene.add.text(width - px(40), by + rowH / 2, `x${pat.value + 1}`, {
          fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.accent
        }).setOrigin(1, 0.5);
      });
    }
  },
  {
    title: "PATTERNS 2/2",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const half = PATTERNS.slice(7);
      const miniCell = px(12);
      const miniGap = px(2);
      const rowH = miniCell * 3 + miniGap * 2;

      half.forEach((pat, idx) => {
        const by = y + idx * (rowH + px(14));
        const bx = px(40);

        addSoftPanel(scene, width / 2, by + rowH / 2, px(300), rowH + px(8));

        const gridG = scene.add.graphics();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const ci = r * 3 + c;
            gridG.fillStyle(pat.positions.includes(ci) ? 0xFF9A3C : 0x555555, 1);
            gridG.fillRect(bx + c * (miniCell + miniGap), by + r * (miniCell + miniGap), miniCell, miniCell);
          }
        }

        scene.add.text(bx + px(56), by + rowH / 2, pat.name, {
          fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.primary
        }).setOrigin(0, 0.5);
        scene.add.text(width - px(40), by + rowH / 2, `x${pat.value + 1}`, {
          fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.accent
        }).setOrigin(1, 0.5);
      });
    }
  },
  {
    title: "UPGRADES",
    render: (scene, px, width, y) => {
      const theme = getTheme();
      const upgrades = [
        { name: "Cash Boost", desc: "소지금 +40" },
        { name: "Coin Bias", desc: "코인 확률 +8" },
        { name: "Shield", desc: "폭탄 1회 무효화" },
        { name: "Lucky Draw", desc: "조커 확률 +10" },
        { name: "Cap Breaker", desc: "최대 배율 +1" },
        { name: "Risk Cooler", desc: "위험도 -20" },
      ];
      upgrades.forEach((upg, i) => {
        const sy = y + i * px(42);
        addSoftPanel(scene, width / 2, sy, px(300), px(32));
        scene.add.text(px(36), sy, upg.name, {
          fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.accent
        }).setOrigin(0, 0.5);
        scene.add.text(width - px(36), sy, upg.desc, {
          fontFamily: KR_FONT, fontSize: `${px(10)}px`, color: theme.text.primary
        }).setOrigin(1, 0.5);
      });
    }
  }
];

let currentPageIndex = 0;

export class HelpScene extends Phaser.Scene {
  private returnScene = "TitleScene";

  constructor() { super("HelpScene"); }

  create(data?: { from?: string }): void {
    if (data?.from) {
      this.returnScene = data.from;
    }
    this.drawPage(currentPageIndex);
  }

  private drawPage(pageIdx: number): void {
    this.children.removeAll(true);

    const { width, height } = this.scale;
    const theme = getTheme();
    const s = Math.max(0.82, Math.min(width / 360, height / 640));
    const px = (n: number) => Math.round(n * s);

    currentPageIndex = Phaser.Math.Clamp(pageIdx, 0, PAGES.length - 1);
    const page = PAGES[currentPageIndex];

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(parseHex(theme.bg.top), parseHex(theme.bg.top), parseHex(theme.bg.bottom), parseHex(theme.bg.bottom), 1);
    bg.fillRect(0, 0, width, height);
    drawClouds(this);

    // Header
    this.add.text(width / 2, px(26), "HELP", {
      fontFamily: PX_FONT, fontSize: `${px(14)}px`, color: "#1B9E5A",
      shadow: { offsetX: 2, offsetY: 2, color: "#A8E6CF", fill: true, blur: 0 }
    }).setOrigin(0.5);

    // Page title
    this.add.text(width / 2, px(56), page.title, {
      fontFamily: PX_FONT, fontSize: `${px(10)}px`, color: theme.text.accent
    }).setOrigin(0.5);

    // Page content
    page.render(this, px, width, px(90));

    // Back button — top left, same style as RunScene
    const backBtn = addSoftButton(this, px(16), px(26), px(24), px(20), parseHex(theme.panel.fill), parseHex(theme.panel.border));
    this.add.text(px(16), px(26), "<", {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.accent
    }).setOrigin(0.5);
    backBtn.on("pointerup", () => {
      currentPageIndex = 0;
      this.scene.start(this.returnScene);
    });

    // Bottom nav: < [page indicator] >
    const navY = height - px(40);

    if (currentPageIndex > 0) {
      const prevBtn = addSoftButton(this, px(50), navY, px(50), px(32), parseHex(theme.panel.fill), parseHex(theme.panel.border));
      this.add.text(px(50), navY, "<", { fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: theme.text.accent }).setOrigin(0.5);
      prevBtn.on("pointerup", () => this.drawPage(currentPageIndex - 1));
    }

    this.add.text(width / 2, navY, `${currentPageIndex + 1} / ${PAGES.length}`, {
      fontFamily: PX_FONT, fontSize: `${px(8)}px`, color: theme.text.secondary
    }).setOrigin(0.5);

    if (currentPageIndex < PAGES.length - 1) {
      const nextBtn = addSoftButton(this, width - px(50), navY, px(50), px(32), parseHex(theme.panel.fill), parseHex(theme.panel.border));
      this.add.text(width - px(50), navY, ">", { fontFamily: PX_FONT, fontSize: `${px(12)}px`, color: theme.text.accent }).setOrigin(0.5);
      nextBtn.on("pointerup", () => this.drawPage(currentPageIndex + 1));
    }

    drawGrassBar(this);
  }
}
