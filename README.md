# puri.gg App

LoL 내전 전적 관리 모바일 앱 — Expo (React Native) + Firebase

---

## 빌드 파이프라인

### 개발 서버 실행

```bash
# Metro 번들러 시작 (Expo Go)
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android
```

---

### EAS 빌드 (클라우드)

#### Debug — 개발·디버깅용

```bash
eas build --platform android --profile debug
```

#### Preview — 내부 배포용 APK

```bash
eas build --platform android --profile preview
```

#### Release — 최종 배포용 APK

```bash
eas build --platform android --profile release
```

---

### 자동 배포 (GitHub Actions)

태그를 푸시하면 자동으로 Release APK가 빌드되어 GitHub Releases에 업로드됩니다.

```bash
# 버전 태그 푸시 → 자동 빌드 트리거
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 수동 실행: **Actions → Android Build & Release → Run workflow**

---

### 로컬 캐시 초기화

```bash
npx expo start --clear
```

---

## 환경 변수

`.env` 파일을 루트에 생성하고 아래 변수를 설정하세요. (`.gitignore`에 포함됨)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_ADMIN_CODE=
```

---

## 관련 문서

| 문서 | 설명 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 시스템 아키텍처 |
| [docs/SETUP.md](docs/SETUP.md) | 개발 환경 설정 |
| [docs/deploy.md](docs/deploy.md) | 배포 가이드 |
| [docs/PRD.md](docs/PRD.md) | 제품 요구사항 |
| [docs/WBS.md](docs/WBS.md) | 작업 분류 구조 |
