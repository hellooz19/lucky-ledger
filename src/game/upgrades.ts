import type { UpgradeOption } from "../types";
import { RngService } from "../services/RngService";

const POOL: UpgradeOption[] = [
  {
    id: "cash-boost",
    title: "Cash Boost",
    description: "Current money +40",
    apply: (state) => {
      state.currentMoney += 40;
    }
  },
  {
    id: "coin-bias",
    title: "Coin Bias",
    description: "Coin chance +8",
    apply: (state) => {
      state.coinBias += 8;
    }
  },
  {
    id: "reinforced-core",
    title: "Shield Coating",
    description: "Ignore 1 bomb",
    apply: (state) => {
      state.shield = Math.min(2, state.shield + 1);
    }
  },
  {
    id: "banker-focus",
    title: "Extra Focus",
    description: "Spins +2 (up to round max)",
    apply: (state) => {
      state.spinsLeft += 2;
    }
  },
  {
    id: "cap-breaker",
    title: "Cap Breaker",
    description: "Max multiplier +1",
    apply: (state) => {
      state.maxMultiplier += 1;
    }
  },
  {
    id: "risk-cooler",
    title: "Risk Cooler",
    description: "Risk -20",
    apply: (state) => {
      state.riskMeter = Math.max(0, state.riskMeter - 20);
    }
  }
];

export function drawUpgradeChoices(rng: RngService): UpgradeOption[] {
  const picked: UpgradeOption[] = [];
  const buffer = POOL.slice();
  for (let i = 0; i < 3 && buffer.length > 0; i += 1) {
    const index = Math.floor(rng.nextFloat() * buffer.length);
    const selected = buffer.splice(index, 1)[0];
    picked.push({
      id: selected.id,
      title: selected.title,
      description: selected.description,
      apply: selected.apply
    });
  }
  return picked;
}
