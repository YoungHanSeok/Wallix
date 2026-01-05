/**
 * 사용자 리포지토리 속성 기반 테스트
 * **Feature: wallpaper-website, Property 12: 좋아요 데이터 즉시 반영**
 * **Validates: Requirements 5.2**
 */

import * as fc from 'fast-check';
import { UserRepository } from './user-repository';
import { UserLike } from '@wallix/shared';
import fs from 'fs/promises';
import path from 'path';

describe('UserRepository Property Tests', () => {
  let userRepository: UserRepository;
  const testDataPath = path.join(__dirname, '../data/user-likes-test.json');

  beforeEach(async () => {
    // 테스트용 임시 리포지토리 생성
    userRepository = new (class extends UserRepository {
      constructor() {
        super();
        // 테스트용 파일 경로로 오버라이드
        (this as any).storage.filePath = testDataPath;
      }
    })();

    // 테스트 데이터 파일 초기화
    await fs.writeFile(testDataPath, '[]', 'utf-8').catch(() => {});
  });

  afterEach(async () => {
    // 테스트 데이터 파일 정리
    await fs.unlink(testDataPath).catch(() => {});
  });

  /**
   * 속성 12: 좋아요 데이터 즉시 반영
   * 모든 좋아요 변경 작업에 대해, 변경 후 즉시 데이터베이스 조회 시 변경된 상태가 반영되어야 한다
   */
  test('Property 12: 좋아요 데이터 즉시 반영', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 사용자 ID와 배경화면 ID 생성
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (userId, wallpaperId) => {
          // 테스트 시작 전 데이터 초기화
          await fs.writeFile(testDataPath, '[]', 'utf-8');

          // 초기 상태: 좋아요가 없어야 함
          const initialLiked = await userRepository.isLiked(userId, wallpaperId);
          expect(initialLiked).toBe(false);

          // 좋아요 추가
          const addResult = await userRepository.toggleLike(userId, wallpaperId);
          expect(addResult.liked).toBe(true);

          // 즉시 조회 시 좋아요가 반영되어야 함
          const afterAdd = await userRepository.isLiked(userId, wallpaperId);
          expect(afterAdd).toBe(true);

          // 좋아요한 배경화면 목록에도 포함되어야 함
          const likedWallpapers = await userRepository.getLikedWallpaperIds(userId);
          expect(likedWallpapers).toContain(wallpaperId);

          // 좋아요 제거
          const removeResult = await userRepository.toggleLike(userId, wallpaperId);
          expect(removeResult.liked).toBe(false);

          // 즉시 조회 시 좋아요가 제거되어야 함
          const afterRemove = await userRepository.isLiked(userId, wallpaperId);
          expect(afterRemove).toBe(false);

          // 좋아요한 배경화면 목록에서도 제거되어야 함
          const likedWallpapersAfterRemove = await userRepository.getLikedWallpaperIds(userId);
          expect(likedWallpapersAfterRemove).not.toContain(wallpaperId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 추가 속성 테스트: 좋아요 카운트 일관성
   * 좋아요 추가/제거 시 카운트가 정확히 반영되어야 함
   */
  test('Property: 좋아요 카운트 일관성', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            wallpaperId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (likes) => {
          // 테스트 시작 전 데이터 초기화
          await fs.writeFile(testDataPath, '[]', 'utf-8');

          // 중복 제거 (같은 사용자가 같은 배경화면에 여러 번 좋아요할 수 없음)
          const uniqueLikes = likes.filter((like, index, arr) => 
            arr.findIndex(l => l.userId === like.userId && l.wallpaperId === like.wallpaperId) === index
          );

          // 모든 좋아요 추가
          for (const like of uniqueLikes) {
            await userRepository.toggleLike(like.userId, like.wallpaperId);
          }

          // 각 배경화면별 좋아요 수 확인
          const wallpaperIds = [...new Set(uniqueLikes.map(l => l.wallpaperId))];
          for (const wallpaperId of wallpaperIds) {
            const expectedCount = uniqueLikes.filter(l => l.wallpaperId === wallpaperId).length;
            const actualCount = await userRepository.countByWallpaperId(wallpaperId);
            expect(actualCount).toBe(expectedCount);
          }

          // 각 사용자별 좋아요 수 확인
          const userIds = [...new Set(uniqueLikes.map(l => l.userId))];
          for (const userId of userIds) {
            const expectedCount = uniqueLikes.filter(l => l.userId === userId).length;
            const actualCount = await userRepository.countByUserId(userId);
            expect(actualCount).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 추가 속성 테스트: 좋아요 토글 라운드트립
   * 좋아요 추가 후 제거하면 원래 상태로 돌아가야 함
   */
  test('Property: 좋아요 토글 라운드트립', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (userId, wallpaperId) => {
          // 테스트 시작 전 데이터 초기화
          await fs.writeFile(testDataPath, '[]', 'utf-8');

          // 초기 상태 저장
          const initialState = await userRepository.isLiked(userId, wallpaperId);
          const initialCount = await userRepository.countByWallpaperId(wallpaperId);

          // 토글 두 번 (추가 후 제거 또는 제거 후 추가)
          await userRepository.toggleLike(userId, wallpaperId);
          await userRepository.toggleLike(userId, wallpaperId);

          // 원래 상태로 돌아가야 함
          const finalState = await userRepository.isLiked(userId, wallpaperId);
          const finalCount = await userRepository.countByWallpaperId(wallpaperId);

          expect(finalState).toBe(initialState);
          expect(finalCount).toBe(initialCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});