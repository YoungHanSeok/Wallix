# 🖼️ Wallix - 배경화면 다운로드 웹사이트

사용자가 다양한 테마의 고품질 배경화면을 검색, 미리보기, 그리고 원하는 해상도로 다운로드할 수 있는 웹 플랫폼입니다. 좋아요 기능을 통해 개인화된 경험을 제공합니다.

## ✨ 주요 기능

- 🎨 **테마별 배경화면 탐색**: 자연, 우주, 도시, 추상 등 다양한 테마
- 🔍 **실시간 검색**: 키워드 기반 배경화면 검색
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- ⬇️ **다중 해상도 다운로드**: 1920x1080, 2560x1440 등 다양한 해상도
- ❤️ **좋아요 시스템**: 마음에 드는 배경화면 저장 및 관리
- ⚡ **빠른 로딩**: 최적화된 이미지 로딩 및 캐싱

## 🏗️ 프로젝트 구조

```
wallix/
├── packages/
│   ├── frontend/              # React 프론트엔드 애플리케이션
│   │   ├── src/
│   │   │   ├── components/    # UI 컴포넌트
│   │   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── api/           # API 클라이언트
│   │   │   ├── hooks/         # 커스텀 훅
│   │   │   └── context/       # 상태 관리
│   │   └── public/            # 정적 파일
│   └── backend/               # Express 백엔드 API 서버
│       ├── src/
│       │   ├── routes/        # API 라우터
│       │   ├── services/      # 비즈니스 로직
│       │   ├── repositories/  # 데이터 접근 계층
│       │   └── middleware/    # 미들웨어
│       └── uploads/           # 이미지 파일 저장소
├── shared/                    # 공통 타입 정의 및 유틸리티
├── scripts/                   # 빌드 및 개발 스크립트
└── .kiro/specs/              # 프로젝트 명세서
```

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 1단계: 프로젝트 설정

```bash
# 저장소 클론
git clone <repository-url>
cd wallix

# 자동 설정 (의존성 설치 + 초기 빌드)
npm run setup
```

### 2단계: 개발 서버 실행

```bash
# 모든 서비스 동시 실행 (권장)
npm run dev

# 또는 개별 실행
npm run dev:backend    # 백엔드만 (포트 3001)
npm run dev:frontend   # 프론트엔드만 (포트 5173)
npm run dev:shared     # 공통 패키지 감시 모드
```

### 3단계: 웹사이트 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3001/api

## 📋 사용 가능한 명령어

### 개발 관련

```bash
npm run dev              # 모든 서비스 동시 실행
npm run dev:backend      # 백엔드 개발 서버
npm run dev:frontend     # 프론트엔드 개발 서버
npm run dev:shared       # 공통 패키지 감시 모드
npm run dev:script       # 커스텀 개발 스크립트 실행
```

### 빌드 관련

```bash
npm run build            # 모든 패키지 빌드
npm run build:prod       # 프로덕션 빌드 (정리 + 빌드)
npm run build:script     # 커스텀 빌드 스크립트 실행
npm run start            # 프로덕션 서버 실행
npm run start:prod       # 빌드 후 프로덕션 서버 실행
npm run preview          # 프론트엔드 프리뷰 서버
```

### 테스트 관련

```bash
npm test                 # 모든 패키지 테스트 실행
npm run test:watch       # 테스트 감시 모드
npm run test:coverage    # 테스트 커버리지 리포트
npm run test:integration # 백엔드 통합 테스트
npm run test:e2e         # 프론트엔드 E2E 테스트
npm run test:all         # 모든 테스트 실행 (단위 + 통합 + E2E)
```

### 유지보수 관련

```bash
npm run clean            # 빌드 파일 정리
npm run clean:all        # 모든 파일 정리 (node_modules 포함)
npm run setup            # 프로젝트 초기 설정
```

### 배포 관련

