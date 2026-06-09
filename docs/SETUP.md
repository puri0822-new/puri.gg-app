# SETUP — puri.gg Mobile
**개발 환경 설정 가이드 v1.0**
작성일: 2026-04-28

---

## 사전 요구사항

| 도구 | 권장 버전 | 확인 명령 |
|------|-----------|-----------|
| Node.js | 20 LTS 이상 | `node -v` |
| npm | 10 이상 | `npm -v` |
| Expo CLI | 최신 | `npx expo --version` |
| iOS Simulator | Xcode 15 이상 (macOS) | - |
| Android Studio | Hedgehog 이상 | - |
| Firebase CLI | 최신 | `firebase --version` |

---

## 1. 프로젝트 초기화

```bash
# Expo 프로젝트 생성 (TypeScript 템플릿)
npx create-expo-app puri-gg-mobile --template blank-typescript
cd puri-gg-mobile

# 의존성 설치
npm install
```

---

## 2. NativeWind 설정

```bash
npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

**`tailwind.config.js` 생성:**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // LoL 다크 테마 토큰
        background: "#0a0e1a",
        gold: "#c8aa6e",
        border: "#1e2740",
        muted: "#5c6478",
        card: "#0f1320",
      },
    },
  },
  plugins: [],
};
```

**`babel.config.js` 수정:**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**`global.css` 생성 (루트):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`app/_layout.tsx`에 import 추가:**

```tsx
import "../global.css";
```

---

## 3. Firebase 설정

### 3.1 Firebase 콘솔에서 앱 등록

1. [Firebase 콘솔](https://console.firebase.google.com)에서 기존 `puri.gg` 프로젝트 선택
2. 프로젝트 설정 → **앱 추가** → iOS 및 Android 앱 각각 등록
3. `google-services.json` (Android) 및 `GoogleService-Info.plist` (iOS) 다운로드

### 3.2 Firebase SDK 설치

```bash
npm install firebase
npx expo install expo-build-properties
```

### 3.3 `src/lib/firebase.ts` 작성

```ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);
```

### 3.4 환경 변수 설정

`.env.local` 파일 생성 (`.gitignore`에 포함 필수):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **주의**: `EXPO_PUBLIC_` 접두사가 붙은 변수만 클라이언트 번들에 포함됩니다.

---

## 4. TanStack Query 설정

```bash
npm install @tanstack/react-query
```

**`app/_layout.tsx`에 Provider 적용:**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5분
      gcTime:    1000 * 60 * 60 * 24, // 24시간 캐시 유지
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

---

## 5. 개발 서버 실행

```bash
# Metro 번들러 시작
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android

# Expo Go (물리 기기)
# 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
```

---

## 6. EAS Build (배포용 빌드)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# eas.json 초기화
eas build:configure

# iOS 빌드
eas build --platform ios --profile preview

# Android 빌드
eas build --platform android --profile preview
```

---

## 7. 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| Metro 번들러 캐시 오류 | 잘못된 캐시 | `npx expo start --clear` |
| Firebase 연결 실패 | 환경 변수 누락 | `.env.local` 확인 |
| NativeWind 스타일 미적용 | babel 설정 누락 | `babel.config.js` 재확인 후 `--clear` 재시작 |
| iOS 빌드 실패 | Xcode 버전 | Xcode 15 이상 업데이트 |
