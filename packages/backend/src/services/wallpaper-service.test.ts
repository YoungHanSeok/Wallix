/**
 * WallpaperService 속성 기반 테스트
 */

import * as fc from 'fast-check';
import { WallpaperService } from './wallpaper-service';
import { WallpaperRepository } from '../repositories/wallpaper-repository';
import { Wallpaper, Resolution } from '@wallix/shared';

// 테스트용 모의 리포지토리
class MockWallpaperRepository extends WallpaperRepository {
  private wallpapers: Wallpaper[] = [];

  constructor(wallpapers: Wallpaper[] = []) {
    super();
    this.wallpapers = wallpapers;
  }

  async findAll(): Promise<Wallpaper[]> {
    return [...this.wallpapers];
  }

  async findByTheme(themeId: string): Promise<Wallpaper[]> {
    return this.wallpapers.filter(w => w.themeId === themeId);
  }

  async search(query: string): Promise<Wallpaper[]> {
    const lowerQuery = query.toLowerCase();
    return this.wallpapers.filter(wallpaper => 
      wallpaper.title.toLowerCase().includes(lowerQuery) ||
      wallpaper.description?.toLowerCase().includes(lowerQuery) ||
      wallpaper.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async findById(id: string): Promise<Wallpaper | null> {
    return this.wallpapers.find(w => w.id === id) || null;
  }
}

// 테스트 데이터 생성기
const resolutionArb = fc.record({
  width: fc.integer({ min: 800, max: 4000 }),
  height: fc.integer({ min: 600, max: 3000 }),
  fileUrl: fc.webUrl(),
  fileSize: fc.integer({ min: 100000, max: 10000000 })
});

const wallpaperArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  themeId: fc.uuid(),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
  resolutions: fc.array(resolutionArb, { minLength: 1, maxLength: 5 }),
  thumbnailUrl: fc.webUrl(),
  originalUrl: fc.webUrl(),
  likeCount: fc.integer({ min: 0, max: 10000 }),
  downloadCount: fc.integer({ min: 0, max: 100000 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

describe('WallpaperService 속성 기반 테스트', () => {
  /**
   * **Feature: wallpaper-website, Property 1: 테마별 배경화면 필터링**
   * **검증 대상: 요구사항 1.2**
   * 
   * 모든 테마에 대해, 해당 테마를 선택했을 때 반환되는 배경화면들은 
   * 모두 선택된 테마에 속해야 한다
   */
  test('속성 1: 테마별 배경화면 필터링', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArb, { minLength: 0, maxLength: 50 }),
        fc.uuid(),
        async (wallpapers, targetThemeId) => {
          // Given: 배경화면 목록과 대상 테마 ID
          const mockRepo = new MockWallpaperRepository(wallpapers);
          const service = new WallpaperService(mockRepo);

          // When: 특정 테마의 배경화면을 조회
          const result = await service.getWallpapersByTheme(targetThemeId);

          // Then: 반환된 모든 배경화면은 해당 테마에 속해야 함
          return result.every(wallpaper => wallpaper.themeId === targetThemeId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: wallpaper-website, Property 4: 해상도 매칭 알고리즘**
   * **검증 대상: 요구사항 2.5**
   * 
   * 모든 요청 해상도에 대해, 사용 불가능한 경우 가장 가까운 사용 가능한 해상도가 제안되어야 한다
   */
  test('속성 4: 해상도 매칭 알고리즘', () => {
    fc.assert(
      fc.property(
        fc.array(resolutionArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 800, max: 4000 }),
        fc.integer({ min: 600, max: 3000 }),
        (availableResolutions, targetWidth, targetHeight) => {
          // Given: 사용 가능한 해상도 목록과 대상 해상도
          const service = new WallpaperService();

          // When: 최적 해상도 매칭 수행
          const result = service.findBestResolutionMatch(
            availableResolutions, 
            targetWidth, 
            targetHeight
          );

          // Then: 결과가 null이 아니고, 사용 가능한 해상도 중 하나여야 함
          if (availableResolutions.length > 0) {
            expect(result).not.toBeNull();
            expect(availableResolutions).toContainEqual(result);
            
            // 정확히 일치하는 해상도가 있다면 그것이 반환되어야 함
            const exactMatch = availableResolutions.find(
              res => res.width === targetWidth && res.height === targetHeight
            );
            if (exactMatch) {
              expect(result).toEqual(exactMatch);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: wallpaper-website, Property 9: 검색 결과 관련성**
   * **검증 대상: 요구사항 4.2**
   * 
   * 모든 검색어에 대해, 검색 결과로 반환되는 배경화면들은 
   * 검색어와 관련된 태그나 제목을 포함해야 한다
   */
  test('속성 9: 검색 결과 관련성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArb, { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (wallpapers, searchQuery) => {
          // Given: 배경화면 목록과 검색어
          const mockRepo = new MockWallpaperRepository(wallpapers);
          const service = new WallpaperService(mockRepo);

          // When: 검색 수행
          const result = await service.searchWallpapers(searchQuery);

          // Then: 반환된 모든 배경화면은 검색어와 관련이 있어야 함
          const lowerQuery = searchQuery.toLowerCase();
          return result.wallpapers.every(wallpaper => 
            wallpaper.title.toLowerCase().includes(lowerQuery) ||
            wallpaper.description?.toLowerCase().includes(lowerQuery) ||
            wallpaper.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // 추가 테스트: 해상도 거리 계산 정확성
  test('해상도 거리 계산이 올바른지 확인', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 800, max: 4000 }),
        fc.integer({ min: 600, max: 3000 }),
        fc.integer({ min: 800, max: 4000 }),
        fc.integer({ min: 600, max: 3000 }),
        (width1, height1, width2, height2) => {
          const service = new WallpaperService();
          
          // 같은 해상도의 거리는 0이어야 함
          const sameDistance = (service as any).calculateResolutionDistance(
            width1, height1, width1, height1
          );
          expect(sameDistance).toBe(0);

          // 거리는 항상 0 이상이어야 함
          const distance = (service as any).calculateResolutionDistance(
            width1, height1, width2, height2
          );
          expect(distance).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});