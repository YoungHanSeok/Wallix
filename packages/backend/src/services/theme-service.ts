/**
 * 테마 서비스
 * 테마 관련 비즈니스 로직을 담당합니다.
 */

import { Theme } from '@wallix/shared';
import { ThemeRepository } from '../repositories/theme-repository';
import { transformThemeUrls } from '../utils/url-helper';

/**
 * 테마 서비스 클래스
 */
export class ThemeService {
  private themeRepository: ThemeRepository;

  constructor(themeRepository?: ThemeRepository) {
    this.themeRepository = themeRepository || new ThemeRepository();
  }

  /**
   * 테마 URL 변환 (아이콘 경로를 절대 URL로 변환)
   */
  private transformTheme(theme: Theme): Theme {
    return transformThemeUrls(theme);
  }

  /**
   * 테마 배열 URL 변환
   */
  private transformThemes(themes: Theme[]): Theme[] {
    return themes.map(theme => this.transformTheme(theme));
  }

  /**
   * 모든 테마 조회
   * 요구사항 1.1: 웹사이트에 접속하면 사용 가능한 모든 테마 카테고리를 표시한다
   */
  async getAllThemes(): Promise<Theme[]> {
    const themes = await this.themeRepository.findAllSorted();
    return this.transformThemes(themes);
  }

  /**
   * 활성화된 테마들만 조회
   */
  async getActiveThemes(): Promise<Theme[]> {
    const themes = await this.themeRepository.findActiveSorted();
    return this.transformThemes(themes);
  }

  /**
   * ID로 테마 조회
   */
  async getThemeById(id: string): Promise<Theme | null> {
    const theme = await this.themeRepository.findById(id);
    return theme ? this.transformTheme(theme) : null;
  }

  /**
   * 테마 생성
   */
  async createTheme(themeData: Omit<Theme, 'id' | 'createdAt'>): Promise<Theme> {
    return await this.themeRepository.create(themeData);
  }

  /**
   * 테마 업데이트
   */
  async updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | null> {
    return await this.themeRepository.update(id, updates);
  }

  /**
   * 테마 삭제
   */
  async deleteTheme(id: string): Promise<boolean> {
    return await this.themeRepository.delete(id);
  }

  /**
   * 테마 활성화/비활성화
   */
  async setThemeActive(id: string, isActive: boolean): Promise<boolean> {
    return await this.themeRepository.setActive(id, isActive);
  }

  /**
   * 테마의 배경화면 수 업데이트
   */
  async updateWallpaperCount(id: string, count: number): Promise<boolean> {
    return await this.themeRepository.updateWallpaperCount(id, count);
  }

  /**
   * 테마의 배경화면 수 증가
   */
  async incrementWallpaperCount(id: string): Promise<boolean> {
    return await this.themeRepository.incrementWallpaperCount(id);
  }

  /**
   * 테마의 배경화면 수 감소
   */
  async decrementWallpaperCount(id: string): Promise<boolean> {
    return await this.themeRepository.decrementWallpaperCount(id);
  }

  /**
   * 테마 존재 여부 확인
   */
  async themeExists(id: string): Promise<boolean> {
    return await this.themeRepository.exists(id);
  }

  /**
   * 전체 테마 수 조회
   */
  async getThemeCount(): Promise<number> {
    return await this.themeRepository.count();
  }
}