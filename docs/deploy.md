# 배포 가이드 (puri.gg Android)

> **플랫폼:** Android (APK)  
> **도구:** Expo EAS Build + GitHub Actions  
> **저장소:** [puri0822-new/puri.gg-app](https://github.com/puri0822-new/puri.gg-app)

---

## 1. 빌드 종류

EAS 빌드 프로필은 `eas.json`에서 관리합니다.

| 프로필 | 목적 | 결과물 | 배포 대상 |
|---|---|---|---|
| `debug` | 개발·디버깅 | APK (debug) | 개발자 본인 |
| `preview` | QA·내부 테스트 | APK (release 서명 없음) | 내부 지인 |
| `release` | 실제 배포 | APK (release 서명) | 전체 사용자 |

### 수동 빌드 명령어

```bash
# debug
eas build --platform android --profile debug

# preview (내부 배포용)
eas build --platform android --profile preview

# release (최종 배포)
eas build --platform android --profile release
```

빌드 완료 후 EAS 대시보드(https://expo.dev) 또는 GitHub Releases에서 APK 다운로드.

---

## 2. 서명 / 인증서 관리

Android 앱 배포에는 **Keystore** 서명이 필요합니다.

### EAS 자동 관리 (권장)

EAS Build가 Keystore를 자동 생성·관리합니다. 별도 설정 불필요.

```bash
# 최초 빌드 시 자동 생성
eas build --platform android --profile release
```

### Keystore 백업

EAS가 관리하는 Keystore를 로컬에 백업하려면:

```bash
eas credentials --platform android
# → "Download Keystore" 선택
```

> ⚠️ Keystore를 분실하면 동일 패키지명으로 앱 업데이트 불가. **반드시 안전한 곳에 백업.**

### EAS Secret 등록

Firebase 환경변수 등 민감 정보는 EAS Secret으로 관리:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..."
```

GitHub Actions에서는 `EAS_TOKEN` 시크릿 필요:
1. [expo.dev](https://expo.dev) → Account Settings → Access Tokens → "Create Token"
2. GitHub 저장소 → Settings → Secrets → `EAS_TOKEN` 등록

---

## 3. 환경별 설정

### `.env` 파일 구조

```
.env               # 로컬 개발 (gitignore)
.env.development   # debug / preview 빌드
.env.production    # release 빌드
```

### 환경변수 목록

| 변수명 | 설명 |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `EXPO_PUBLIC_ADMIN_CODE` | 관리자 인증 코드 |

> ⚠️ `.env` 파일은 절대 Git에 커밋하지 않습니다. `.gitignore`에 포함되어 있어야 합니다.

### `eas.json`의 환경 분리

```json
{
  "build": {
    "debug":   { "env": { "APP_ENV": "development" } },
    "preview": { "env": { "APP_ENV": "development" } },
    "release": { "env": { "APP_ENV": "production"  } }
  }
}
```

---

## 4. 배포 채널 / 명령

### 자동 배포 (GitHub Actions)

**트리거 방법 1 — 버전 태그 푸시:**

```bash
git tag v1.2.0
git push origin v1.2.0
```

→ 자동으로 `release` 프로필로 빌드 후 GitHub Releases에 APK 업로드

**트리거 방법 2 — 수동 실행:**

GitHub 저장소 → Actions → "Android Build & Release" → "Run workflow" → 프로필 선택

### 배포 흐름

```
코드 푸시 / 태그
      ↓
GitHub Actions 실행
      ↓
EAS Build (Expo 클라우드)
      ↓
APK 생성
      ↓
GitHub Releases 업로드
      ↓
지인들에게 링크 공유
```

### APK 공유 방법

GitHub Releases 페이지 URL을 지인에게 공유:
```
https://github.com/puri0822-new/puri.gg-app/releases/latest
```

지인 설치 절차:
1. APK 다운로드
2. 설정 → 보안 → "알 수 없는 출처 허용"
3. APK 실행 → 설치

---

## 5. 버전 관리 규칙 (SemVer)

### 형식

```
v{MAJOR}.{MINOR}.{PATCH}
```

| 구분 | 변경 시점 | 예시 |
|---|---|---|
| `MAJOR` | 대규모 구조 변경, 하위 호환 불가 | `v1.0.0 → v2.0.0` |
| `MINOR` | 새로운 기능 추가 | `v1.0.0 → v1.1.0` |
| `PATCH` | 버그 수정, 소규모 개선 | `v1.0.0 → v1.0.1` |

### `app.json` 버전 업데이트

```json
{
  "expo": {
    "version": "1.2.0",
    "android": {
      "versionCode": 5
    }
  }
}
```

- `version`: 사용자에게 표시되는 버전 (SemVer)
- `versionCode`: Android 내부 정수, 배포마다 **반드시 1씩 증가**

### 릴리즈 절차

```bash
# 1. app.json에서 version, versionCode 업데이트
# 2. 커밋
git add app.json
git commit -m "chore: bump version to 1.2.0 (versionCode 5)"

# 3. 태그 생성 & 푸시 → GitHub Actions 자동 빌드
git tag v1.2.0
git push origin main --tags
```

---

## 6. 롤백 방법

### GitHub Releases에서 이전 버전 설치

1. [GitHub Releases](https://github.com/puri0822-new/puri.gg-app/releases) 접속
2. 원하는 이전 버전의 APK 다운로드
3. 기존 앱 위에 덮어 설치 (같은 패키지명 `com.purigg.app`)

> ⚠️ `versionCode`가 낮은 APK는 Android가 설치 거부할 수 있음.  
> 이 경우 앱을 완전히 삭제 후 재설치.

### EAS 대시보드에서 이전 빌드 접근

1. [expo.dev](https://expo.dev) → 프로젝트 → Builds
2. 원하는 빌드 선택 → "Download" → APK 다운로드

### 긴급 롤백 시나리오

```bash
# 특정 커밋으로 롤백 빌드
git checkout v1.1.0
eas build --platform android --profile release --non-interactive
```
