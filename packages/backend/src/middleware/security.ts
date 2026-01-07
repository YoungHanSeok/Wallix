/**
 * 보안 미들웨어
 * 레이트 리미팅, 보안 로깅 등을 제공합니다.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * 일반 API 레이트 리미팅
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
  // IPv6 호환성을 위해 기본 keyGenerator 사용 (제거)
});

/**
 * 관리자 API 레이트 리미팅 (더 엄격)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 20, // 최대 20회 요청
  message: {
    success: false,
    message: '관리자 API 요청 한도를 초과했습니다.',
    errorCode: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 로그인 시도 레이트 리미팅 (매우 엄격)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    success: false,
    message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
    errorCode: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 실패한 로그인만 카운트
  skipSuccessfulRequests: true
});

/**
 * 다운로드 레이트 리미팅
 */
export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 최대 10회 다운로드
  message: {
    success: false,
    message: '다운로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    errorCode: 'DOWNLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 보안 로깅 미들웨어
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || '0'
    };
    
    // 의심스러운 활동 감지
    const suspiciousPatterns = [
      /\.\./,  // 경로 조작 시도
      /<script/i,  // XSS 시도
      /union.*select/i,  // SQL 인젝션 시도
      /javascript:/i,  // JavaScript 프로토콜
      /data:.*base64/i  // Base64 데이터 URL
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(req.url) || 
      pattern.test(JSON.stringify(req.body)) ||
      pattern.test(JSON.stringify(req.query))
    );
    
    if (isSuspicious || res.statusCode >= 400) {
      console.warn('🚨 보안 경고:', JSON.stringify(logData, null, 2));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📝 요청 로그:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
}

/**
 * 요청 크기 제한 미들웨어
 */
export function requestSizeLimit(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 15 * 1024 * 1024; // 15MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: '요청 크기가 너무 큽니다.',
      errorCode: 'REQUEST_TOO_LARGE'
    });
  }
  
  next();
}