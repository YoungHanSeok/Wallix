/**
 * 백엔드 애플리케이션 진입점
 * 보안이 강화된 Express 서버
 */

// 환경변수 로드 (가장 먼저 실행되어야 함)
import dotenv from 'dotenv';
dotenv.config();

// 환경변수 검증
import { validateEnvironment, showDevelopmentWarnings } from './utils/env-validator';

// 환경변수 검증 및 보안 경고 표시
const envConfig = validateEnvironment();
showDevelopmentWarnings();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import wallpaperRouter from './routes/wallpaper-router';
import themeRouter from './routes/theme-router';
import userRouter from './routes/user-router';
import downloadRouter from './routes/download-router';
// import adminRouter from './routes/admin-router'; // 모듈 인식 문제로 임시 비활성화
import { globalErrorHandler } from './middleware/error-handler';
import { apiLimiter, securityLogger, requestSizeLimit } from './middleware/security';

/**
 * Express 애플리케이션 생성 함수
 * 테스트에서 사용할 수 있도록 분리
 */
export function createApp(): express.Application {
  const app = express();

  // 보안 로깅 미들웨어 (가장 먼저 적용)
  app.use(securityLogger);

  // 요청 크기 제한
  app.use(requestSizeLimit);

  // 강화된 보안 미들웨어
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", process.env.CDN_URL || ""],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1년
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true
  }));

  // 개선된 CORS 설정
  const allowedOrigins = envConfig.NODE_ENV === 'production' 
    ? (envConfig.ALLOWED_ORIGINS?.split(',') || [])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002', 'http://localhost:3001'];

  app.use(cors({
    origin: (origin, callback) => {
      // 개발 환경에서는 origin이 없는 요청도 허용 (Postman 등)
      if (envConfig.NODE_ENV === 'development' && !origin) {
        return callback(null, true);
      }
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS 정책에 의해 차단된 요청입니다'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Content-Type', 'X-File-Size', 'X-Resolution']
  }));

  // 로깅 미들웨어
  if (envConfig.NODE_ENV === 'production') {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }

  // JSON 파싱 미들웨어 (크기 제한 강화)
  app.use(express.json({ 
    limit: '5mb',
    verify: (req, res, buf) => {
      // JSON 파싱 전 기본 검증
      if (buf.length === 0) return;
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('잘못된 JSON 형식입니다');
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '5mb',
    parameterLimit: 100 // 파라미터 개수 제한
  }));

  // 보안이 강화된 정적 파일 서빙
  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1y', // 1년 캐시
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // 이미지 파일만 허용 (확장자 검사)
      const ext = path.extname(filePath).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
      
      if (!allowedExts.includes(ext)) {
        // 허용되지 않는 파일 타입은 여기서 처리하지 않고 404로 넘김
        return;
      }
      
      // 보안 헤더 설정
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // MIME 타입 강제 설정
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    }
  }));

  // 헬스 체크 엔드포인트
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'wallpaper-website-backend',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API 라우터 (레이트 리미팅 적용)
  app.use('/api', apiLimiter);
  app.use('/api/wallpapers', wallpaperRouter);
  app.use('/api/themes', themeRouter);
  app.use('/api/users', userRouter);
  app.use('/api/download', downloadRouter);
  // app.use('/api/admin', adminRouter); // 모듈 인식 문제로 임시 비활성화

  // 404 핸들러
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false,
      message: '요청한 리소스를 찾을 수 없습니다',
      errorCode: 'RESOURCE_NOT_FOUND'
    });
  });

  // 전역 오류 처리 미들웨어
  app.use(globalErrorHandler);

  return app;
}

// 애플리케이션 인스턴스 생성
const app = createApp();
const PORT = process.env.PORT || 3001;

// 서버 시작
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`📁 정적 파일 경로: ${path.join(__dirname, '../uploads')}`);
  });
}

export default app;