# Lucky Ledger — 프로젝트 요약

## 개요

Lucky Ledger는 모바일/데스크탑 웹 캐주얼 슬롯 로그라이트 게임입니다. 플레이어는 3x3 그리드 슬롯을 돌려 패턴을 맞추고, 빚 목표를 달성하며 12라운드를 클리어합니다.

| 항목 | 내용 |
|------|------|
| **장르** | 캐주얼 슬롯 로그라이트 |
| **플랫폼** | 웹 (모바일 + 데스크탑) |
| **기술 스택** | TypeScript, Phaser 3, Vite, Vitest |
| **디자인 테마** | Pixel Garden (밝고 귀여운 도트 스타일) |
| **지원 기능** | 다크모드, 반응형(모바일/데스크탑), 로컬 리더보드 |
| **배포** | Vercel (GitHub 자동 배포) |
| **저장소** | https://github.com/hellooz19/lucky-ledger |

---

## 게임 규칙

### 기본 루프
1. **타이틀** → Start Run
2. **런** → 3x3 그리드 SPIN (패턴 매칭으로 돈 획득)
3. **목표 달성** → 업그레이드 1개 선택
4. **다음 라운드** → 반복
5. **12라운드 클리어** → VICTORY! / **스핀 소진** → RUN OVER

### 심볼 (6종)

| 심볼 | 가치 | 역할 |
|------|------|------|
| Coin | +2 | 기본 머니 |
| Flower | +3 | 배율 증가 |
| Star | +5 | 고가 보너스 |
| Joker (Wild) | 0 | 아무 심볼 대체 |
| Bomb | -2 | 돈 손실 + 위험도 증가 |
| Ghost | -4 | 대규모 손실 |

### 패턴 (14종)
- **기본 라인 8종**: 가로 3개, 세로 3개, 대각선 2개
- **특수 패턴 6종**: V자, 역V자, 코너, 십자가, X자, 풀하우스(전체)

### 보상 공식
```
보상 = (심볼가치 + 1) × (패턴가치 + 1) × 배율
```
- 여러 패턴 동시 히트 시 합산
- 부정 심볼(Bomb/Ghost)은 배율 미적용

### 업그레이드 (6종)

| 이름 | 효과 |
|------|------|
| Cash Boost | 소지금 +40 |
| Coin Bias | 코인 확률 +8 |
| Shield Coating | 폭탄 1회 무효 |
| Lucky Draw | 조커 확률 +10 |
| Cap Breaker | 최대 배율 +1 |
| Risk Cooler | 위험도 -20 |

---

## 기술 구조

### 아키텍처
```
src/
├── game/           # 핵심 로직 (Phaser 독립)
│   ├── session.ts      # GameSession — 런 상태 관리
│   ├── patterns.ts     # 14종 패턴 정의
│   ├── patternMatcher.ts # 패턴 매칭 엔진
│   ├── rounds.ts       # 라운드 난이도 설정
│   ├── upgrades.ts     # 업그레이드 풀
│   └── simulation.ts   # 테스트용 시뮬레이션
├── scenes/         # Phaser Scene
│   ├── TitleScene.ts   # 타이틀 + 리더보드 + 설정
│   ├── RunScene.ts     # 메인 플레이 (3x3 그리드)
│   ├── ShopScene.ts    # 업그레이드 선택
│   ├── ResultScene.ts  # 결과 (VICTORY/RUN OVER)
│   └── HelpScene.ts    # 도움말 (6페이지)
├── services/       # 데이터 서비스
│   ├── EconomyService.ts    # 스핀 + 보상 계산
│   ├── RngService.ts        # 결정론적 RNG (Xorshift32)
│   ├── LeaderboardRepository.ts # 로컬 리더보드
│   └── SettingsRepository.ts    # 설정 저장
├── ui/             # UI 유틸리티
│   ├── theme.ts        # 라이트/다크 테마
│   ├── softUi.ts       # 픽셀 패널/버튼
│   └── pixelDeco.ts    # 구름/풀잎 장식
├── types.ts        # 타입 정의
├── main.ts         # 진입점 (폰트 로드 + Phaser 부팅)
└── styles.css      # CSS (배경, 반응형)
```

### 테스트
- **26개 테스트** (Vitest)
- patternMatcher: 9개 (Wild, 전체매치, 부정심볼 등)
- economy: 8개 (그리드 생성, 보상, 클리어/실패 조건)
- upgrades: 4개 (Lucky Draw, 고정 스핀 규칙)
- theme: 4개 (라이트/다크 전환, parseHex)
- simulation: 1개 (1000회 시뮬레이션 밸런스 검증)

### 빌드/실행
```bash
npm run dev        # 개발 서버 (localhost:5173)
npm run build      # 프로덕션 빌드
npm run test       # 테스트 실행
```

---

## 배포

| 항목 | 내용 |
|------|------|
| **호스팅** | Vercel (무료 티어) |
| **자동 배포** | GitHub push → Vercel 자동 빌드/배포 |
| **빌드 설정** | Framework: Vite, Build: `npm run build`, Output: `dist` |

