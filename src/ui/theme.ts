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
  bg: { top: "#1A2332", bottom: "#1E2A3A" },
  panel: { fill: "#2A3442", border: "#5CAD78" },
  button: { fill: "#FF9A3C", border: "#FFB86C", shadow: "#D47A1C", text: "#FFFFFF" },
  text: { primary: "#E8F0E8", secondary: "#8899AA", accent: "#FF9A3C" },
  progress: { bg: "#1E3328", border: "#5CAD78", fillStart: "#FFD43B", fillEnd: "#FF9A3C" },
  stats: {
    spins: { bg: "#3A3420", border: "#F0C040", text: "#FFD43B" },
    mult: { bg: "#1E3328", border: "#5CAD78", text: "#69DB7C" },
    risk: { bg: "#3A2020", border: "#FFA0A0", text: "#FF6B6B" },
  },
  symbols: {
    coin: { bg: "#3A3420", border: "#F0C040" },
    clover: { bg: "#1E3328", border: "#7BC67E" },
    star: { bg: "#3A3420", border: "#F0C040" },
    wild: { bg: "#2A2A3A", border: "#888888" },
    bomb: { bg: "#3A2020", border: "#FFA0A0" },
    bankrupt: { bg: "#2A2040", border: "#C9A0FF" },
  },
  decoration: { cloud: "#FFFFFF", grass: "#5CAD78" },
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
