# Phase 1: Pixel Garden UI Redesign

## Overview

Lucky Ledger의 전체 비주얼을 "Pixel Garden" 스타일로 전면 리뉴얼한다. 기존 어두운 보라색/핑크 테마를 밝고 귀여운 도트(픽셀) 감성으로 교체하며, 다크모드를 지원하는 라이트 테마 시스템을 도입한다. 게임 로직/메카닉 변경은 없다.

## Visual Direction: Pixel Garden

- **Light 기본 톤:** 하늘색/민트 그라데이션 배경 (#D4F5FF → #E8FFF0)
- **패널:** 아이보리 (#FFFFF0) 배경 + 초록 (#7BC67E) 테두리
- **강조색:** 오렌지 (#FF9A3C) — 버튼, 머니 텍스트, 프로그레스바
- **보조색:** 노란 (#FFD43B), 초록 (#51CF66), 빨간 (#E03131)
- **폰트:** Press Start 2P (Google Fonts). index.html에서 `<link>` 로 로드하고, Phaser의 `WebFontLoader` 플러그인 또는 `document.fonts.ready`로 폰트 로딩 완료 후 Scene을 시작. 로딩 실패 시 `'Courier New', monospace` 폴백.
- **장식:** 픽셀 구름 (상단), 픽셀 풀잎 바 (하단) — Phaser 그래픽 사각형 조합
- **전체 느낌:** RPG 마을 같은 따뜻하고 귀여운 도트 감성

## Theme System

### 신규 파일: `src/ui/theme.ts`

`Theme` 인터페이스를 정의하고 `lightTheme`, `darkTheme` 두 객체를 제공한다.

```typescript
interface Theme {
  bg: { top: string; bottom: string }       // 배경 그라데이션
  panel: { fill: string; border: string }    // 패널
  button: { fill: string; border: string; shadow: string; text: string }  // 버튼
  text: { primary: string; secondary: string; accent: string }  // 텍스트
  progress: { bg: string; border: string; fillStart: string; fillEnd: string }
  stats: {
    spins: { bg: string; border: string; text: string }
    mult: { bg: string; border: string; text: string }
    risk: { bg: string; border: string; text: string }
  }
  symbols: {
    coin: { bg: string; border: string }
    clover: { bg: string; border: string }
    bomb: { bg: string; border: string }
    bankrupt: { bg: string; border: string }
  }
  decoration: { cloud: string; grass: string }
}
```

- `lightTheme`: 위의 Pixel Garden 색상 세트
- `darkTheme`: 다크 네이비/차콜 배경, 짙은 패널, 밝은 테두리 (Pixel Garden 감성 유지)
  - bg: #1A2332 → #1E2A3A
  - panel: #2A3442 fill, #5CAD78 border
  - 강조색은 light와 동일 (오렌지, 노란, 초록)
- `currentTheme` 변수 + `setTheme(mode: 'light' | 'dark')` 함수
- `getTheme(): Theme` — 현재 테마 반환

### SettingsRepository 변경

- `GameSettings`에 `themeMode: 'light' | 'dark'` 필드 추가 (기본값 'light')
- 저장/로드 시 테마 모드 포함

### softUi.ts 변경

- `addSoftPanel()`, `addSoftButton()` 내 하드코딩 색상을 `getTheme()`에서 읽도록 교체
- 함수 시그니처는 유지 (선택적 color override 파라미터 유지)
- 픽셀 스타일로 변경: 둥근 모서리 제거, 직각 테두리 + 하단/우측 drop shadow

### styles.css 변경

- 보라색 그라데이션 배경 → 테마에 맞는 배경으로 교체
- 글로우 효과 제거
- 픽셀 폰트 import 추가

## Scene Redesign

### TitleScene

- **배경:** 하늘/민트 그라데이션 + 픽셀 구름 장식
- **타이틀:** Press Start 2P 폰트, "LUCKY" + "LEDGER" 두 줄, 픽셀 드롭쉐도우
- **서브타이틀:** 작은 픽셀 텍스트 "~ DEBT RUN ROGUELITE ~"
- **Start Run 버튼:** 오렌지 픽셀 버튼 (#FF9A3C), 3px 하단/우측 그림자
- **리더보드 패널:** 아이보리 배경 + 초록 테두리 박스
- **하단 토글:** Sound/Vibration 픽셀 아이콘 버튼 + **다크모드 토글** (해/달 아이콘) 추가
- **하단 장식:** 초록 풀잎 바

### RunScene (Layout A: Reel + Money 중심)

- **상단:** 라운드 번호 + 스코어 (작은 픽셀 텍스트)
- **머니 영역:** 큰 오렌지 숫자 (현재 금액) + 작은 회색 "GOAL $xxx"
- **프로그레스바:** 초록 테두리 박스, 노란→오렌지 그라데이션 fill
- **릴 영역 (크게):** 아이보리 배경 + 초록 테두리, 상단 풀잎 장식. 심볼 3개 크게 표시
- **스탯 칩 (작게):** 컬러 박스 3개 — Spins(노란), Multiplier(초록), Risk(빨간)
- **히스토리:** 한 줄 텍스트
- **SPIN 버튼:** 큰 오렌지 픽셀 버튼, 드롭 쉐도우
- **장식:** 상단 구름, 하단 풀잎 바

### ShopScene

- **헤더:** "ROUND CLEAR!" 픽셀 텍스트 + 별 장식
- **업그레이드 카드 3개:** 아이보리 배경 + 타입별 색상 테두리
  - 각 카드: 픽셀 아이콘 + 이름 + 한 줄 설명
- **카드 선택 시:** 프레스 애니메이션 (scale 0.98)

### ResultScene

- **헤더:** "RUN OVER" 또는 "VICTORY!" (라운드 12 도달 시)
- **스코어/라운드:** 큰 픽셀 숫자로 표시
- **리더보드:** TitleScene과 동일 스타일
- **버튼:** Retry(오렌지) + Title(초록) 픽셀 버튼

## Symbol Redesign

모든 심볼은 Phaser 그래픽으로 직접 그린다 (PNG 에셋 불필요). `RunScene.buildSymbolTextures()` 메서드를 교체.

| Symbol | 배경색 | 테두리색 | 캐릭터 설명 |
|--------|--------|----------|-------------|
| **Coin** | #FFF8DC | #F0C040 | 노란 사각 안에 귀여운 눈 + 웃는 입 도트 얼굴 |
| **Clover** | #F0FFF0 | #7BC67E | 초록 배경에 분홍 꽃 (원 4개 + 노란 중심 + 줄기) |
| **Bomb** | #FFF0F0 | #FFA0A0 | 분홍 배경에 회색 구체 + 화난 눈 + 도화선 + 불꽃 |
| **Bankrupt** | #F3E8FF | #C9A0FF | 보라 배경에 흰 유령 + 물결 꼬리 + 동그란 눈 + 벌린 입 |

## Animations

기존 애니메이션 구조는 유지하되 색상만 테마를 따르도록:

- **Spin:** 릴 회전 (60ms 간격, 740ms) — 유지
- **Win shimmer:** Scale tween (1.16x) — 유지
- **Sparkle burst:** 파티클 색상을 테마의 강조색(오렌지, 노란, 초록)으로 변경

## Implementation Approach

접근법 C: 라이트 테마 시스템 + 점진적 리스킨

1. `src/ui/theme.ts` 생성 (Theme 인터페이스, light/dark 객체, get/set 함수)
2. `SettingsRepository`에 themeMode 추가
3. `styles.css` 배경/폰트 변경
4. `softUi.ts`를 테마 기반으로 수정 + 픽셀 스타일 적용
5. `RunScene` 레이아웃 재구성 (Layout A) + 심볼 리디자인
6. `TitleScene` 리디자인 (다크모드 토글 포함)
7. `ShopScene` 리디자인
8. `ResultScene` 리디자인
9. 기존 테스트가 통과하는지 확인

## Out of Scope (Phase 2+)

- 새 심볼/메카닉 추가
- 사운드/BGM/효과음
- 메타 진행 시스템 (영구 업그레이드, 업적, 통계)
- 애니메이션 신규 추가
