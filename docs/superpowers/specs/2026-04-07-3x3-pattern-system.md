# Phase 2: 3x3 Grid + Pattern/Combo System

## Overview

Lucky Ledger의 슬롯을 3릴(3x1)에서 3x3 그리드(9칸)로 확장하고, 14종 패턴(족보) 매칭 시스템을 도입한다. 심볼을 4종에서 6종으로 늘리고(Star, Wild 추가), 보상을 CloverPit식 곱셈 공식으로 계산한다. 게임 내 족보 오버레이와 HelpScene 확장도 포함. 스핀 수는 라운드 내 고정(증가 경로 없음).

## Symbols (6종)

| 심볼 | ID | 가치(value) | 역할 | 기본 가중치 |
|------|-----|------------|------|------------|
| Coin | `coin` | 2 | 기본 머니 | 35 |
| Clover | `clover` | 3 | +multiplier | 20 |
| Star | `star` | 5 | 고가치 보너스 머니 | 10 |
| Wild | `wild` | 0 | 아무 심볼 대체 | 8 |
| Bomb | `bomb` | -2 | 손실 + 리스크 | 18 |
| Ghost | `bankrupt` | -4 | 대규모 손실 | 9 |

- Wild는 패턴 매칭 시 해당 라인의 다른 심볼 중 가장 유리한 것으로 자동 판정
- Wild만으로 구성된 라인은 매치 실패 (value = 0)
- Star는 Coin보다 희귀하지만 가치 2.5배

## Patterns (14종)

3x3 그리드 인덱스: `[0,1,2 / 3,4,5 / 6,7,8]`

### 기본 라인 (8종)

| 패턴 | ID | 위치 | 패턴 가치 |
|------|-----|------|-----------|
| 가로 상 | `row-top` | [0,1,2] | 1 |
| 가로 중 | `row-mid` | [3,4,5] | 1 |
| 가로 하 | `row-bot` | [6,7,8] | 1 |
| 세로 좌 | `col-left` | [0,3,6] | 1 |
| 세로 중 | `col-mid` | [1,4,7] | 1 |
| 세로 우 | `col-right` | [2,5,8] | 1 |
| 대각선 \ | `diag-main` | [0,4,8] | 2 |
| 대각선 / | `diag-anti` | [2,4,6] | 2 |

### 특수 패턴 (6종)

| 패턴 | ID | 위치 | 패턴 가치 |
|------|-----|------|-----------|
| V자 | `v-shape` | [0,4,2] | 3 |
| 역V자 | `v-inverse` | [6,4,8] | 3 |
| 코너 | `corners` | [0,2,6,8] | 4 |
| 십자가 | `cross` | [1,3,4,5,7] | 5 |
| X자 | `x-shape` | [0,2,4,6,8] | 6 |
| 풀하우스 | `full` | [0,1,2,3,4,5,6,7,8] | 10 |

## Reward Calculation

**공식:** `라인 보상 = (심볼가치 + 1) × (패턴가치 + 1) × multiplier`

- 한 스핀에서 여러 패턴이 동시에 매칭 가능 → 각각 계산 후 합산
- 긍정 심볼(coin, clover, star) 매치 → reward = +(symbolValue+1)×(patternValue+1)×multiplier
- 부정 심볼(bomb, ghost) 매치 → reward = -(abs(symbolValue)+1)×(patternValue+1)×1 (multiplier 적용 안 함)
- 매치 없음 → 기본 소량 페널티 (스핀 낭비): `-(5 + roundIndex * 2)`

**부수 효과 (매치 시):**
- Clover 매치: multiplier += 1 (최대 maxMultiplier)
- Bomb 매치: riskMeter += 패턴가치 × 5
- Ghost 매치: riskMeter += 패턴가치 × 8, multiplier -= 1 (최소 1)
- Star 매치: 보상만 (부수 효과 없음)
- Wild: 대체된 심볼의 부수 효과 적용

**보상 예시:**
- 가로 상 Coin 3개, multiplier 1: (2+1)×(1+1)×1 = 6
- 대각선 Star 3개, multiplier 2: (5+1)×(2+1)×2 = 36
- 풀하우스 Star, multiplier 3: (5+1)×(10+1)×3 = 198
- 가로 Bomb 3개: -(abs(-2)+1)×(1+1)×1 = -6 (multiplier 무관)

## Fixed Spins Per Round

- 라운드 시작 시 `baseSpins`가 정해지면 그 라운드 동안 **변하지 않음**
- 스핀 수 증가 경로 없음 (Clover의 +spin 효과 제거)
- 기존 업그레이드 "Extra Focus" (spinsLeft += 2) 제거 → "Lucky Draw"로 대체

## Upgrades (수정)

기존 6종에서 변경:

| 업그레이드 | ID | 효과 | 변경 |
|-----------|-----|------|------|
| Cash Boost | `cash-boost` | currentMoney += 40 | 유지 |
| Coin Bias | `coin-bias` | coinBias += 8 | 유지 |
| Shield Coating | `reinforced-core` | shield += 1 (max 2) | 유지 |
| ~~Extra Focus~~ | ~~`banker-focus`~~ | ~~spinsLeft += 2~~ | **삭제** |
| Cap Breaker | `cap-breaker` | maxMultiplier += 1 | 유지 |
| Risk Cooler | `risk-cooler` | riskMeter -= 20 | 유지 |
| **Lucky Draw** | `lucky-draw` | **wildBoost += 10** (다음 라운드 Wild 가중치 +10) | **신규** |

