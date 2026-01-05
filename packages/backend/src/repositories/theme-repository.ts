/**
 * 테마 리포지토리
 */

import { Theme } from '@wallix/shared';
import { JsonStorage } from '../utils/json-storage';
import { BaseRepository } from './base-repository';
import { v4 as uuidv4 } from 'uuid';

/**
 * 테마 데이터 접근을 담당하는 리포지토리
 */
export class ThemeRepository implements BaseRepository<Theme> {
  private storage: JsonStorage<Theme>;

  constructor() {
    this.storage = new JsonStorage<Theme>('themes.json');
  }

  /**
   * ID로 테마 조회
   */
  async findById(id: string): Promise<Theme | null> {
    const theme = await this.storage.find(item => item.id === id);
    return theme || null;
  }

  /**
   * 모든 테마 조회
   */
  async findAll(): Promise<Theme[]> {
    return await this.storage.findAll();
  }

  /**
   * 조건에 맞는 테마들 조회
   */
  async findBy(predicate: (item: Theme) => boolean): Promise<Theme[]> {
    return await this.storage.findAll(predicate);
  }

  /**
   * 활성화된 테마들만 조회
   */
  async findActive(): Promise<Theme[]> {
    return await this.storage.findAll(theme => theme.isActive);
  }

  /**
   * 정렬 순서대로 테마 조회
   */
  async findAllSorted(): Promise<Theme[]> {
    const themes = await this.storage.findAll();
    return themes.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 활성화된 테마들을 정렬 순서대로 조회
   */
  async findActiveSorted(): Promise<Theme[]> {
    const themes = await this.storage.findAll(theme => theme.isActive);
    return themes.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * 새 테마 생성
   */
  async create(themeData: Omit<Theme, 'id' | 'createdAt'>): Promise<Theme> {
    const theme: Theme = {
      id: uuidv4(),
      ...themeData,
      createdAt: new Date()
    };

    await this.storage.add(theme);
    return theme;
  }

  /**
   * 테마 업데이트
   */
  async update(id: string, updates: Partial<Theme>): Promise<Theme | null> {
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
   * 테마 삭제
   */
  async delete(id: string): Promise<boolean> {
    return await this.storage.delete(item => item.id === id);
  }

  /**
   * 테마 존재 여부 확인
   */
  async exists(id: string): Promise<boolean> {
    return await this.storage.exists(item => item.id === id);
  }

  /**
   * 전체 테마 수 조회
   */
  async count(): Promise<number> {
    return await this.storage.count();
  }

  /**
   * 테마의 배경화면 수 업데이트
   */
  async updateWallpaperCount(id: string, count: number): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        wallpaperCount: count
      })
    );
  }

  /**
   * 테마의 배경화면 수 증가
   */
  async incrementWallpaperCount(id: string): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        wallpaperCount: item.wallpaperCount + 1
      })
    );
  }

  /**
   * 테마의 배경화면 수 감소
   */
  async decrementWallpaperCount(id: string): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        wallpaperCount: Math.max(0, item.wallpaperCount - 1)
      })
    );
  }

  /**
   * 테마 활성화/비활성화
   */
  async setActive(id: string, isActive: boolean): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        isActive
      })
    );
  }
}