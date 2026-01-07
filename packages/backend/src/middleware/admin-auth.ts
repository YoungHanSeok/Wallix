/**
 * 관리자 인증 미들웨어
 * JWT 기반 관리자 인증을 제공합니다.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createUnauthorizedError } from './error-handler';

// 관리자 사용자 정보 인터페이스
interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
}

// JWT 페이로드 인터페이스
interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * 관리자 로그인 처리
 */
export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw createUnauthorizedError('사용자명과 비밀번호가 필요합니다');
    }
    
    // 환경변수에서 관리자 계정 정보 확인
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!adminPasswordHash || !jwtSecret) {
      console.error('ADMIN_PASSWORD_HASH 또는 JWT_SECRET 환경변수가 설정되지 않았습니다');
      throw createUnauthorizedError('서버 설정 오류');
    }
    
    // 사용자명 확인
    if (username !== adminUsername) {
      throw createUnauthorizedError('잘못된 사용자명 또는 비밀번호입니다');
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isPasswordValid) {
      throw createUnauthorizedError('잘못된 사용자명 또는 비밀번호입니다');
    }
    
    // JWT 토큰 생성
    const payload = {
      userId: 'admin-001',
      username: adminUsername,
      role: 'admin'
    };
    
    // 타입 안전성을 위해 any로 캐스팅
    const token = (jwt as any).sign(payload, jwtSecret, { expiresIn: '1h' });
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          id: payload.userId,
          username: payload.username,
          role: payload.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * JWT 기반 관리자 인증 미들웨어
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createUnauthorizedError('인증 헤더가 필요합니다');
    }
    
    // Bearer 토큰 형식 확인
    if (!authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('Bearer 토큰 형식이 필요합니다');
    }
    
    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET 환경변수가 설정되지 않았습니다');
      throw createUnauthorizedError('서버 설정 오류');
    }
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // 관리자 권한 확인
    if (decoded.role !== 'admin') {
      throw createUnauthorizedError('관리자 권한이 필요합니다');
    }
    
    // 요청 객체에 사용자 정보 추가
    (req as any).user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createUnauthorizedError('유효하지 않은 토큰입니다'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createUnauthorizedError('토큰이 만료되었습니다'));
    } else {
      next(error);
    }
  }
}

/**
 * 관리자 상태 확인 함수
 * JWT 토큰 기반으로 관리자 상태를 확인합니다.
 */
export function checkAdminStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!authHeader || !jwtSecret) {
      res.json({ isAdmin: false });
      return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      res.json({ isAdmin: false });
      return;
    }
    
    const token = authHeader.slice(7);
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      const isAdmin = decoded.role === 'admin';
      
      res.json({ 
        isAdmin,
        user: isAdmin ? {
          id: decoded.userId,
          username: decoded.username,
          role: decoded.role
        } : null
      });
    } catch (jwtError) {
      res.json({ isAdmin: false });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 관리자 비밀번호 해시 생성 유틸리티
 * 초기 설정 시 사용
 */
export async function generatePasswordHash(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}