## Wild Matching Logic

`patternMatcher.findMatches(grid)`:

1. 14종 패턴 순회
2. 각 패턴의 위치에서 심볼 추출
3. Wild가 아닌 심볼들을 수집
4. 모두 같은 심볼이면 → 매치 성공 (Wild는 그 심볼로 해석)
5. Wild 아닌 심볼이 2종 이상이면 → 매치 실패
6. 전부 Wild이면 → 매치 실패
7. 성공 시 PatternMatch 반환 (해석된 symbolId, positions, reward)

## Data Model Changes

### types.ts

```typescript
export type SymbolId = "coin" | "clover" | "star" | "wild" | "bomb" | "bankrupt";

export interface PatternDef {
  id: string;
  name: string;
  positions: number[];
  value: number;
}

export interface PatternMatch {
  patternId: string;
  symbolId: SymbolId;
  positions: number[];
  reward: number;
}

export interface SpinOutcome {
  grid: SymbolId[];         // length 9
  matches: PatternMatch[];
  totalDelta: number;
  multiplierDelta: number;
  riskDelta: number;
  message: string;
}

export interface GameRunState {
  roundIndex: number;
  debtTarget: number;
  currentMoney: number;
  spinsLeft: number;
  maxSpinsPerRound: number;  // = baseSpins, 고정
  multiplier: number;
  maxMultiplier: number;
  riskMeter: number;
  coinBias: number;
  wildBoost: number;         // Lucky Draw 업그레이드에서 추가
  shield: number;
  spinCount: number;
  spinSeconds: number;
  history: string[];
  lastOutcome: SpinOutcome | null;
  score: number;
  gameOver: boolean;
}
```

기존 `SpinOutcome.symbols: SymbolId[]` (3개) → `grid: SymbolId[]` (9개)로 변경.
기존 `SpinOutcome.deltaMoney` → `totalDelta`로 이름 변경.
기존 `SpinOutcome.spinsDelta` → **삭제** (스핀 고정).

## New Files

| 파일 | 역할 |
|------|------|
| `src/game/patterns.ts` | 14종 PatternDef 배열 export |
| `src/game/patternMatcher.ts` | findMatches(grid): PatternMatch[] |
| `tests/patternMatcher.test.ts` | 패턴 매칭 유닛 테스트 |

## Modified Files

| 파일 | 변경 |
|------|------|
| `src/types.ts` | SymbolId 확장, PatternDef/PatternMatch 추가, SpinOutcome/GameRunState 변경 |
| `src/services/EconomyService.ts` | 리라이트 — 3x3 그리드 + 패턴 기반 보상 |
| `src/game/upgrades.ts` | Extra Focus 삭제 → Lucky Draw 추가 |
| `src/game/session.ts` | wildBoost 초기값, SpinOutcome 인터페이스 변경 반영 |
| `src/scenes/RunScene.ts` | 3x3 그리드 UI, 히트 하이라이트, 패턴 오버레이 버튼 |
| `src/scenes/HelpScene.ts` | PATTERNS, SCORING 섹션 추가, SYMBOLS 6종으로 확장 |
| `tests/economy.test.ts` | 리라이트 — 패턴 기반 테스트 |
| `tests/simulation.test.ts` | 3x3 기반으로 리라이트 |
| `tests/upgrades.test.ts` | Lucky Draw 테스트 추가, Extra Focus 삭제 |

## RunScene 3x3 Grid UI

- 릴 영역: 3개 아이콘 → 3x3 그리드 (9칸), 각 칸 `px(56)` 크기
- 히트된 패턴의 칸: 테두리 색 하이라이트 (오렌지 글로우)
- 여러 패턴 동시 히트 시: 순차 하이라이트 연출 (각 패턴 0.3초)
- 결과 텍스트: 매칭 패턴명 + 보상 표시 ("가로상 Coin! +6")
- 하단 좌측 "?" 버튼 → HelpScene
- 하단 우측 "패턴" 버튼 → 족보 오버레이 토글

**스핀 애니메이션:**
- 9칸 각각이 60ms 간격으로 랜덤 심볼 순환
- 세로 열 단위 순차 정지: 좌(0,3,6) → 200ms → 중(1,4,7) → 200ms → 우(2,5,8)
- 총 애니메이션 시간: 약 1100ms (기존 740ms에서 증가)

## Pattern Overlay (족보 오버레이)

- RunScene 위에 반투명 검정 배경 (0.7 alpha)
- 14종 패턴을 3x3 미니 그리드(각 칸 12px)로 시각화
- 7개씩 2열 배치, 패턴명 + 가치 표시
- 오버레이 표시 중 SPIN 버튼 비활성화
- 오버레이 밖 탭 또는 "X" 닫기 버튼으로 닫음

## New Symbol Textures

기존 buildSymbolTextures()에 2종 추가:

- **Star**: 노란 배경(#FFF3BF) + 노란 테두리(#F0C040), 별 모양 (5각형 픽셀), 반짝이는 눈
- **Wild**: 무지개 배경(그라데이션 #FFE8E8→#E8FFE8→#E8E8FF) + 흰 테두리, "W" 글자 + 물음표 표정

## Out of Scope (Phase 3+)

- 사운드/BGM/효과음
- 메타 진행 시스템 (영구 업그레이드, 업적, 통계)
- 추가 심볼 종류
- 릴 크기 변경 옵션 (3x4, 3x5 등)