```bash
# 🚀 원클릭 배포 (권장)
npm run deploy:script    # 전체 배포 프로세스 자동화

# 개별 빌드
npm run deploy:build     # 전체 프로젝트 빌드
npm run deploy:frontend  # 프론트엔드만 빌드
npm run deploy:backend   # 백엔드만 빌드
npm run deploy:shared    # 공통 패키지만 빌드
npm run deploy:all       # 모든 프로젝트 빌드 + 완료 메시지

# 프로덕션 서버 실행
npm run serve:prod       # 백엔드 + 프론트엔드 동시 실행
npm run serve:frontend   # 프론트엔드 프리뷰 서버
npm run serve:backend    # 백엔드 프로덕션 서버

# PM2 프로세스 관리 (프로덕션 권장)
npm run pm2:start        # PM2로 서버 시작
npm run pm2:stop         # PM2 서버 중지
npm run pm2:restart      # PM2 서버 재시작
npm run pm2:delete       # PM2 프로세스 삭제

# Docker 컨테이너 관리
npm run docker:build     # Docker 이미지 빌드
npm run docker:up        # Docker 컨테이너 시작
npm run docker:down      # Docker 컨테이너 중지
npm run docker:logs      # Docker 로그 확인
```

## 🚀 배포 가이드

### 🎯 원클릭 배포 (가장 간단한 방법)

```bash
# 전체 배포 프로세스를 자동으로 실행
npm run deploy:script
```

이 명령어는 다음 작업을 자동으로 수행합니다:
1. ✅ 시스템 요구사항 확인
2. 📦 의존성 설치
3. 🔨 전체 프로젝트 빌드
4. 📁 로그 디렉토리 생성
5. 🎉 배포 완료 안내

### 🖥️ 프로덕션 서버 실행 방법

배포 완료 후 다음 중 하나의 방법으로 서버를 실행할 수 있습니다:

#### 방법 1: 기본 실행 (개발/테스트용)
```bash
npm run serve:prod
```

#### 방법 2: PM2 사용 (프로덕션 권장)
```bash
# PM2 설치 (전역)
npm install -g pm2

# 서버 시작
npm run pm2:start

# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 서버 중지
npm run pm2:stop
```

#### 방법 3: Docker 사용 (컨테이너 환경)
```bash
# Docker 이미지 빌드 및 실행
npm run docker:build
npm run docker:up

# 로그 확인
npm run docker:logs

# 컨테이너 중지
npm run docker:down
```

### 🌐 서비스 접속 정보

배포 완료 후 다음 주소로 접속할 수 있습니다:

- **웹사이트**: http://localhost (또는 서버 IP)
- **백엔드 API**: http://localhost:3000/api
- **관리자 패널**: http://localhost:3002 (PM2 사용 시)

### 📊 서버 모니터링

#### PM2 모니터링
```bash
pm2 monit              # 실시간 모니터링
pm2 status             # 프로세스 상태 확인
pm2 logs               # 로그 확인
pm2 restart all        # 모든 프로세스 재시작
```

#### Docker 모니터링
```bash
docker ps              # 실행 중인 컨테이너 확인
docker stats           # 리소스 사용량 확인
docker logs <container> # 특정 컨테이너 로그 확인
```

### 🔧 배포 문제 해결

#### 빌드 실패 시
```bash
# 캐시 정리 후 재시도
npm run clean:all
npm install
npm run deploy:script
```

#### 포트 충돌 시
```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :80

# 프로세스 종료 후 재시작
npm run pm2:delete
npm run pm2:start
```

#### 메모리 부족 시
```bash
# PM2 메모리 사용량 확인
pm2 monit

# 메모리 제한 설정 (ecosystem.config.js에서 수정)
# max_memory_restart: '1G' -> '2G'
```

## 🛠️ 기술 스택

### 백엔드
- **Express.js** - 웹 프레임워크
- **TypeScript** - 타입 안전성
- **Jest** - 단위 테스트
- **fast-check** - 속성 기반 테스트
- **Multer** - 파일 업로드 처리
- **CORS** - 크로스 오리진 요청 처리

### 프론트엔드
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **React Router** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트

### 개발 도구
- **모노레포** - 워크스페이스 기반 프로젝트 구조
- **Concurrently** - 동시 프로세스 실행
- **속성 기반 테스팅** - 정확성 검증

