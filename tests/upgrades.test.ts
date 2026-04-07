import { describe, expect, it } from "vitest";
import { GameSession } from "../src/game/session";

describe("Upgrade flow", () => {
  it("draws 3 upgrade choices", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    expect(choices.length).toBe(3);
  });

  it("applies upgrade and changes state", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    const beforeMoney = run.state.currentMoney;
    run.applyUpgrade(choices[0]);
    const changed =
      run.state.currentMoney !== beforeMoney ||
      run.state.coinBias > 0 ||
      run.state.shield > 0 ||
      run.state.maxMultiplier > 5 ||
      run.state.riskMeter < 0 ||
      run.state.wildBoost > 0;
    expect(changed).toBe(true);
  });

  it("lucky draw increases wildBoost", () => {
    const run = new GameSession(42);
    run.startNewRun();
    const before = run.state.wildBoost;
    const luckyDraw = {
      id: "lucky-draw",
      title: "Lucky Draw",
      description: "Wild chance +10",
      apply: (state: any) => { state.wildBoost += 10; }
    };
    run.applyUpgrade(luckyDraw);
    expect(run.state.wildBoost).toBe(before + 10);
  });

  it("no upgrade increases spins (fixed spins rule)", () => {
    const run = new GameSession(777);
    run.startNewRun();
    const choices = run.getUpgradeChoices();
    for (const choice of choices) {
      expect(choice.id).not.toBe("banker-focus");
    }
  });
});
