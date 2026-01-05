/**
 * 데이터 검증 함수 속성 기반 테스트
 * **Feature: wallpaper-website, Property 11: 배경화면 데이터 유효성**
 * **Validates: Requirements 5.1**
 */

import * as fc from 'fast-check';
import { 
  validateWallpaper, 
  validateTheme, 
  validateResolution, 
  validateUserLike,
  validateSearchResult 
} from '@wallix/shared/src/utils/validation';
import { Wallpaper, Theme, Resolution, UserLike, SearchResult } from '@wallix/shared/src/types/wallpaper';

// 테스트용 생성기 (Generators)
const resolutionArb = fc.record({
  width: fc.integer({ min: 1, max: 7680 }),
  height: fc.integer({ min: 1, max: 4320 }),
  fileUrl: fc.webUrl(),
  fileSize: fc.integer({ min: 1, max: 100_000_000 })
});

const wallpaperArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 })),
  themeId: fc.uuid(),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  resolutions: fc.array(resolutionArb, { minLength: 1, maxLength: 5 }),
  thumbnailUrl: fc.webUrl(),
  originalUrl: fc.webUrl(),
  likeCount: fc.integer({ min: 0, max: 1_000_000 }),
  downloadCount: fc.integer({ min: 0, max: 10_000_000 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

const themeArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  iconUrl: fc.option(fc.webUrl()),
  wallpaperCount: fc.integer({ min: 0, max: 10000 }),
  isActive: fc.boolean(),
  sortOrder: fc.integer({ min: 0, max: 1000 }),
  createdAt: fc.date()
});

const userLikeArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  wallpaperId: fc.uuid(),
  likedAt: fc.date()
});

describe('데이터 검증 속성 테스트', () => {
  describe('속성 11: 배경화면 데이터 유효성', () => {
    test('유효한 배경화면 데이터는 항상 검증을 통과해야 한다', () => {
      fc.assert(
        fc.property(wallpaperArb, (wallpaper) => {
          const result = validateWallpaper(wallpaper);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('유효한 해상도 데이터는 항상 검증을 통과해야 한다', () => {
      fc.assert(
        fc.property(resolutionArb, (resolution) => {
          const result = validateResolution(resolution);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('유효한 테마 데이터는 항상 검증을 통과해야 한다', () => {
      fc.assert(
        fc.property(themeArb, (theme) => {
          const result = validateTheme(theme);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('유효한 사용자 좋아요 데이터는 항상 검증을 통과해야 한다', () => {
      fc.assert(
        fc.property(userLikeArb, (userLike) => {
          const result = validateUserLike(userLike);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('필수 필드가 누락된 배경화면 데이터는 검증에 실패해야 한다', () => {
      fc.assert(
        fc.property(
          wallpaperArb,
          fc.constantFrom('id', 'title', 'themeId', 'resolutions'),
          (wallpaper, fieldToRemove) => {
            const invalidWallpaper = { ...wallpaper };
            delete (invalidWallpaper as any)[fieldToRemove];
            
            const result = validateWallpaper(invalidWallpaper);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('빈 해상도 배열을 가진 배경화면은 검증에 실패해야 한다', () => {
      fc.assert(
        fc.property(wallpaperArb, (wallpaper) => {
          const invalidWallpaper = { ...wallpaper, resolutions: [] };
          
          const result = validateWallpaper(invalidWallpaper);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    test('잘못된 해상도 값을 가진 배경화면은 검증에 실패해야 한다', () => {
      fc.assert(
        fc.property(wallpaperArb, (wallpaper) => {
          const invalidResolution = {
            width: -1,  // 잘못된 값
            height: 1080,
            fileUrl: 'https://example.com/image.jpg',
            fileSize: 1000
          };
          const invalidWallpaper = { 
            ...wallpaper, 
            resolutions: [invalidResolution] 
          };
          
          const result = validateWallpaper(invalidWallpaper);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});