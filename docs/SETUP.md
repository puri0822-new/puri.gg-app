# 개발 환경 설정

처음 보는 사람이 이 문서를 따라 끝까지 실행하면 앱이 실행됩니다.

---

## 사전 요구사항

| 도구 | 버전 | 확인 명령 |
|---|---|---|
| Node.js | 20 LTS 이상 | `node -v` |
| npm | 10 이상 | `npm -v` |
| Git | 최신 | `git --version` |
| Android Studio | 최신 (Android 에뮬레이터용) | - |
| Xcode 15+ | macOS 전용 (iOS 시뮬레이터용) | - |

---

## 1. 프로젝트 클론

```bash
git clone https://github.com/puri0822-new/puri.gg-app.git
cd puri.gg-app
```

---

## 2. 의존성 설치

```bash
npm install
```

---

## 3. 환경 변수 설정

`.env.example`을 복사해서 `.env.dev` 파일을 생성합니다.

```bash
cp .env.example .env.dev
```

`.env.dev`에 Firebase 값을 입력합니다 (Firebase Console → 프로젝트 설정 → 앱에서 확인):

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_LOG_LEVEL=verbose

EXPO_PUBLIC_FIREBASE_API_KEY=여기에_입력
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=여기에_입력
EXPO_PUBLIC_FIREBASE_PROJECT_ID=여기에_입력
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=여기에_입력
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=여기에_입력
EXPO_PUBLIC_FIREBASE_APP_ID=여기에_입력
EXPO_PUBLIC_ADMIN_CODE=여기에_입력
```

---

## 4. 개발 서버 실행

### Android 에뮬레이터

```bash
npm run android
```

### iOS 시뮬레이터 (macOS 전용)

```bash
npm run ios
```

### Expo Go (실기기 — QR 스캔)

```bash
npm run start:dev
```

터미널에 표시된 QR 코드를 **Expo Go 앱**으로 스캔.

---

## 5. 실행 확인

앱이 정상 실행되면 아래 화면이 동작합니다:

- **홈**: 소환사 검색창 + ELO TOP 1 카드
- **리더보드**: ELO 순위 전체 목록
- **전적**: 최근 20경기 + 더보기 버튼
- **통계**: 챔피언 탭 + 플레이어 탭

Firebase 연결 실패 시 "불러오는 중..." 상태에서 멈춥니다 → 환경 변수 재확인.

---

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| Metro 번들러 오류 | 캐시 문제 | `npx expo start --clear` |
| 화면이 빈 상태로 로딩 | Firebase 연결 실패 | `.env.dev` 키 값 확인 |
| 챔피언 이미지 미표시 | DDragon CDN 접근 실패 | 인터넷 연결 확인 |
| `npm install` 실패 | Node.js 버전 문제 | `node -v` → 20 이상 확인 |
| Expo Go 실행 오류 | SDK 버전 불일치 | Expo Go 앱 최신 버전 업데이트 |

---

## 환경별 실행 명령 요약

```bash
npm run start:dev      # 개발 환경 (.env.dev)
npm run start:staging  # 스테이징 환경 (.env.staging)
npm run start:prod     # 프로덕션 환경 (.env.prod)
```
