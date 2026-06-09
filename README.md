# puri.gg App

> LoL 내전 전적을 실시간으로 추적하는 모바일 앱

**Expo (React Native) + Firebase Firestore** 기반의 Android 앱.
ELO 랭킹 · CP 기여도 · 챔피언 통계를 내전 멤버들이 언제 어디서나 확인할 수 있습니다.

---

## 주요 화면

| 홈 / 검색 | 리더보드 | 전적 | 통계 | 소환사 상세 |
|---|---|---|---|---|
| 소환사 검색 + ELO TOP 1 | ELO 순위 전체 | 경기 히스토리 | 챔피언 · 플레이어 | 개인 전적 + CP |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Expo SDK 54 + React Native |
| 라우팅 | Expo Router v6 (파일 기반) |
| 백엔드 | Firebase Firestore (실시간 구독) |
| 상태 관리 | Custom Hooks (useState + onSnapshot) |
| 빌드 / 배포 | EAS Build + GitHub Actions |
| 언어 | TypeScript |

---

## 빠른 시작

```bash
# 1. 클론
git clone https://github.com/puri0822-new/puri.gg-app.git
cd puri.gg-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.dev
# .env.dev 에 Firebase 키 입력

# 4. 개발 서버 시작
npm run start:dev
```

자세한 설정은 [docs/SETUP.md](docs/SETUP.md) 참고.

---

## 빌드

```bash
# 개발 (디버그)
eas build --platform android --profile debug

# 내부 배포용 APK
eas build --platform android --profile preview

# 최종 배포 APK
eas build --platform android --profile release

# 자동 배포 (태그 푸시)
git tag v1.0.0 && git push origin v1.0.0
```

---

## 프로젝트 구조

```
app/
├── (tabs)/
│   ├── index.tsx          # 홈 (검색)
│   ├── leaderboard.tsx    # ELO 리더보드
│   ├── records.tsx        # 전적 목록
│   └── stats.tsx          # 챔피언 · 플레이어 통계
└── summoner/[name].tsx    # 소환사 상세

src/
├── hooks/                 # Firestore 데이터 훅
├── utils/                 # ELO · CP · 챔피언 유틸
├── types/                 # TypeScript 타입
└── lib/                   # Firebase 초기화
```

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | 개발 환경 설정 (처음 실행까지) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 구조 + 레이어별 책임 |
| [docs/deploy.md](docs/deploy.md) | 배포 명령어 + CI/CD |
| [docs/testing.md](docs/testing.md) | 테스트 실행 + 커버리지 |
