import { describe, expect, it } from "vitest";
import { simulateMany } from "../src/game/simulation";

describe("Simulation (3x3)", () => {
  it("runs 1000 seeded sessions with bounded averages", () => {
    const rows = simulateMany(1000, 12000);
    const avgSeconds = rows.reduce((sum, row) => sum + row.spinSeconds, 0) / rows.length;
    const avgRounds = rows.reduce((sum, row) => sum + row.roundReached, 0) / rows.length;
    expect(avgSeconds).toBeGreaterThan(30);
    expect(avgSeconds).toBeLessThan(2000);
    expect(avgRounds).toBeGreaterThan(1.0);
    expect(avgRounds).toBeLessThan(12.5);
  });
});
