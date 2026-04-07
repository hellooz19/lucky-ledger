import { describe, expect, it } from "vitest";
import { GameSession } from "../src/game/session";

describe("Upgrade flow", () => {
  it("applies one upgrade and changes state", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    expect(choices.length).toBe(3);
    const beforeMoney = run.state.currentMoney;
    const beforeSpins = run.state.spinsLeft;
    run.applyUpgrade(choices[0]);
    const afterChanged =
      run.state.currentMoney !== beforeMoney ||
      run.state.spinsLeft !== beforeSpins ||
      run.state.coinBias > 0 ||
      run.state.shield > 0 ||
      run.state.maxMultiplier > 5 ||
      run.state.riskMeter < 0;
    expect(afterChanged).toBe(true);
  });
});
