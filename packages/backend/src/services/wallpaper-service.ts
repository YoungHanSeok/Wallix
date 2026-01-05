/**
 * 배경화면 서비스
 * 배경화면 관련 비즈니스 로직을 담당합니다.
 */

import { Wallpaper, Resolution, SearchResult } from '@wallix/shared';
import { WallpaperRepository } from '../repositories/wallpaper-repository';
import { transformWallpaperUrls } from '../utils/url-helper';

/**
 * 해상도 매칭을 위한 인터페이스
 */
interface ResolutionMatch {
  resolution: Resolution;
  distance: number;
}

/**
 * 배경화면 서비스 클래스
 */
export class WallpaperService {
  private wallpaperRepository: WallpaperRepository;

  constructor(wallpaperRepository?: WallpaperRepository) {
    this.wallpaperRepository = wallpaperRepository || new WallpaperRepository();
  }

  /**
   * 배경화면 URL 변환 (이미지 경로를 절대 URL로 변환)
   */
  private transformWallpaper(wallpaper: Wallpaper): Wallpaper {
    return transformWallpaperUrls(wallpaper);
  }

  /**
   * 배경화면 배열 URL 변환
   */
  private transformWallpapers(wallpapers: Wallpaper[]): Wallpaper[] {
    return wallpapers.map(wallpaper => this.transformWallpaper(wallpaper));
  }

  /**
   * 모든 배경화면 조회
   */
  async getAllWallpapers(): Promise<Wallpaper[]> {
    const wallpapers = await this.wallpaperRepository.findAll();
    return this.transformWallpapers(wallpapers);
  }

  /**
   * ID로 배경화면 조회
   */
  async getWallpaperById(id: string): Promise<Wallpaper | null> {
    const wallpaper = await this.wallpaperRepository.findById(id);
    return wallpaper ? this.transformWallpaper(wallpaper) : null;
  }

  /**
   * 테마별 배경화면 조회
   * 요구사항 1.2: 특정 테마를 선택하면 해당 테마에 속하는 배경화면들을 표시한다
   */
  async getWallpapersByTheme(themeId: string): Promise<Wallpaper[]> {
    const wallpapers = await this.wallpaperRepository.findByTheme(themeId);
    return this.transformWallpapers(wallpapers);
  }

  /**
   * 배경화면 검색
   * 요구사항 4.2: 검색어를 입력하면 실시간으로 관련 배경화면을 필터링하여 표시한다
   */
  async searchWallpapers(
    query: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<SearchResult> {
    const allResults = await this.wallpaperRepository.search(query);
    const totalCount = allResults.length;
    
    // 페이지네이션 적용
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const wallpapers = allResults.slice(startIndex, endIndex);
    
    return {
      wallpapers: this.transformWallpapers(wallpapers),
      totalCount,
      page,
      pageSize,
      hasMore: endIndex < totalCount
    };
  }

  /**
   * 해상도 매칭 알고리즘
   * 요구사항 2.5: 해상도가 사용 불가능한 경우, 가장 가까운 사용 가능한 해상도를 제안한다
   */
  findBestResolutionMatch(
    availableResolutions: Resolution[], 
    targetWidth: number, 
    targetHeight: number
  ): Resolution | null {
    if (availableResolutions.length === 0) {
      return null;
    }

    // 정확히 일치하는 해상도가 있는지 확인
    const exactMatch = availableResolutions.find(
      res => res.width === targetWidth && res.height === targetHeight
    );
    
    if (exactMatch) {
      return exactMatch;
    }

    // 가장 가까운 해상도 찾기 (유클리드 거리 사용)
    const matches: ResolutionMatch[] = availableResolutions.map(resolution => ({
      resolution,
      distance: this.calculateResolutionDistance(
        resolution.width, 
        resolution.height, 
        targetWidth, 
        targetHeight
      )
    }));

    // 거리순으로 정렬하여 가장 가까운 해상도 반환
    matches.sort((a, b) => a.distance - b.distance);
    return matches[0].resolution;
  }

  /**
   * 두 해상도 간의 거리 계산 (유클리드 거리)
   */
  private calculateResolutionDistance(
    width1: number, 
    height1: number, 
    width2: number, 
    height2: number
  ): number {
    const widthDiff = width1 - width2;
    const heightDiff = height1 - height2;
    return Math.sqrt(widthDiff * widthDiff + heightDiff * heightDiff);
  }

  /**
   * 배경화면의 특정 해상도 조회
   */
  async getWallpaperResolution(
    wallpaperId: string, 
    targetWidth: number, 
    targetHeight: number
  ): Promise<Resolution | null> {
    const wallpaper = await this.wallpaperRepository.findById(wallpaperId);
    
    if (!wallpaper) {
      return null;
    }

    return this.findBestResolutionMatch(
      wallpaper.resolutions, 
      targetWidth, 
      targetHeight
    );
  }

  /**
   * 다운로드 수 증가
   */
  async incrementDownloadCount(wallpaperId: string): Promise<boolean> {
    return await this.wallpaperRepository.incrementDownloadCount(wallpaperId);
  }

  /**
   * 좋아요 수 증가
   */
  async incrementLikeCount(wallpaperId: string): Promise<boolean> {
    return await this.wallpaperRepository.incrementLikeCount(wallpaperId);
  }

  /**
   * 좋아요 수 감소
   */
  async decrementLikeCount(wallpaperId: string): Promise<boolean> {
    return await this.wallpaperRepository.decrementLikeCount(wallpaperId);
  }

  /**
   * 인기 배경화면 조회 (좋아요 수 기준)
   */
  async getPopularWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    const allWallpapers = await this.wallpaperRepository.findAll();
    return allWallpapers
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  }

  /**
   * 최신 배경화면 조회
   */
  async getLatestWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    const allWallpapers = await this.wallpaperRepository.findAll();
    return allWallpapers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}