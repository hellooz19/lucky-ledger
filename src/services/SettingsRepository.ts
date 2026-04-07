import type { GameSettings, RunMeta } from "../types";

const SETTINGS_KEY = "game2.settings";
const META_KEY = "game2.meta";

const DEFAULT_SETTINGS: GameSettings = {
  soundOn: true,
  vibrationOn: true
};

const DEFAULT_META: RunMeta = {
  runsPlayed: 0,
  bestRound: 0
};

export class SettingsRepository {
  getSettings(): GameSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        soundOn: parsed.soundOn ?? DEFAULT_SETTINGS.soundOn,
        vibrationOn: parsed.vibrationOn ?? DEFAULT_SETTINGS.vibrationOn
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  setSettings(next: GameSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  getMeta(): RunMeta {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      return { ...DEFAULT_META };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<RunMeta>;
      return {
        runsPlayed: parsed.runsPlayed ?? DEFAULT_META.runsPlayed,
        bestRound: parsed.bestRound ?? DEFAULT_META.bestRound
      };
    } catch {
      return { ...DEFAULT_META };
    }
  }

  saveMeta(meta: RunMeta): void {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }
}
