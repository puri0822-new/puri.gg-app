# WBS — puri.gg Mobile
**Work Breakdown Structure v1.0**
작성일: 2026-04-28 | 총 기간: 6주

---

## 전체 일정 개요

```
Week 1 : 환경 설정 및 프로젝트 기반 구축
Week 2 : 공통 컴포넌트 및 네비게이션 UI 개발
Week 3 : 핵심 화면 UI 개발 (검색·리더보드·전적)
Week 4 : Firebase 데이터 연동 및 비즈니스 로직 이식
Week 5 : 통합 테스트 및 UX 개선
Week 6 : 배포 준비 및 문서화
```

---

## Week 1 — 환경 설정 및 프로젝트 기반 구축

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 1.1 | Expo 프로젝트 초기화 (TypeScript 템플릿) | 개발 | `app.json`, `tsconfig.json` |
| 1.2 | NativeWind v4 설치 및 Tailwind 설정 | 개발 | `tailwind.config.js`, `global.css` |
| 1.3 | Firebase SDK 설치 및 `firebase.ts` 설정 | 개발 | `src/lib/firebase.ts` |
| 1.4 | TanStack Query 설치 및 `QueryClientProvider` 래핑 | 개발 | `app/_layout.tsx` |
| 1.5 | Expo Router 파일 기반 라우팅 구조 설계 | 개발 | `app/` 디렉토리 구조 |
| 1.6 | 디자인 토큰 정의 (LoL 골드 테마 색상 변수) | 개발 | `src/constants/colors.ts` |
| 1.7 | ESLint · Prettier 설정 | 개발 | `.eslintrc.js`, `.prettierrc` |

---

## Week 2 — 공통 컴포넌트 및 네비게이션 UI 개발

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 2.1 | Bottom Tab Navigator 구현 (홈·리더보드·전적·통계) | 개발 | `app/(tabs)/_layout.tsx` |
| 2.2 | `TierBadge` 컴포넌트 (아이언~챌린저 이미지) | 개발 | `src/components/TierBadge.tsx` |
| 2.3 | `ChampionAvatar` 컴포넌트 (Data Dragon 연동) | 개발 | `src/components/ChampionAvatar.tsx` |
| 2.4 | `EloChip` 컴포넌트 (ELO 점수 배지) | 개발 | `src/components/EloChip.tsx` |
| 2.5 | `WinRateBar` 컴포넌트 (승률 시각화 바) | 개발 | `src/components/WinRateBar.tsx` |
| 2.6 | 공통 로딩 스켈레톤 UI | 개발 | `src/components/Skeleton.tsx` |
| 2.7 | 다크 테마 글로벌 스타일 적용 | 개발 | `src/constants/colors.ts` 완성 |

---

## Week 3 — 핵심 화면 UI 개발

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 3.1 | 홈 화면 — 검색창 + 자동완성 드롭다운 | 개발 | `app/(tabs)/index.tsx` |
| 3.2 | 홈 화면 — 빠른 통계 카드 (총 게임·참여 소환사) | 개발 | `app/(tabs)/index.tsx` |
| 3.3 | 리더보드 화면 — TOP 3 하이라이트 카드 | 개발 | `app/(tabs)/leaderboard.tsx` |
| 3.4 | 리더보드 화면 — FlatList 랭킹 테이블 | 개발 | `app/(tabs)/leaderboard.tsx` |
| 3.5 | 소환사 상세 화면 — 기본 프로필 + 통계 | 개발 | `app/summoner/[name].tsx` |
| 3.6 | 소환사 상세 화면 — 최근 경기 피드 | 개발 | `app/summoner/[name].tsx` |
| 3.7 | 전적 입력 Modal — 팀 구성 폼 | 개발 | `src/components/MatchInputModal.tsx` |
| 3.8 | 통계 화면 — 챔피언 메타 카드 | 개발 | `app/(tabs)/stats.tsx` |

---

## Week 4 — Firebase 데이터 연동 및 비즈니스 로직 이식

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 4.1 | `useMatches` 커스텀 훅 (TanStack Query + Firestore) | 개발 | `src/hooks/useMatches.ts` |
| 4.2 | `useLeaderboard` 커스텀 훅 (ELO 산출 포함) | 개발 | `src/hooks/useLeaderboard.ts` |
| 4.3 | `useSummoner` 커스텀 훅 (소환사별 통계) | 개발 | `src/hooks/useSummoner.ts` |
| 4.4 | ELO 계산 로직 이식 (`calculateElo.ts` → RN) | 개발 | `src/utils/calculateElo.ts` |
| 4.5 | CP 계산 로직 이식 (`cp.ts` → RN) | 개발 | `src/utils/cp.ts` |
| 4.6 | Firestore Security Rules 검토 및 모바일 적용 | 개발 | `firestore.rules` |
| 4.7 | Firebase Admin ELO 조정 API 연동 | 개발 | `src/lib/firestore.ts` |
| 4.8 | 오프라인 캐시 전략 설정 (staleTime / gcTime) | 개발 | `src/lib/queryClient.ts` |

---

## Week 5 — 통합 테스트 및 UX 개선

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 5.1 | iOS 시뮬레이터 통합 테스트 | QA | 버그 리포트 |
| 5.2 | Android 에뮬레이터 통합 테스트 | QA | 버그 리포트 |
| 5.3 | Pull-to-Refresh 동작 검증 | QA | - |
| 5.4 | 오프라인 모드 동작 검증 | QA | - |
| 5.5 | 접근성(accessibilityLabel) 전체 점검 | 개발 | - |
| 5.6 | 성능 프로파일링 (FlatList 최적화) | 개발 | - |
| 5.7 | UX 피드백 반영 (내전 참여자 사용성 테스트) | 기획 | 개선 사항 목록 |

---

## Week 6 — 배포 준비 및 문서화

| ID | 작업 | 담당 | 산출물 |
|----|------|------|--------|
| 6.1 | Expo EAS Build 설정 (iOS · Android) | 개발 | `eas.json` |
| 6.2 | 앱 아이콘 및 스플래시 스크린 제작 | 디자인 | `assets/` |
| 6.3 | TestFlight (iOS) 내부 테스트 배포 | 개발 | - |
| 6.4 | Google Play 내부 테스트 배포 | 개발 | - |
| 6.5 | `SETUP.md` · `ARCHITECTURE.md` 최종 업데이트 | 개발 | 문서 완성 |
| 6.6 | `AGENTS.md` AI 협업 로그 최종 정리 | 개발 | `AGENTS.md` 완성 |
| 6.7 | `README.md` 대문 페이지 완성 | 개발 | `README.md` 완성 |
