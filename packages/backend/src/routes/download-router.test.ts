/**
 * 다운로드 라우터 속성 테스트
 * **Feature: wallpaper-website, Property 3: 해상도별 다운로드 정확성**
 * **검증 대상: 요구사항 2.2**
 */

import * as fc from 'fast-check';
import { WallpaperService } from '../services/wallpaper-service';
import { Wallpaper, Resolution } from '@wallix/shared';

describe('다운로드 라우터 속성 테스트', () => {
  let wallpaperService: WallpaperService;

  beforeEach(() => {
    wallpaperService = new WallpaperService();
  });

  // 해상도 생성기
  const resolutionArbitrary = fc.record({
    width: fc.integer({ min: 100, max: 4000 }),
    height: fc.integer({ min: 100, max: 4000 }),
    fileUrl: fc.webUrl(),
    fileSize: fc.integer({ min: 1000, max: 10000000 })
  });

  // 배경화면 생성기 (해상도 포함)
  const wallpaperWithResolutionsArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    description: fc.option(fc.string(), { nil: undefined }),
    themeId: fc.string({ minLength: 1 }),
    tags: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
    resolutions: fc.array(resolutionArbitrary, { minLength: 1, maxLength: 10 }),
    thumbnailUrl: fc.webUrl(),
    originalUrl: fc.webUrl(),
    likeCount: fc.integer({ min: 0, max: 10000 }),
    downloadCount: fc.integer({ min: 0, max: 100000 }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  /**
   * 속성 3: 해상도별 다운로드 정확성
   * 모든 유효한 배경화면과 해상도 조합에 대해, 다운로드 요청 시 정확한 해상도의 이미지 파일이 반환되어야 한다
   * **검증 대상: 요구사항 2.2**
   */
  test('속성 3: 해상도별 다운로드 정확성', async () => {
    await fc.assert(
      fc.asyncProperty(
        wallpaperWithResolutionsArbitrary,
        fc.integer({ min: 100, max: 4000 }), // 요청 너비
        fc.integer({ min: 100, max: 4000 }), // 요청 높이
        async (wallpaper: Wallpaper, requestWidth: number, requestHeight: number) => {
          // 해상도 매칭 알고리즘 테스트
          const bestMatch = wallpaperService.findBestResolutionMatch(
            wallpaper.resolutions,
            requestWidth,
            requestHeight
          );

          // 사용 가능한 해상도가 있으면 반드시 매칭 결과가 있어야 함
          if (wallpaper.resolutions.length > 0) {
            expect(bestMatch).not.toBeNull();
            expect(bestMatch).toBeDefined();

            if (bestMatch) {
              // 반환된 해상도는 원본 해상도 목록에 포함되어야 함
              const isValidResolution = wallpaper.resolutions.some(res => 
                res.width === bestMatch.width && 
                res.height === bestMatch.height &&
                res.fileUrl === bestMatch.fileUrl &&
                res.fileSize === bestMatch.fileSize
              );
              expect(isValidResolution).toBe(true);

              // 정확히 일치하는 해상도가 있다면 그것이 반환되어야 함
              const exactMatch = wallpaper.resolutions.find(res => 
                res.width === requestWidth && res.height === requestHeight
              );
              
              if (exactMatch) {
                expect(bestMatch.width).toBe(exactMatch.width);
                expect(bestMatch.height).toBe(exactMatch.height);
                expect(bestMatch.fileUrl).toBe(exactMatch.fileUrl);
                expect(bestMatch.fileSize).toBe(exactMatch.fileSize);
              } else {
                // 정확한 매치가 없다면, 가장 가까운 해상도가 반환되어야 함
                // 모든 다른 해상도보다 거리가 가깝거나 같아야 함
                const targetDistance = Math.sqrt(
                  Math.pow(bestMatch.width - requestWidth, 2) + 
                  Math.pow(bestMatch.height - requestHeight, 2)
                );

                wallpaper.resolutions.forEach(res => {
                  const resDistance = Math.sqrt(
                    Math.pow(res.width - requestWidth, 2) + 
                    Math.pow(res.height - requestHeight, 2)
                  );
                  expect(targetDistance).toBeLessThanOrEqual(resDistance);
                });
              }

              // 반환된 해상도의 기본 속성 검증
              expect(bestMatch.width).toBeGreaterThan(0);
              expect(bestMatch.height).toBeGreaterThan(0);
              expect(bestMatch.fileUrl).toBeDefined();
              expect(bestMatch.fileUrl).not.toBe('');
              expect(bestMatch.fileSize).toBeGreaterThan(0);
              expect(typeof bestMatch.width).toBe('number');
              expect(typeof bestMatch.height).toBe('number');
              expect(typeof bestMatch.fileUrl).toBe('string');
              expect(typeof bestMatch.fileSize).toBe('number');
            }
          } else {
            // 사용 가능한 해상도가 없으면 null이 반환되어야 함
            expect(bestMatch).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 해상도 매칭 알고리즘의 일관성 테스트
   */
  test('해상도 매칭 알고리즘 일관성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(resolutionArbitrary, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 100, max: 4000 }),
        fc.integer({ min: 100, max: 4000 }),
        async (resolutions: Resolution[], targetWidth: number, targetHeight: number) => {
          // 같은 입력에 대해 항상 같은 결과를 반환해야 함
          const result1 = wallpaperService.findBestResolutionMatch(resolutions, targetWidth, targetHeight);
          const result2 = wallpaperService.findBestResolutionMatch(resolutions, targetWidth, targetHeight);

          if (result1 === null) {
            expect(result2).toBeNull();
          } else {
            expect(result2).not.toBeNull();
            expect(result1.width).toBe(result2!.width);
            expect(result1.height).toBe(result2!.height);
            expect(result1.fileUrl).toBe(result2!.fileUrl);
            expect(result1.fileSize).toBe(result2!.fileSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 빈 해상도 목록 처리 테스트
   */
  test('빈 해상도 목록 처리', () => {
    const result = wallpaperService.findBestResolutionMatch([], 1920, 1080);
    expect(result).toBeNull();
  });

  /**
   * 정확한 매치 우선순위 테스트
   */
  test('정확한 매치 우선순위', () => {
    const resolutions: Resolution[] = [
      { width: 1920, height: 1080, fileUrl: 'http://example.com/1.jpg', fileSize: 1000000 },
      { width: 2560, height: 1440, fileUrl: 'http://example.com/2.jpg', fileSize: 2000000 },
      { width: 1366, height: 768, fileUrl: 'http://example.com/3.jpg', fileSize: 800000 }
    ];

    // 정확히 일치하는 해상도 요청
    const exactMatch = wallpaperService.findBestResolutionMatch(resolutions, 1920, 1080);
    expect(exactMatch).not.toBeNull();
    expect(exactMatch!.width).toBe(1920);
    expect(exactMatch!.height).toBe(1080);
  });
});