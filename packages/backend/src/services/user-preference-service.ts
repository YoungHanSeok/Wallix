/**
 * 사용자 선호도 서비스
 * 사용자 좋아요 관련 비즈니스 로직을 담당합니다.
 */

import { UserLike, Wallpaper } from '@wallix/shared';
import { UserRepository } from '../repositories/user-repository';
import { WallpaperRepository } from '../repositories/wallpaper-repository';

/**
 * 사용자 선호도 서비스 클래스
 */
export class UserPreferenceService {
  private userRepository: UserRepository;
  private wallpaperRepository: WallpaperRepository;

  constructor(
    userRepository?: UserRepository,
    wallpaperRepository?: WallpaperRepository
  ) {
    this.userRepository = userRepository || new UserRepository();
    this.wallpaperRepository = wallpaperRepository || new WallpaperRepository();
  }

  /**
   * 좋아요 추가
   * 요구사항 3.2: 좋아요 버튼을 클릭하면 해당 배경화면을 사용자의 좋아요 목록에 추가한다
   */
  async addLike(userId: string, wallpaperId: string): Promise<UserLike | null> {
    // 이미 좋아요가 있는지 확인
    const existingLike = await this.userRepository.findLike(userId, wallpaperId);
    if (existingLike) {
      return existingLike; // 이미 좋아요가 있으면 기존 것을 반환
    }

    // 배경화면이 존재하는지 확인
    const wallpaperExists = await this.wallpaperRepository.exists(wallpaperId);
    if (!wallpaperExists) {
      return null;
    }

    // 좋아요 추가
    const userLike = await this.userRepository.addLike(userId, wallpaperId);
    
    // 배경화면의 좋아요 수 증가
    await this.wallpaperRepository.incrementLikeCount(wallpaperId);

    return userLike;
  }

  /**
   * 좋아요 제거
   * 요구사항 3.3: 이미 좋아요를 표시한 배경화면을 다시 클릭하면 좋아요를 취소하고 목록에서 제거한다
   */
  async removeLike(userId: string, wallpaperId: string): Promise<boolean> {
    // 좋아요가 존재하는지 확인
    const existingLike = await this.userRepository.findLike(userId, wallpaperId);
    if (!existingLike) {
      return false; // 좋아요가 없으면 false 반환
    }

    // 좋아요 제거
    const removed = await this.userRepository.removeLike(userId, wallpaperId);
    
    if (removed) {
      // 배경화면의 좋아요 수 감소
      await this.wallpaperRepository.decrementLikeCount(wallpaperId);
    }

    return removed;
  }

  /**
   * 좋아요 토글 (추가/제거)
   */
  async toggleLike(userId: string, wallpaperId: string): Promise<{ liked: boolean; userLike?: UserLike }> {
    const existingLike = await this.userRepository.findLike(userId, wallpaperId);
    
    if (existingLike) {
      // 좋아요가 있으면 제거
      const removed = await this.removeLike(userId, wallpaperId);
      return { liked: !removed };
    } else {
      // 좋아요가 없으면 추가
      const userLike = await this.addLike(userId, wallpaperId);
      return { 
        liked: userLike !== null, 
        userLike: userLike || undefined 
      };
    }
  }

  /**
   * 사용자 좋아요 목록 조회
   * 요구사항 3.5: 사용자가 좋아요 목록을 요청하면 사용자가 좋아요를 표시한 모든 배경화면을 표시한다
   */
  async getUserLikes(userId: string): Promise<UserLike[]> {
    return await this.userRepository.getUserLikes(userId);
  }

  /**
   * 사용자가 좋아요한 배경화면 목록 조회
   */
  async getUserLikedWallpapers(userId: string): Promise<Wallpaper[]> {
    const userLikes = await this.userRepository.getUserLikes(userId);
    const wallpaperIds = userLikes.map(like => like.wallpaperId);
    
    const wallpapers: Wallpaper[] = [];
    for (const wallpaperId of wallpaperIds) {
      const wallpaper = await this.wallpaperRepository.findById(wallpaperId);
      if (wallpaper) {
        wallpapers.push(wallpaper);
      }
    }
    
    return wallpapers;
  }

  /**
   * 특정 배경화면에 대한 좋아요 상태 확인
   */
  async isLiked(userId: string, wallpaperId: string): Promise<boolean> {
    const like = await this.userRepository.findLike(userId, wallpaperId);
    return like !== null;
  }

  /**
   * 사용자의 좋아요 수 조회
   */
  async getUserLikeCount(userId: string): Promise<number> {
    const likes = await this.userRepository.getUserLikes(userId);
    return likes.length;
  }

  /**
   * 특정 배경화면의 좋아요 수 조회
   */
  async getWallpaperLikeCount(wallpaperId: string): Promise<number> {
    const wallpaper = await this.wallpaperRepository.findById(wallpaperId);
    return wallpaper ? wallpaper.likeCount : 0;
  }

  /**
   * 사용자의 모든 좋아요 제거
   */
  async clearUserLikes(userId: string): Promise<boolean> {
    const userLikes = await this.userRepository.getUserLikes(userId);
    
    // 각 배경화면의 좋아요 수 감소
    for (const like of userLikes) {
      await this.wallpaperRepository.decrementLikeCount(like.wallpaperId);
    }
    
    // 사용자의 모든 좋아요 제거
    return await this.userRepository.clearUserLikes(userId);
  }
}