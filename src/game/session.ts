import type { GameRunState, ScoreEntry, UpgradeOption } from "../types";
import { createRoundConfig } from "./rounds";
import { EconomyService } from "../services/EconomyService";
import { LeaderboardRepository } from "../services/LeaderboardRepository";
import { RngService } from "../services/RngService";
import { SettingsRepository } from "../services/SettingsRepository";
import { drawUpgradeChoices } from "./upgrades";

export class GameSession {
  readonly economy = new EconomyService();
  readonly leaderboard = new LeaderboardRepository();
  readonly settingsRepository = new SettingsRepository();
  readonly rng: RngService;

  state: GameRunState;
  lastSavedScore: ScoreEntry | null = null;

  constructor(seed = Date.now()) {
    this.rng = new RngService(seed);
    this.state = this.createInitialState();
  }

  startNewRun(): void {
    this.state = this.createInitialState();
    this.normalizeState();
    this.lastSavedScore = null;
  }

  spin(): void {
    this.normalizeState();
    if (this.state.gameOver || this.economy.isRoundCleared(this.state)) {
      return;
    }
    const outcome = this.economy.spin(this.state, this.rng);
    this.economy.applyOutcome(this.state, outcome);
    if (this.economy.isRunFailed(this.state)) {
      this.state.gameOver = true;
      this.updateMeta();
    }
  }

  moveToNextRound(): void {
    this.normalizeState();
    const nextRound = this.state.roundIndex + 1;
    const conf = createRoundConfig(nextRound);
    this.state.roundIndex = conf.roundIndex;
    this.state.debtTarget = conf.debtTarget;
    this.state.currentMoney = Math.max(20, Math.round(this.state.currentMoney * 0.35));
    this.state.maxSpinsPerRound = conf.baseSpins;
    this.state.spinsLeft = conf.baseSpins;
    this.state.riskMeter = Math.max(0, Math.round(this.state.riskMeter * 0.55));
    this.state.history.unshift(`Round ${nextRound} started`);
    this.state.history = this.state.history.slice(0, 8);
    this.updateMeta();
  }

  getUpgradeChoices(): UpgradeOption[] {
    return drawUpgradeChoices(this.rng);
  }

  applyUpgrade(upgrade: UpgradeOption): void {
    this.normalizeState();
    upgrade.apply(this.state);
    this.state.spinsLeft = Math.min(this.state.maxSpinsPerRound, this.state.spinsLeft);
    this.state.history.unshift(`Upgrade applied: ${upgrade.title}`);
    this.state.history = this.state.history.slice(0, 8);
  }

  isRoundCleared(): boolean {
    return this.economy.isRoundCleared(this.state);
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }

  saveResultIfNeeded(): ScoreEntry | null {
    if (this.lastSavedScore) {
      return this.lastSavedScore;
    }
    const saved = this.leaderboard.saveScore({
      score: this.state.score,
      roundReached: this.state.roundIndex
    });
    this.lastSavedScore = saved;
    return saved;
  }

  private createInitialState(): GameRunState {
    const conf = createRoundConfig(1);
    return {
      roundIndex: 1,
      debtTarget: conf.debtTarget,
      currentMoney: 50,
      spinsLeft: conf.baseSpins,
      maxSpinsPerRound: conf.baseSpins,
      multiplier: 1,
      maxMultiplier: 5,
      riskMeter: 0,
      coinBias: 0,
      shield: 0,
      spinCount: 0,
      spinSeconds: 0,
      history: ["Run started"],
      lastOutcome: null,
      score: 0,
      gameOver: false
    };
  }

  private normalizeState(): void {
    if (!Number.isFinite(this.state.maxSpinsPerRound) || this.state.maxSpinsPerRound <= 0) {
      this.state.maxSpinsPerRound = Number.isFinite(this.state.spinsLeft) && this.state.spinsLeft > 0 ? this.state.spinsLeft : 10;
    }
    if (!Number.isFinite(this.state.spinsLeft)) {
      this.state.spinsLeft = this.state.maxSpinsPerRound;
    }
    this.state.spinsLeft = Math.max(0, Math.min(this.state.maxSpinsPerRound, Math.round(this.state.spinsLeft)));
  }

  private updateMeta(): void {
    const meta = this.settingsRepository.getMeta();
    meta.runsPlayed += 1;
    meta.bestRound = Math.max(meta.bestRound, this.state.roundIndex);
    this.settingsRepository.saveMeta(meta);
  }
}

export const session = new GameSession();
