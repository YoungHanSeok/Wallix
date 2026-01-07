# 보안 개선 방안

## 1. 관리자 인증 시스템 강화

### JWT 기반 인증 구현
```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### 환경변수 보안 강화
```env
# .env.example (버전 관리 포함)
ADMIN_SECRET_KEY=your-secure-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=1h

# .env (버전 관리 제외)
ADMIN_SECRET_KEY=실제-보안-키
JWT_SECRET=실제-JWT-시크릿
```

## 2. 경로 조작 취약점 수정

```typescript
// 안전한 파일 경로 처리
import path from 'path';

function sanitizeFilePath(fileName: string, uploadsDir: string): string {
  // 파일명 정규화
  const sanitized = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
  
  // 절대 경로 생성 후 검증
  const fullPath = path.resolve(uploadsDir, sanitized);
  const normalizedUploadsDir = path.resolve(uploadsDir);
  
  // 업로드 디렉토리 외부 접근 차단
  if (!fullPath.startsWith(normalizedUploadsDir)) {
    throw new Error('Invalid file path');
  }
  
  return fullPath;
}
```

## 3. 파일 업로드 보안 강화

```typescript
import { fileTypeFromBuffer } from 'file-type';

// 매직 바이트 검증
const fileFilter = async (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    const buffer = await file.buffer;
    const fileType = await fileTypeFromBuffer(buffer);
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (fileType && allowedTypes.includes(fileType.mime)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  } catch (error) {
    cb(error);
  }
};
```

## 4. CORS 설정 수정

```typescript
// 프로덕션 환경별 CORS 설정
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 5. 입력 검증 강화

```bash
npm install validator dompurify
npm install --save-dev @types/validator @types/dompurify
```

```typescript
import validator from 'validator';
import DOMPurify from 'dompurify';

// XSS 방지 sanitization
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(validator.escape(input));
}
```

## 6. 보안 헤더 강화

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.CDN_URL],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 7. 레이트 리미팅 추가

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

// API 레이트 리미팅
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});

// 관리자 API 레이트 리미팅 (더 엄격)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: '관리자 API 요청 한도를 초과했습니다.'
});

app.use('/api', apiLimiter);
app.use('/api/admin', adminLimiter);
```