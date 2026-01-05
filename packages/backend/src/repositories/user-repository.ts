/**
 * 사용자 좋아요 리포지토리
 */

import { UserLike } from '@wallix/shared';
import { JsonStorage } from '../utils/json-storage';
import { BaseRepository } from './base-repository';
import { v4 as uuidv4 } from 'uuid';

/**
 * 사용자 좋아요 데이터 접근을 담당하는 리포지토리
 */
export class UserRepository implements BaseRepository<UserLike> {
  private storage: JsonStorage<UserLike>;

  constructor() {
    this.storage = new JsonStorage<UserLike>('user-likes.json');
  }

  /**
   * ID로 좋아요 조회
   */
  async findById(id: string): Promise<UserLike | null> {
    const like = await this.storage.find(item => item.id === id);
    return like || null;
  }

  /**
   * 모든 좋아요 조회
   */
  async findAll(): Promise<UserLike[]> {
    return await this.storage.findAll();
  }

  /**
   * 조건에 맞는 좋아요들 조회
   */
  async findBy(predicate: (item: UserLike) => boolean): Promise<UserLike[]> {
    return await this.storage.findAll(predicate);
  }

  /**
   * 특정 사용자의 모든 좋아요 조회
   */
  async findByUserId(userId: string): Promise<UserLike[]> {
    return await this.storage.findAll(like => like.userId === userId);
  }

  /**
   * 특정 배경화면의 모든 좋아요 조회
   */
  async findByWallpaperId(wallpaperId: string): Promise<UserLike[]> {
    return await this.storage.findAll(like => like.wallpaperId === wallpaperId);
  }

  /**
   * 특정 사용자가 특정 배경화면에 좋아요를 했는지 확인
   */
  async findByUserAndWallpaper(userId: string, wallpaperId: string): Promise<UserLike | null> {
    const like = await this.storage.find(
      item => item.userId === userId && item.wallpaperId === wallpaperId
    );
    return like || null;
  }

  /**
   * 사용자가 좋아요한 배경화면 ID 목록 조회
   */
  async getLikedWallpaperIds(userId: string): Promise<string[]> {
    const likes = await this.findByUserId(userId);
    return likes.map(like => like.wallpaperId);
  }

  /**
   * 새 좋아요 생성
   */
  async create(likeData: Omit<UserLike, 'id' | 'likedAt'>): Promise<UserLike> {
    const like: UserLike = {
      id: uuidv4(),
      ...likeData,
      likedAt: new Date()
    };

    await this.storage.add(like);
    return like;
  }

  /**
   * 좋아요 업데이트 (일반적으로 사용되지 않음)
   */
  async update(id: string, updates: Partial<UserLike>): Promise<UserLike | null> {
    const updated = await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        ...updates
      })
    );

    if (!updated) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * 좋아요 삭제
   */
  async delete(id: string): Promise<boolean> {
    return await this.storage.delete(item => item.id === id);
  }

  /**
   * 사용자와 배경화면으로 좋아요 삭제
   */
  async deleteByUserAndWallpaper(userId: string, wallpaperId: string): Promise<boolean> {
    return await this.storage.delete(
      item => item.userId === userId && item.wallpaperId === wallpaperId
    );
  }

  /**
   * 좋아요 존재 여부 확인
   */
  async exists(id: string): Promise<boolean> {
    return await this.storage.exists(item => item.id === id);
  }

  /**
   * 사용자가 특정 배경화면에 좋아요를 했는지 확인
   */
  async isLiked(userId: string, wallpaperId: string): Promise<boolean> {
    return await this.storage.exists(
      item => item.userId === userId && item.wallpaperId === wallpaperId
    );
  }

  /**
   * 전체 좋아요 수 조회
   */
  async count(): Promise<number> {
    return await this.storage.count();
  }

  /**
   * 특정 사용자의 좋아요 수 조회
   */
  async countByUserId(userId: string): Promise<number> {
    return await this.storage.count(like => like.userId === userId);
  }

  /**
   * 특정 배경화면의 좋아요 수 조회
   */
  async countByWallpaperId(wallpaperId: string): Promise<number> {
    return await this.storage.count(like => like.wallpaperId === wallpaperId);
  }

  /**
   * 좋아요 토글 (있으면 삭제, 없으면 생성)
   */
  async toggleLike(userId: string, wallpaperId: string): Promise<{ liked: boolean; like?: UserLike }> {
    const existingLike = await this.findByUserAndWallpaper(userId, wallpaperId);
    
    if (existingLike) {
      // 좋아요가 있으면 삭제
      await this.delete(existingLike.id);
      return { liked: false };
    } else {
      // 좋아요가 없으면 생성
      const newLike = await this.create({ userId, wallpaperId });
      return { liked: true, like: newLike };
    }
  }

  /**
   * UserPreferenceService에서 사용하는 메서드들
   */

  /**
   * 좋아요 추가 (별칭)
   */
  async addLike(userId: string, wallpaperId: string): Promise<UserLike> {
    return await this.create({ userId, wallpaperId });
  }

  /**
   * 좋아요 제거 (별칭)
   */
  async removeLike(userId: string, wallpaperId: string): Promise<boolean> {
    return await this.deleteByUserAndWallpaper(userId, wallpaperId);
  }

  /**
   * 좋아요 찾기 (별칭)
   */
  async findLike(userId: string, wallpaperId: string): Promise<UserLike | null> {
    return await this.findByUserAndWallpaper(userId, wallpaperId);
  }

  /**
   * 사용자 좋아요 목록 조회 (별칭)
   */
  async getUserLikes(userId: string): Promise<UserLike[]> {
    return await this.findByUserId(userId);
  }

  /**
   * 사용자의 모든 좋아요 제거
   */
  async clearUserLikes(userId: string): Promise<boolean> {
    const userLikes = await this.findByUserId(userId);
    let allDeleted = true;
    
    for (const like of userLikes) {
      const deleted = await this.delete(like.id);
      if (!deleted) {
        allDeleted = false;
      }
    }
    
    return allDeleted;
  }
}