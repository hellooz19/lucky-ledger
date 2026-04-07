import type { ScoreEntry } from "../types";

const SCORE_KEY = "game2.bestScores";

export class LeaderboardRepository {
  getTopScores(limit = 10): ScoreEntry[] {
    const rows = this.readAll();
    return rows
      .slice()
      .sort((a, b) => b.score - a.score || b.roundReached - a.roundReached)
      .slice(0, limit);
  }

  saveScore(entry: Omit<ScoreEntry, "id" | "playedAt">): ScoreEntry {
    const rows = this.readAll();
    const created: ScoreEntry = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      playedAt: new Date().toISOString(),
      ...entry
    };
    rows.push(created);
    rows.sort((a, b) => b.score - a.score || b.roundReached - a.roundReached);
    const trimmed = rows.slice(0, 50);
    localStorage.setItem(SCORE_KEY, JSON.stringify(trimmed));
    return created;
  }

  private readAll(): ScoreEntry[] {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as ScoreEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
