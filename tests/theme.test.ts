import { describe, expect, it } from "vitest";
import { getTheme, setTheme, lightTheme, darkTheme, parseHex } from "../src/ui/theme";
import type { Theme } from "../src/ui/theme";

describe("Theme System", () => {
  it("returns light theme by default", () => {
    setTheme("light");
    const theme = getTheme();
    expect(theme).toBe(lightTheme);
    expect(theme.bg.top).toBe("#D4F5FF");
  });

  it("switches to dark theme", () => {
    setTheme("dark");
    const theme = getTheme();
    expect(theme).toBe(darkTheme);
    expect(theme.bg.top).toBe("#1A2332");
  });

  it("both themes have all required keys", () => {
    const requiredKeys: (keyof Theme)[] = [
      "bg", "panel", "button", "text", "progress",
      "stats", "symbols", "decoration"
    ];
    for (const key of requiredKeys) {
      expect(lightTheme).toHaveProperty(key);
      expect(darkTheme).toHaveProperty(key);
    }
  });

  it("parseHex converts hex strings to Phaser-compatible numbers", () => {
    expect(parseHex("#FF9A3C")).toBe(0xFF9A3C);
    expect(parseHex("#1A2332")).toBe(0x1A2332);
  });
});
