export type SymbolId = "coin" | "clover" | "bomb" | "bankrupt";

export interface SymbolDef {
  id: SymbolId;
  label: string;
  weight: number;
}

export interface RoundConfig {
  roundIndex: number;
  debtTarget: number;
  baseSpins: number;
  variance: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  apply: (state: GameRunState) => void;
}

export interface ScoreEntry {
  id: string;
  score: number;
  roundReached: number;
  playedAt: string;
}

export interface GameSettings {
  soundOn: boolean;
  vibrationOn: boolean;
}

export interface RunMeta {
  runsPlayed: number;
  bestRound: number;
}

export interface SpinOutcome {
  symbols: SymbolId[];
  deltaMoney: number;
  multiplierDelta: number;
  spinsDelta: number;
  riskDelta: number;
  message: string;
}

export interface GameRunState {
  roundIndex: number;
  debtTarget: number;
  currentMoney: number;
  spinsLeft: number;
  maxSpinsPerRound: number;
  multiplier: number;
  maxMultiplier: number;
  riskMeter: number;
  coinBias: number;
  shield: number;
  spinCount: number;
  spinSeconds: number;
  history: string[];
  lastOutcome: SpinOutcome | null;
  score: number;
  gameOver: boolean;
}