---

# 개발 이력

## Phase 1: Pixel Garden UI 리디자인 (2026-04-07)

기존 어두운 보라색/핑크 테마를 밝고 귀여운 "Pixel Garden" 도트 스타일로 전면 교체.

### 주요 변경
- **테마 시스템** (`theme.ts`) — 라이트/다크 모드 지원
- **픽셀 UI** (`softUi.ts`) — 직각 테두리 + 드롭 쉐도우
- **장식** (`pixelDeco.ts`) — 픽셀 구름, 풀잎 바
- **Press Start 2P 폰트** — Google Fonts 픽셀 폰트
- **심볼 리디자인** — Coin(웃는 얼굴), Flower(꽃), Bomb(화난 얼굴), Ghost(유령)
- **4개 Scene 전면 리라이트** — TitleScene, RunScene, ShopScene, ResultScene
- **다크모드 토글** — TitleScene에 해/달 버튼 + CSS 배경 연동

### 파일 변경
| 파일 | 작업 |
|------|------|
| `src/ui/theme.ts` | 신규 |
| `src/ui/pixelDeco.ts` | 신규 |
| `src/ui/softUi.ts` | 리라이트 |
| `src/styles.css` | 리라이트 |
| `src/main.ts` | 수정 (폰트 프리로드, pixelArt) |
| `src/scenes/*.ts` | 전부 리라이트 |
| `tests/theme.test.ts` | 신규 (4개 테스트) |

---

## Phase 2: 3x3 Grid + Pattern System (2026-04-07)

3릴(3x1) 슬롯을 3x3 그리드(9칸)로 확장, 14종 패턴 매칭 + 6종 심볼.

### 주요 변경
- **3x3 그리드** — 9칸 슬롯, 세로 열 순차 정지 애니메이션
- **14종 패턴** — 가로/세로/대각선/V자/코너/십자/X자/풀하우스
- **신규 심볼** — Star(고가 보너스), Wild/Joker(아무 심볼 대체)
- **CloverPit식 곱셈 보상** — (심볼+1)×(패턴+1)×배율
- **고정 스핀** — 라운드 내 스핀 수 증가 불가
- **Lucky Draw 업그레이드** — Wild 출현 확률 +10 (Extra Focus 대체)
- **패턴 매칭 엔진** (`patternMatcher.ts`) — Wild 대체, 부정 심볼 처리
- **히트 하이라이트** — 매칭 패턴 칸 오렌지 테두리 + 스케일 애니메이션
- **COMBO 오버레이** — 심볼 정보 + 보상 공식 + 14종 패턴 가이드
- **HelpScene 6페이지** — 규칙/심볼/점수/패턴/업그레이드 한글 설명

### 파일 변경
| 파일 | 작업 |
|------|------|
| `src/game/patterns.ts` | 신규 |
| `src/game/patternMatcher.ts` | 신규 |
| `src/types.ts` | 수정 (SymbolId 6종, PatternDef, SpinOutcome) |
| `src/services/EconomyService.ts` | 리라이트 |
| `src/game/upgrades.ts` | 수정 (Lucky Draw) |
| `src/game/session.ts` | 수정 (wildBoost, 머니 캡) |
| `src/scenes/RunScene.ts` | 리라이트 (3x3 그리드) |
| `src/scenes/HelpScene.ts` | 리라이트 (6페이지) |
| `src/scenes/ShopScene.ts` | 수정 (한글, 색상) |
| `tests/patternMatcher.test.ts` | 신규 (9개 테스트) |
| `tests/economy.test.ts` | 리라이트 |

---

## QA (2026-04-07)

### 수정된 이슈
| 등급 | 문제 | 수정 |
|------|------|------|
| IMPORTANT | 12라운드 승리 조건 미적용 | ShopScene에서 roundIndex >= 12 체크 추가 |
| IMPORTANT | 오버레이 한글 폰트 깨짐 | KR_FONT 적용 |
| IMPORTANT | 2라운드 업그레이드 후 먹통 | ShopScene picking 리셋 + 머니 캡 |
| MINOR | Lucky Draw 색상 누락 | 보라색 추가 |
| MINOR | 다크모드 업그레이드 텍스트 안 보임 | 카드 내 텍스트 어두운 색 고정 |

### 통과 항목
- 패턴 매칭 (Wild, 전체매치, 부정심볼)
- 고정 스핀 규칙
- 쉴드 폭탄 차단
- 보상 공식 정합성
- Scene 전환 흐름
- 다크모드 전체 적용
- 타입 안전성 (tsc 에러 0)
- 시뮬레이션 1000회 밸런스

---

## 향후 계획 (Phase 3+)

- [ ] 사운드/BGM/효과음
- [ ] 메타 진행 시스템 (영구 업그레이드, 업적, 통계)
- [ ] 추가 심볼 종류
- [ ] 릴 크기 변경 옵션 (3x4, 3x5 등)
