# 테스트 가이드

---

## 현재 상태

`react-test-renderer`가 설치되어 있으며 Jest 설정을 추가하면 바로 테스트 작성이 가능합니다.

---

## 테스트 환경 설정

### 1. 패키지 설치

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native
```

### 2. `package.json`에 Jest 설정 추가

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": [
      "@testing-library/jest-native/extend-expect"
    ],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

---

## 테스트 실행 명령

```bash
# 전체 테스트 실행
npm test

# 변경 파일만 감지하여 재실행
npm run test:watch

# 커버리지 포함 실행
npm run test:coverage
```

---

## 커버리지 위치

```
coverage/
├── lcov-report/index.html   # 브라우저에서 열어서 확인
└── lcov.info                # CI 연동용
```

```bash
# 커버리지 리포트 브라우저에서 열기
open coverage/lcov-report/index.html
```

---

## 테스트 파일 위치 규칙

```
src/utils/elo.ts
src/utils/elo.test.ts       # 같은 위치에 .test.ts

src/utils/cp.ts
src/utils/cp.test.ts
```

---

## 우선 작성 권장 테스트

비즈니스 로직이 핵심이므로 유틸 함수부터 시작합니다.

### ELO 계산 (`src/utils/elo.test.ts`)

```ts
import { calcEloRankings } from './elo';

describe('calcEloRankings', () => {
  it('초기 ELO는 1000이어야 한다', () => {
    const result = calcEloRankings([]);
    expect(result).toEqual([]);
  });

  it('승리 시 ELO가 증가해야 한다', () => {
    // 테스트 작성
  });
});
```

### CP 계산 (`src/utils/cp.test.ts`)

```ts
import { calcMatchCp } from './cp';

describe('calcMatchCp', () => {
  it('CP는 0 이상이어야 한다', () => {
    // 테스트 작성
  });

  it('포지션별 공식이 올바르게 적용되어야 한다', () => {
    // 테스트 작성
  });
});
```

---

## 수동 테스트 체크리스트

자동화 테스트 전에 수동으로 확인할 항목:

```
[ ] 소환사 검색 → 결과 표시
[ ] 리더보드 스크롤 → 전체 순위 표시
[ ] 전적 더보기 → 20개씩 추가 로드
[ ] 날짜 필터 → 해당 날짜 경기만 표시
[ ] 통계 챔피언 탭 → 정렬 기능 동작
[ ] 통계 플레이어 탭 → 포지션별 TOP 3 표시
[ ] 소환사 상세 → CP / MVP / WORST 배지 표시
[ ] 소환사 상세 → 더보기 10경기씩 추가 로드
```
