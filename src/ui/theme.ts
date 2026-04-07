export interface Theme {
  bg: { top: string; bottom: string };
  panel: { fill: string; border: string };
  button: { fill: string; border: string; shadow: string; text: string };
  text: { primary: string; secondary: string; accent: string };
  progress: { bg: string; border: string; fillStart: string; fillEnd: string };
  stats: {
    spins: { bg: string; border: string; text: string };
    mult: { bg: string; border: string; text: string };
    risk: { bg: string; border: string; text: string };
  };
  symbols: {
    coin: { bg: string; border: string };
    clover: { bg: string; border: string };
    star: { bg: string; border: string };
    wild: { bg: string; border: string };
    bomb: { bg: string; border: string };
    bankrupt: { bg: string; border: string };
  };
  decoration: { cloud: string; grass: string };
}

export const lightTheme: Theme = {
  bg: { top: "#D4F5FF", bottom: "#E8FFF0" },
  panel: { fill: "#FFFFF0", border: "#7BC67E" },
  button: { fill: "#FF9A3C", border: "#FFB86C", shadow: "#D47A1C", text: "#FFFFFF" },
  text: { primary: "#1A2332", secondary: "#888888", accent: "#FF9A3C" },
  progress: { bg: "#D4F0D4", border: "#7BC67E", fillStart: "#FFD43B", fillEnd: "#FF9A3C" },
  stats: {
    spins: { bg: "#FFF3BF", border: "#F0C040", text: "#8B6914" },
    mult: { bg: "#D4F0D4", border: "#7BC67E", text: "#2B8A3E" },
    risk: { bg: "#FFE8E8", border: "#FFA0A0", text: "#E03131" },
  },
  symbols: {
    coin: { bg: "#FFF8DC", border: "#F0C040" },
    clover: { bg: "#F0FFF0", border: "#7BC67E" },
    star: { bg: "#FFF3BF", border: "#F0C040" },
    wild: { bg: "#F0E8FF", border: "#C0C0C0" },
    bomb: { bg: "#FFF0F0", border: "#FFA0A0" },
    bankrupt: { bg: "#F3E8FF", border: "#C9A0FF" },
  },
  decoration: { cloud: "#FFFFFF", grass: "#7BC67E" },
};

export const darkTheme: Theme = {
  bg: { top: "#1E2D3D", bottom: "#243448" },
  panel: { fill: "#354860", border: "#6BC68E" },
  button: { fill: "#FF9A3C", border: "#FFB86C", shadow: "#D47A1C", text: "#FFFFFF" },
  text: { primary: "#E8F4E8", secondary: "#99AABB", accent: "#FFB347" },
  progress: { bg: "#2A4038", border: "#6BC68E", fillStart: "#FFD43B", fillEnd: "#FF9A3C" },
  stats: {
    spins: { bg: "#4A4428", border: "#F0C040", text: "#FFD43B" },
    mult: { bg: "#2A4038", border: "#6BC68E", text: "#69DB7C" },
    risk: { bg: "#4A2828", border: "#FFA0A0", text: "#FF6B6B" },
  },
  symbols: {
    coin: { bg: "#4A4428", border: "#F0C040" },
    clover: { bg: "#2A4038", border: "#7BC67E" },
    star: { bg: "#4A4428", border: "#F0C040" },
    wild: { bg: "#38384A", border: "#AAAAAA" },
    bomb: { bg: "#4A2828", border: "#FFA0A0" },
    bankrupt: { bg: "#382850", border: "#C9A0FF" },
  },
  decoration: { cloud: "#8EAABB", grass: "#5CAD78" },
};

let current: Theme = lightTheme;

export function getTheme(): Theme {
  return current;
}

export function setTheme(mode: "light" | "dark"): void {
  current = mode === "dark" ? darkTheme : lightTheme;
}

export function parseHex(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
