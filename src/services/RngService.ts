export class RngService {
  private state: number;

  constructor(seed = Date.now()) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    // Xorshift32: deterministic and lightweight for repeatable simulation tests.
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }

  pickWeighted<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let cursor = this.nextFloat() * total;
    for (const item of items) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return item;
      }
    }
    return items[items.length - 1];
  }
}
