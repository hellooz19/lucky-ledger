import type { UpgradeOption } from "../types";
import { RngService } from "../services/RngService";

const POOL: UpgradeOption[] = [
  {
    id: "cash-boost",
    title: "Cash Boost",
    description: "현재 소지금 +40",
    apply: (state) => {
      state.currentMoney += 40;
    }
  },
  {
    id: "coin-bias",
    title: "Coin Bias",
    description: "코인 출현 확률 +8",
    apply: (state) => {
      state.coinBias += 8;
    }
  },
  {
    id: "reinforced-core",
    title: "Shield Coating",
    description: "폭탄 1회 무효화",
    apply: (state) => {
      state.shield = Math.min(2, state.shield + 1);
    }
  },
  {
    id: "lucky-draw",
    title: "Lucky Draw",
    description: "조커 출현 확률 +10",
    apply: (state) => {
      state.wildBoost += 10;
    }
  },
  {
    id: "cap-breaker",
    title: "Cap Breaker",
    description: "최대 배율 +1",
    apply: (state) => {
      state.maxMultiplier += 1;
    }
  },
  {
    id: "risk-cooler",
    title: "Risk Cooler",
    description: "위험도 -20",
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
