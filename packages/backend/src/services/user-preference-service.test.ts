/**
 * UserPreferenceService 속성 기반 테스트
 */

import * as fc from 'fast-check';
import { UserPreferenceService } from './user-preference-service';
import { UserRepository } from '../repositories/user-repository';
import { WallpaperRepository } from '../repositories/wallpaper-repository';
import { UserLike, Wallpaper } from '@wallix/shared';

// 테스트용 모의 UserRepository
class MockUserRepository extends UserRepository {
  private userLikes: UserLike[] = [];

  constructor(userLikes: UserLike[] = []) {
    super();
    this.userLikes = userLikes;
  }

  async addLike(userId: string, wallpaperId: string): Promise<UserLike> {
    const userLike: UserLike = {
      id: `${userId}-${wallpaperId}`,
      userId,
      wallpaperId,
      likedAt: new Date()
    };
    this.userLikes.push(userLike);
    return userLike;
  }

  async removeLike(userId: string, wallpaperId: string): Promise<boolean> {
    const index = this.userLikes.findIndex(
      like => like.userId === userId && like.wallpaperId === wallpaperId
    );
    if (index >= 0) {
      this.userLikes.splice(index, 1);
      return true;
    }
    return false;
  }

  async findLike(userId: string, wallpaperId: string): Promise<UserLike | null> {
    return this.userLikes.find(
      like => like.userId === userId && like.wallpaperId === wallpaperId
    ) || null;
  }

  async getUserLikes(userId: string): Promise<UserLike[]> {
    return this.userLikes.filter(like => like.userId === userId);
  }

  async clearUserLikes(userId: string): Promise<boolean> {
    const initialLength = this.userLikes.length;
    this.userLikes = this.userLikes.filter(like => like.userId !== userId);
    return this.userLikes.length < initialLength;
  }
}

// 테스트용 모의 WallpaperRepository
class MockWallpaperRepository extends WallpaperRepository {
  private wallpapers: Map<string, Wallpaper> = new Map();

  constructor(wallpapers: Wallpaper[] = []) {
    super();
    wallpapers.forEach(w => this.wallpapers.set(w.id, w));
  }

  async exists(id: string): Promise<boolean> {
    return this.wallpapers.has(id);
  }

  async findById(id: string): Promise<Wallpaper | null> {
    return this.wallpapers.get(id) || null;
  }

  async incrementLikeCount(id: string): Promise<boolean> {
    const wallpaper = this.wallpapers.get(id);
    if (wallpaper) {
      wallpaper.likeCount++;
      return true;
    }
    return false;
  }

  async decrementLikeCount(id: string): Promise<boolean> {
    const wallpaper = this.wallpapers.get(id);
    if (wallpaper) {
      wallpaper.likeCount = Math.max(0, wallpaper.likeCount - 1);
      return true;
    }
    return false;
  }
}

// 테스트 데이터 생성기
const userLikeArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  wallpaperId: fc.uuid(),
  likedAt: fc.date()
});

const wallpaperArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  themeId: fc.uuid(),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
  resolutions: fc.array(fc.record({
    width: fc.integer({ min: 800, max: 4000 }),
    height: fc.integer({ min: 600, max: 3000 }),
    fileUrl: fc.webUrl(),
    fileSize: fc.integer({ min: 100000, max: 10000000 })
  }), { minLength: 1, maxLength: 5 }),
  thumbnailUrl: fc.webUrl(),
  originalUrl: fc.webUrl(),
  likeCount: fc.integer({ min: 0, max: 10000 }),
  downloadCount: fc.integer({ min: 0, max: 100000 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

describe('UserPreferenceService 속성 기반 테스트', () => {
  /**
   * **Feature: wallpaper-website, Property 5: 좋아요 추가 일관성**
   * **검증 대상: 요구사항 3.2**
   * 
   * 모든 사용자와 배경화면 조합에 대해, 좋아요 추가 후 해당 사용자의 좋아요 목록에 
   * 해당 배경화면이 포함되어야 한다
   */
  test('속성 5: 좋아요 추가 일관성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArb, { minLength: 1, maxLength: 10 }),
        fc.array(userLikeArb, { minLength: 0, maxLength: 20 }),
        fc.uuid(), // userId
        async (wallpapers, existingLikes, userId) => {
          // Given: 배경화면 목록과 기존 좋아요 데이터
          const mockUserRepo = new MockUserRepository(existingLikes);
          const mockWallpaperRepo = new MockWallpaperRepository(wallpapers);
          const service = new UserPreferenceService(mockUserRepo, mockWallpaperRepo);

          // 존재하는 배경화면 중 하나를 선택
          const wallpaper = wallpapers[0];

          // When: 좋아요 추가
          const result = await service.addLike(userId, wallpaper.id);

          // Then: 좋아요가 추가되었고, 사용자의 좋아요 목록에 포함되어야 함
          if (result) {
            const userLikes = await service.getUserLikes(userId);
            const hasLike = userLikes.some(like => 
              like.userId === userId && like.wallpaperId === wallpaper.id
            );
            expect(hasLike).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: wallpaper-website, Property 6: 좋아요 토글 라운드트립**
   * **검증 대상: 요구사항 3.3**
   * 
   * 모든 사용자와 배경화면 조합에 대해, 좋아요 추가 후 즉시 제거하면 원래 상태로 돌아가야 한다
   */
  test('속성 6: 좋아요 토글 라운드트립', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArb, { minLength: 1, maxLength: 10 }),
        fc.uuid(), // userId
        async (wallpapers, userId) => {
          // Given: 배경화면 목록과 사용자 ID
          const mockUserRepo = new MockUserRepository();
          const mockWallpaperRepo = new MockWallpaperRepository(wallpapers);
          const service = new UserPreferenceService(mockUserRepo, mockWallpaperRepo);

          const wallpaper = wallpapers[0];

          // 초기 상태 확인
          const initialLikes = await service.getUserLikes(userId);
          const initialCount = initialLikes.length;

          // When: 좋아요 추가 후 즉시 제거
          await service.addLike(userId, wallpaper.id);
          await service.removeLike(userId, wallpaper.id);

          // Then: 원래 상태로 돌아가야 함
          const finalLikes = await service.getUserLikes(userId);
          expect(finalLikes.length).toBe(initialCount);

          // 해당 배경화면에 대한 좋아요가 없어야 함
          const hasLike = finalLikes.some(like => like.wallpaperId === wallpaper.id);
          expect(hasLike).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: wallpaper-website, Property 8: 좋아요 목록 필터링**
   * **검증 대상: 요구사항 3.5**
   * 
   * 모든 사용자에 대해, 좋아요 목록 조회 시 해당 사용자가 좋아요를 표시한 배경화면들만 반환되어야 한다
   */
  test('속성 8: 좋아요 목록 필터링', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userLikeArb, { minLength: 0, maxLength: 50 }),
        fc.uuid(), // targetUserId
        async (allUserLikes, targetUserId) => {
          // Given: 모든 사용자의 좋아요 데이터
          const mockUserRepo = new MockUserRepository(allUserLikes);
          const mockWallpaperRepo = new MockWallpaperRepository();
          const service = new UserPreferenceService(mockUserRepo, mockWallpaperRepo);

          // When: 특정 사용자의 좋아요 목록 조회
          const userLikes = await service.getUserLikes(targetUserId);

          // Then: 반환된 모든 좋아요는 해당 사용자의 것이어야 함
          return userLikes.every(like => like.userId === targetUserId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // 추가 테스트: 좋아요 상태 확인 정확성
  test('좋아요 상태 확인이 정확한지 검증', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wallpaperArb, { minLength: 1, maxLength: 10 }),
        fc.uuid(),
        async (wallpapers, userId) => {
          const mockUserRepo = new MockUserRepository();
          const mockWallpaperRepo = new MockWallpaperRepository(wallpapers);
          const service = new UserPreferenceService(mockUserRepo, mockWallpaperRepo);

          const wallpaper = wallpapers[0];

          // 초기에는 좋아요가 없어야 함
          const initialLiked = await service.isLiked(userId, wallpaper.id);
          expect(initialLiked).toBe(false);

          // 좋아요 추가 후에는 좋아요가 있어야 함
          await service.addLike(userId, wallpaper.id);
          const afterAddLiked = await service.isLiked(userId, wallpaper.id);
          expect(afterAddLiked).toBe(true);

          // 좋아요 제거 후에는 다시 좋아요가 없어야 함
          await service.removeLike(userId, wallpaper.id);
          const afterRemoveLiked = await service.isLiked(userId, wallpaper.id);
          expect(afterRemoveLiked).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});