# AGENTS.md — puri.gg Mobile AI 협업 가이드

> 이 파일은 AI Agent(Claude Code 등)가 이 프로젝트에서 작업할 때 참조하는
> **단일 통합 정책 파일**입니다.
> Rules · Commands · Skills · Context · ADR 을 한 곳에서 관리합니다.

---

## 1. 프로젝트 컨텍스트

| 항목 | 내용 |
|---|---|
| 제품명 | puri.gg Mobile |
| 목적 | LOL 내전 전적 관리 웹 → React Native 모바일 앱 전환 |
| 플랫폼 | Android (메인) / iOS (보조) |
| 패키지명 | com.purigg.app |
| 저장소 | https://github.com/puri0822-new/puri.gg-app |

---

## 2. 기술 스택 (버전 고정)

| 영역 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | Expo + React Native | SDK 54 |
| 라우팅 | Expo Router | v4 (파일 기반) |
| 스타일 | NativeWind | v4 |
| 백엔드 | Firebase Firestore | onSnapshot 실시간 구독 |
| 빌드/배포 | EAS Build + GitHub Actions | — |
| 언어 | TypeScript | strict 모드 |

> ⚠️ Expo는 버전마다 API가 크게 변경됩니다.
> 코드 작성 전 반드시 https://docs.expo.dev/versions/v54.0.0/ 를 확인하세요.

---

## 3. 디렉토리 구조 & 레이어 책임

```
app/                        # 화면 레이어 — UI 렌더링만
├── _layout.tsx
├── (tabs)/
│   ├── index.tsx           # 홈 (검색 + ELO TOP1)
│   ├── leaderboard.tsx     # ELO 리더보드
│   ├── records.tsx         # 전적 목록
│   └── stats.tsx           # 챔피언/플레이어 통계
└── summoner/[name].tsx     # 소환사 상세

src/
├── hooks/                  # 데이터 레이어 — Firestore 구독
│   ├── useMatches.ts       # 전체 경기 (ELO 계산용)
│   ├── usePagedMatches.ts  # 커서 페이지네이션 (전적 페이지용)
│   ├── useSettings.ts      # 설정 실시간 구독
│   └── useRankings.ts      # 최종 랭킹 조합
├── utils/                  # 비즈니스 로직 — 순수 TS 함수
│   ├── elo.ts              # ELO 계산
│   ├── cp.ts               # CP(기여도) 계산
│   ├── championData.ts     # 한글↔DDragon 영문명 매핑
│   └── tierImages.ts       # ELO 구간→티어 이미지
├── types/match.ts          # 공통 타입 정의
└── lib/firebase.ts         # Firebase 초기화
```

---

## 4. 코드 작성 규칙 (Rules)

### 4.1 레이어 분리 원칙 (ADR-001 기반)
- `app/` 파일에서 Firestore 직접 호출 **금지**
- `app/` 파일에서 ELO·CP 계산 로직 직접 작성 **금지**
- `src/utils/` 함수는 React·Firebase import **금지** (순수 TS만)

### 4.2 데이터 패턴
- 실시간 데이터: `onSnapshot` 사용 (TanStack Query 미사용, ADR-002)
- ELO 계산용: `useMatches` (전체 로드)
- 전적 표시용: `usePagedMatches` (20개씩 커서 페이지네이션, ADR-003)

### 4.3 스타일
- NativeWind(Tailwind) 클래스 우선 사용
- 인라인 StyleSheet는 동적 값이 필요한 경우에만

### 4.4 타입
- `any` 사용 금지
- Firestore 문서 타입은 반드시 `src/types/match.ts` 정의 후 사용

### 4.5 보안
- `.env.*` 파일 절대 커밋 금지
- 환경변수는 `EXPO_PUBLIC_` 접두어 사용

---

## 5. 자주 쓰는 명령어 (Commands)

```bash
# 개발 서버
npm run start:dev           # 개발 환경
npm run start:staging       # 스테이징 환경
npm run start:prod          # 프로덕션 환경

# 에뮬레이터
npm run android
npm run ios

# 빌드
eas build --platform android --profile debug
eas build --platform android --profile preview
eas build --platform android --profile release

# 자동 배포 트리거
git tag v1.0.0 && git push origin v1.0.0

# Metro 캐시 초기화
npx expo start --clear
```

---

## 6. 주요 설계 결정 (ADR 요약)

| ADR | 결정 | 근거 |
|---|---|---|
| 001 | 모바일 앱 읽기 전용 | 보안 단순화, 클라이언트 변조 방지 |
| 002 | TanStack Query 미사용, onSnapshot 직접 사용 | Firestore 실시간 구독 네이티브 지원 |
| 003 | ELO 전체 로드 + 전적 커서 페이지네이션 분리 | ELO는 전체 이력 필요, 전적 표시는 최신 일부만 필요 |
| 004 | Flutter 대신 Expo 채택 | 기존 웹 TS 비즈니스 로직(elo.ts, cp.ts) 재사용 가능 |

---

## 7. AI Agent 작업 지침 (Skills)

### 코드 수정 시
1. 수정 전 반드시 해당 파일 Read
2. 레이어 분리 원칙 준수 확인
3. TypeScript 타입 오류 없는지 확인

### 문서 수정 시
- `docs/` 내 파일과 실제 코드가 일치하는지 확인
- 버전 정보(Expo SDK 54) 변경되면 이 파일도 동시 업데이트

### 커밋 시
- `feat:` / `fix:` / `docs:` / `chore:` 컨벤션 준수
- `.env.*` 파일 스테이징 전 반드시 확인

### 절대 하지 말 것
- `git push --force` (main 브랜치)
- `.env` 파일 커밋
- `app/` 에서 Firestore 직접 호출
- `src/utils/` 에서 React import

---

## 8. 관련 문서

| 문서 | 경로 |
|---|---|
| 기획서(PRD) | docs/PRD.md |
| 개발 일정(WBS) | docs/WBS.md |
| 시스템 아키텍처 | docs/ARCHITECTURE.md |
| 개발 환경 설정 | docs/SETUP.md |
| 빌드 & 배포 | docs/deploy.md |
| 테스트 가이드 | docs/testing.md |
| LLM 활용 노하우 | docs/LLM_WIKI.md |
