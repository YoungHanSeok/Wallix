/**
 * 배경화면 리포지토리
 */

import { Wallpaper } from '@wallix/shared';
import { JsonStorage } from '../utils/json-storage';
import { BaseRepository } from './base-repository';
import { v4 as uuidv4 } from 'uuid';

/**
 * 배경화면 데이터 접근을 담당하는 리포지토리
 */
export class WallpaperRepository implements BaseRepository<Wallpaper> {
  private storage: JsonStorage<Wallpaper>;

  constructor() {
    this.storage = new JsonStorage<Wallpaper>('wallpapers.json');
  }

  /**
   * ID로 배경화면 조회
   */
  async findById(id: string): Promise<Wallpaper | null> {
    const wallpaper = await this.storage.find(item => item.id === id);
    return wallpaper || null;
  }

  /**
   * 모든 배경화면 조회
   */
  async findAll(): Promise<Wallpaper[]> {
    return await this.storage.findAll();
  }

  /**
   * 조건에 맞는 배경화면들 조회
   */
  async findBy(predicate: (item: Wallpaper) => boolean): Promise<Wallpaper[]> {
    return await this.storage.findAll(predicate);
  }

  /**
   * 테마별 배경화면 조회
   */
  async findByTheme(themeId: string): Promise<Wallpaper[]> {
    return await this.storage.findAll(wallpaper => wallpaper.themeId === themeId);
  }

  /**
   * 태그로 배경화면 검색
   */
  async findByTags(tags: string[]): Promise<Wallpaper[]> {
    return await this.storage.findAll(wallpaper => 
      tags.some(tag => wallpaper.tags.includes(tag))
    );
  }

  /**
   * 제목이나 태그로 배경화면 검색
   */
  async search(query: string): Promise<Wallpaper[]> {
    const lowerQuery = query.toLowerCase();
    return await this.storage.findAll(wallpaper => 
      wallpaper.title.toLowerCase().includes(lowerQuery) ||
      wallpaper.description?.toLowerCase().includes(lowerQuery) ||
      wallpaper.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 새 배경화면 생성
   */
  async create(wallpaperData: Omit<Wallpaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wallpaper> {
    const now = new Date();
    const wallpaper: Wallpaper = {
      id: uuidv4(),
      ...wallpaperData,
      createdAt: now,
      updatedAt: now
    };

    await this.storage.add(wallpaper);
    return wallpaper;
  }

  /**
   * 배경화면 업데이트
   */
  async update(id: string, updates: Partial<Wallpaper>): Promise<Wallpaper | null> {
    const updated = await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        ...updates,
        updatedAt: new Date()
      })
    );

    if (!updated) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * 배경화면 삭제
   */
  async delete(id: string): Promise<boolean> {
    return await this.storage.delete(item => item.id === id);
  }

  /**
   * 배경화면 존재 여부 확인
   */
  async exists(id: string): Promise<boolean> {
    return await this.storage.exists(item => item.id === id);
  }

  /**
   * 전체 배경화면 수 조회
   */
  async count(): Promise<number> {
    return await this.storage.count();
  }

  /**
   * 좋아요 수 증가
   */
  async incrementLikeCount(id: string): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        likeCount: item.likeCount + 1,
        updatedAt: new Date()
      })
    );
  }

  /**
   * 좋아요 수 감소
   */
  async decrementLikeCount(id: string): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        likeCount: Math.max(0, item.likeCount - 1),
        updatedAt: new Date()
      })
    );
  }

  /**
   * 다운로드 수 증가
   */
  async incrementDownloadCount(id: string): Promise<boolean> {
    return await this.storage.update(
      item => item.id === id,
      item => ({
        ...item,
        downloadCount: item.downloadCount + 1,
        updatedAt: new Date()
      })
    );
  }
}