## 📚 API 문서

### 배경화면 API

```http
GET /api/wallpapers              # 모든 배경화면 조회
GET /api/wallpapers/:id          # 특정 배경화면 조회
GET /api/wallpapers/theme/:theme # 테마별 배경화면 조회
GET /api/wallpapers/search       # 배경화면 검색
```

### 테마 API

```http
GET /api/themes                  # 모든 테마 조회
GET /api/themes/:id              # 특정 테마 조회
```

### 사용자 좋아요 API

```http
GET /api/users/:userId/likes                    # 사용자 좋아요 목록
POST /api/users/:userId/likes                   # 좋아요 추가
DELETE /api/users/:userId/likes/:wallpaperId    # 좋아요 제거
```

### 파일 다운로드 API

```http
GET /api/download/:id/:resolution               # 특정 해상도 이미지 다운로드
```

## 🧪 테스팅 전략

이 프로젝트는 **이중 테스팅 접근법**을 사용합니다:

### 단위 테스트 (Unit Tests)
- 특정 예제와 엣지 케이스 검증
- 컴포넌트 간 통합 지점 테스트
- Jest (백엔드) 및 Vitest (프론트엔드) 사용

### 속성 기반 테스트 (Property-Based Tests)
- 모든 입력에 대해 성립해야 하는 범용 속성 검증
- fast-check 라이브러리 사용
- 각 테스트는 최소 100회 반복 실행

### 통합 및 E2E 테스트
- 백엔드 API 통합 테스트
- 프론트엔드 사용자 플로우 E2E 테스트
- Playwright를 사용한 브라우저 자동화

## 📁 주요 컴포넌트

### 프론트엔드 컴포넌트

- **WallpaperGrid**: 배경화면 그리드 레이아웃
- **WallpaperCard**: 개별 배경화면 카드
- **ThemeSelector**: 테마 선택 컴포넌트
- **SearchBar**: 검색 입력 컴포넌트
- **DownloadModal**: 해상도 선택 및 다운로드 모달
- **LikeButton**: 좋아요 버튼 컴포넌트

### 백엔드 서비스

- **WallpaperService**: 배경화면 비즈니스 로직
- **ThemeService**: 테마 분류 및 관리 로직
- **UserPreferenceService**: 사용자 선호도 관리 로직
- **FileService**: 이미지 파일 처리 및 서빙 로직

## 🔧 개발 가이드

### 새로운 테마 추가

1. `packages/backend/src/data/themes.json`에 테마 정보 추가
2. `packages/backend/uploads/icons/`에 테마 아이콘 추가
3. 해당 테마의 배경화면을 `wallpapers.json`에 추가

### 새로운 배경화면 추가

1. 이미지 파일을 `packages/backend/uploads/wallpapers/`에 저장
2. 썸네일을 `packages/backend/uploads/thumbnails/`에 저장
3. `packages/backend/src/data/wallpapers.json`에 메타데이터 추가

### 새로운 API 엔드포인트 추가

1. `packages/backend/src/routes/`에 라우터 파일 생성
2. `packages/backend/src/services/`에 비즈니스 로직 구현
3. `packages/backend/src/repositories/`에 데이터 접근 로직 구현
4. 단위 테스트 및 속성 기반 테스트 작성

## 🐛 문제 해결

### 개발 서버가 시작되지 않는 경우

```bash
# 포트 충돌 확인
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# 의존성 재설치
npm run clean:all
npm run setup
```

### 빌드 오류가 발생하는 경우

```bash
# 타입 체크
npm run build --workspace=shared
npm run build --workspace=packages/backend
npm run build --workspace=packages/frontend

# 개별 패키지 테스트
npm test --workspace=shared
npm test --workspace=packages/backend
npm test --workspace=packages/frontend
```

### 테스트 실패 시

```bash
# 상세한 테스트 출력
npm test -- --verbose

# 특정 테스트 파일 실행
npm test -- --testPathPattern=wallpaper

# 테스트 커버리지 확인
npm run test:coverage
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해 주세요.

---

**즐거운 개발 되세요! 🚀**