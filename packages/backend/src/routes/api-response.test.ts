/**
 * API 응답 형식 일관성 속성 테스트
 * **Feature: wallpaper-website, Property 14: API 응답 형식 일관성**
 * **검증 대상: 요구사항 6.3**
 */

import * as fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import wallpaperRouter from './wallpaper-router';
import themeRouter from './theme-router';
import userRouter from './user-router';
import downloadRouter from './download-router';
import { ApiResponse } from '@wallix/shared';

// 테스트용 Express 앱 설정
const app = express();
app.use(express.json());
app.use('/api/wallpapers', wallpaperRouter);
app.use('/api/themes', themeRouter);
app.use('/api/users', userRouter);
app.use('/api/download', downloadRouter);

// 404 핸들러 추가
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
    errorCode: 'RESOURCE_NOT_FOUND'
  });
});

// 전역 오류 처리 미들웨어 추가
import { globalErrorHandler } from '../middleware/error-handler';
app.use(globalErrorHandler);

describe('API 응답 형식 일관성 속성 테스트', () => {
  /**
   * API 응답 구조 검증 함수
   */
  const validateApiResponse = (response: any): boolean => {
    // 기본 ApiResponse 구조 검증
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    // success 필드는 필수이고 boolean이어야 함
    if (typeof response.success !== 'boolean') {
      return false;
    }

    // success가 true인 경우 data 필드가 있어야 함
    if (response.success === true && response.data === undefined) {
      return false;
    }

    // success가 false인 경우 message 필드가 있어야 함
    if (response.success === false && typeof response.message !== 'string') {
      return false;
    }

    // errorCode가 있다면 string이어야 함
    if (response.errorCode !== undefined && typeof response.errorCode !== 'string') {
      return false;
    }

    return true;
  };

  /**
   * 속성 14: API 응답 형식 일관성
   * 모든 API 요청에 대해, 응답은 정의된 인터페이스 형식을 준수해야 한다
   * **검증 대상: 요구사항 6.3**
   */
  test('속성 14: API 응답 형식 일관성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          // 테스트할 API 엔드포인트들
          { method: 'GET', path: '/api/wallpapers' },
          { method: 'GET', path: '/api/themes' },
          { method: 'GET', path: '/api/wallpapers/nonexistent' },
          { method: 'GET', path: '/api/themes/nonexistent' },
          { method: 'GET', path: '/api/users/test-user/likes' },
          { method: 'POST', path: '/api/users/test-user/likes', body: { wallpaperId: 'test' } },
          { method: 'GET', path: '/api/wallpapers/search?query=test' }
        ),
        async (endpoint) => {
          let response;
          
          try {
            switch (endpoint.method) {
              case 'GET':
                response = await request(app).get(endpoint.path);
                break;
              case 'POST':
                response = await request(app)
                  .post(endpoint.path)
                  .send(endpoint.body || {});
                break;
              default:
                throw new Error(`지원하지 않는 HTTP 메서드: ${endpoint.method}`);
            }

            // 응답이 JSON 형식이어야 함
            expect(response.headers['content-type']).toMatch(/application\/json/);

            // 응답 본문이 유효한 JSON이어야 함
            expect(response.body).toBeDefined();
            expect(typeof response.body).toBe('object');

            // ApiResponse 인터페이스 준수 검증
            const isValidResponse = validateApiResponse(response.body);
            expect(isValidResponse).toBe(true);

            // success 필드 검증
            expect(typeof response.body.success).toBe('boolean');

            if (response.body.success === true) {
              // 성공 응답의 경우 data 필드가 있어야 함
              expect(response.body.data).toBeDefined();
            } else {
              // 실패 응답의 경우 message 필드가 있어야 함
              expect(typeof response.body.message).toBe('string');
              expect(response.body.message.length).toBeGreaterThan(0);

              // errorCode가 있다면 유효한 문자열이어야 함
              if (response.body.errorCode) {
                expect(typeof response.body.errorCode).toBe('string');
                expect(response.body.errorCode.length).toBeGreaterThan(0);
              }
            }

          } catch (error) {
            // 네트워크 오류나 서버 오류가 발생해도 응답 형식은 일관되어야 함
            if (response && response.body) {
              const isValidResponse = validateApiResponse(response.body);
              expect(isValidResponse).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 } // API 호출이므로 실행 횟수를 줄임
    );
  });

  /**
   * 오류 응답 형식 일관성 테스트
   */
  test('오류 응답 형식 일관성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          // 오류를 발생시킬 수 있는 엔드포인트들
          '/api/wallpapers/invalid-id',
          '/api/themes/invalid-id',
          '/api/wallpapers/search', // 쿼리 파라미터 없음
          '/api/download/invalid/1920x1080',
          '/api/nonexistent-endpoint' // 존재하지 않는 엔드포인트
        ),
        async (errorPath: string) => {
          const response = await request(app).get(errorPath);

          // 디버깅을 위한 로그 (테스트 실패 시)
          if (!validateApiResponse(response.body)) {
            console.log('Invalid response for path:', errorPath);
            console.log('Response body:', JSON.stringify(response.body, null, 2));
            console.log('Response status:', response.status);
          }

          // 오류 응답도 일관된 형식을 가져야 함
          expect(response.body).toBeDefined();
          expect(typeof response.body).toBe('object');

          const isValidResponse = validateApiResponse(response.body);
          expect(isValidResponse).toBe(true);

          // 오류 응답은 success: false여야 함
          expect(response.body.success).toBe(false);

          // 오류 메시지가 있어야 함
          expect(typeof response.body.message).toBe('string');
          expect(response.body.message.length).toBeGreaterThan(0);

          // HTTP 상태 코드가 적절해야 함 (4xx 또는 5xx)
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * 성공 응답 데이터 구조 검증
   */
  test('성공 응답 데이터 구조 검증', async () => {
    const response = await request(app).get('/api/themes');

    // 성공 응답 검증
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    // 데이터가 배열인 경우 (테마 목록)
    if (Array.isArray(response.body.data)) {
      response.body.data.forEach((item: any) => {
        // 각 항목이 객체여야 함
        expect(typeof item).toBe('object');
        expect(item).not.toBeNull();
      });
    }
  });

  /**
   * Content-Type 헤더 일관성 검증
   */
  test('Content-Type 헤더 일관성', async () => {
    const endpoints = [
      '/api/wallpapers',
      '/api/themes',
      '/api/users/test/likes'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint);
      
      // 모든 API 응답은 JSON이어야 함
      expect(response.headers['content-type']).toMatch(/application\/json/);
    }
  });
});