import { GameSession } from "./session";

export interface SimulationResult {
  score: number;
  roundReached: number;
  spinSeconds: number;
}

export function simulateSingleRun(seed: number): SimulationResult {
  const run = new GameSession(seed);
  run.startNewRun();
  while (!run.isGameOver()) {
    while (!run.isGameOver() && !run.isRoundCleared()) {
      run.spin();
    }
    if (run.isGameOver()) {
      break;
    }
    const choice = run.getUpgradeChoices()[0];
    if (choice) {
      run.applyUpgrade(choice);
    }
    run.moveToNextRound();
    if (run.state.roundIndex >= 12) {
      run.state.gameOver = true;
    }
  }
  return {
    score: run.state.score,
    roundReached: run.state.roundIndex,
    spinSeconds: run.state.spinSeconds
  };
}

export function simulateMany(count: number, seedBase = 1000): SimulationResult[] {
  const rows: SimulationResult[] = [];
  for (let i = 0; i < count; i += 1) {
    rows.push(simulateSingleRun(seedBase + i));
  }
  return rows;
}
