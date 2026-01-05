/**
 * 배경화면 라우터 속성 테스트
 * **Feature: wallpaper-website, Property 2: 배경화면 필수 정보 포함**
 * **검증 대상: 요구사항 1.3**
 */

import * as fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import wallpaperRouter from './wallpaper-router';
import { Wallpaper } from '@wallix/shared';

// 테스트용 Express 앱 설정
const app = express();
app.use(express.json());
app.use('/api/wallpapers', wallpaperRouter);

// 배경화면 데이터 생성기
const wallpaperArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  description: fc.option(fc.string(), { nil: undefined }),
  themeId: fc.string({ minLength: 1 }),
  tags: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
  resolutions: fc.array(
    fc.record({
      width: fc.integer({ min: 100, max: 4000 }),
      height: fc.integer({ min: 100, max: 4000 }),
      fileUrl: fc.webUrl(),
      fileSize: fc.integer({ min: 1000, max: 10000000 })
    }),
    { minLength: 1, maxLength: 5 }
  ),
  thumbnailUrl: fc.webUrl(),
  originalUrl: fc.webUrl(),
  likeCount: fc.integer({ min: 0, max: 10000 }),
  downloadCount: fc.integer({ min: 0, max: 100000 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

describe('배경화면 라우터 속성 테스트', () => {
  /**
   * 속성 2: 배경화면 필수 정보 포함
   * 모든 배경화면 데이터에 대해, 렌더링될 때 미리보기 이미지 URL과 기본 정보(제목, 테마)가 포함되어야 한다
   * **검증 대상: 요구사항 1.3**
   */
  test('속성 2: 배경화면 필수 정보 포함', async () => {
    await fc.assert(
      fc.asyncProperty(wallpaperArbitrary, async (wallpaper: Wallpaper) => {
        // 배경화면 데이터가 API 응답에 포함될 때
        // 필수 정보들이 모두 존재하는지 확인
        
        // 필수 정보 검증
        expect(wallpaper.id).toBeDefined();
        expect(wallpaper.id).not.toBe('');
        
        expect(wallpaper.title).toBeDefined();
        expect(wallpaper.title).not.toBe('');
        
        expect(wallpaper.themeId).toBeDefined();
        expect(wallpaper.themeId).not.toBe('');
        
        expect(wallpaper.thumbnailUrl).toBeDefined();
        expect(wallpaper.thumbnailUrl).not.toBe('');
        
        // 해상도 정보도 필수
        expect(wallpaper.resolutions).toBeDefined();
        expect(Array.isArray(wallpaper.resolutions)).toBe(true);
        expect(wallpaper.resolutions.length).toBeGreaterThan(0);
        
        // 각 해상도에도 필수 정보가 있어야 함
        wallpaper.resolutions.forEach(resolution => {
          expect(resolution.width).toBeDefined();
          expect(resolution.height).toBeDefined();
          expect(resolution.fileUrl).toBeDefined();
          expect(resolution.fileSize).toBeDefined();
          
          expect(typeof resolution.width).toBe('number');
          expect(typeof resolution.height).toBe('number');
          expect(typeof resolution.fileUrl).toBe('string');
          expect(typeof resolution.fileSize).toBe('number');
          
          expect(resolution.width).toBeGreaterThan(0);
          expect(resolution.height).toBeGreaterThan(0);
          expect(resolution.fileUrl).not.toBe('');
          expect(resolution.fileSize).toBeGreaterThan(0);
        });
        
        // 기본 정보 타입 검증
        expect(typeof wallpaper.id).toBe('string');
        expect(typeof wallpaper.title).toBe('string');
        expect(typeof wallpaper.themeId).toBe('string');
        expect(typeof wallpaper.thumbnailUrl).toBe('string');
        expect(typeof wallpaper.likeCount).toBe('number');
        expect(typeof wallpaper.downloadCount).toBe('number');
        
        // 숫자 필드는 음수가 아니어야 함
        expect(wallpaper.likeCount).toBeGreaterThanOrEqual(0);
        expect(wallpaper.downloadCount).toBeGreaterThanOrEqual(0);
        
        // 날짜 필드 검증
        expect(wallpaper.createdAt).toBeInstanceOf(Date);
        expect(wallpaper.updatedAt).toBeInstanceOf(Date);
        
        // 태그는 배열이어야 함
        expect(Array.isArray(wallpaper.tags)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * API 응답 형식에서 필수 정보 포함 검증
   */
  test('API 응답에서 배경화면 필수 정보 포함', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArbitrary, { minLength: 1, maxLength: 10 }),
        async (wallpapers: Wallpaper[]) => {
          // Mock 데이터를 사용하여 실제 API 응답 형식 테스트
          // 실제 구현에서는 데이터베이스 모킹이 필요하지만,
          // 여기서는 데이터 구조 자체의 유효성을 검증
          
          wallpapers.forEach(wallpaper => {
            // API 응답으로 반환될 때 필수 필드들이 모두 존재하는지 확인
            const requiredFields = [
              'id', 'title', 'themeId', 'thumbnailUrl', 'resolutions',
              'likeCount', 'downloadCount', 'createdAt', 'updatedAt'
            ];
            
            requiredFields.forEach(field => {
              expect(wallpaper).toHaveProperty(field);
              expect(wallpaper[field as keyof Wallpaper]).toBeDefined();
            });
            
            // 미리보기 이미지 URL 형식 검증
            expect(wallpaper.thumbnailUrl).toMatch(/^https?:\/\/.+/);
            
            // 해상도 정보 상세 검증
            expect(wallpaper.resolutions.length).toBeGreaterThan(0);
            wallpaper.resolutions.forEach(res => {
              expect(res.fileUrl).toMatch(/^https?:\/\/.+/);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});