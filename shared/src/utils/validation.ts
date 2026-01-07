import { Wallpaper, Theme, Resolution, UserLike, SearchResult } from '../types/wallpaper';
import validator from 'validator';

/**
 * 입력 데이터 sanitization
 * XSS 공격을 방지합니다.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTML 태그 제거 및 특수 문자 이스케이프
  return validator.escape(input.trim());
}

/**
 * 검색어 검증 및 sanitization
 */
export function validateAndSanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  // 길이 제한 (최대 100자)
  const trimmed = query.trim();
  if (trimmed.length > 100) {
    throw new Error('검색어는 100자를 초과할 수 없습니다');
  }
  
  // 특수 문자 제한 (정규식 인젝션 방지)
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  
  // 최소 길이 확인
  if (sanitized.length < 1) {
    throw new Error('검색어는 최소 1자 이상이어야 합니다');
  }
  
  return sanitized;
}

/**
 * 파일명 검증
 */
export function validateFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }
  
  // 길이 제한
  if (fileName.length > 255) {
    return false;
  }
  
  // 위험한 문자 확인
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return false;
  }
  
  return true;
}

/**
 * URL 검증
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
}

/**
 * 배경화면 데이터 유효성 검증
 */
export function validateWallpaper(wallpaper: any): wallpaper is Wallpaper {
  return (
    typeof wallpaper === 'object' &&
    typeof wallpaper.id === 'string' &&
    wallpaper.id.length > 0 &&
    wallpaper.id.length <= 50 &&
    typeof wallpaper.title === 'string' &&
    wallpaper.title.length > 0 &&
    wallpaper.title.length <= 200 &&
    typeof wallpaper.themeId === 'string' &&
    wallpaper.themeId.length > 0 &&
    wallpaper.themeId.length <= 50 &&
    Array.isArray(wallpaper.resolutions) &&
    wallpaper.resolutions.length > 0 &&
    wallpaper.resolutions.every(validateResolution) &&
    Array.isArray(wallpaper.tags) &&
    wallpaper.tags.every((tag: any) => typeof tag === 'string' && tag.length <= 50) &&
    typeof wallpaper.thumbnailUrl === 'string' &&
    validateUrl(wallpaper.thumbnailUrl) &&
    typeof wallpaper.originalUrl === 'string' &&
    validateUrl(wallpaper.originalUrl) &&
    typeof wallpaper.likeCount === 'number' &&
    wallpaper.likeCount >= 0 &&
    typeof wallpaper.downloadCount === 'number' &&
    wallpaper.downloadCount >= 0
  );
}

/**
 * 해상도 데이터 유효성 검증
 */
export function validateResolution(resolution: any): resolution is Resolution {
  return (
    typeof resolution === 'object' &&
    typeof resolution.width === 'number' &&
    resolution.width > 0 &&
    typeof resolution.height === 'number' &&
    resolution.height > 0 &&
    typeof resolution.fileUrl === 'string' &&
    resolution.fileUrl.length > 0 &&
    typeof resolution.fileSize === 'number' &&
    resolution.fileSize > 0
  );
}

/**
 * 테마 데이터 유효성 검증
 */
export function validateTheme(theme: any): theme is Theme {
  return (
    typeof theme === 'object' &&
    typeof theme.id === 'string' &&
    theme.id.length > 0 &&
    typeof theme.name === 'string' &&
    theme.name.length > 0 &&
    typeof theme.description === 'string' &&
    typeof theme.wallpaperCount === 'number' &&
    theme.wallpaperCount >= 0 &&
    typeof theme.isActive === 'boolean' &&
    typeof theme.sortOrder === 'number'
  );
}

/**
 * 해상도 문자열 파싱 (예: "1920x1080")
 */
export function parseResolution(resolutionStr: string): { width: number; height: number } | null {
  const match = resolutionStr.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  
  if (width <= 0 || height <= 0) return null;
  
  return { width, height };
}

/**
 * 해상도를 문자열로 변환
 */
export function formatResolution(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * 사용자 좋아요 데이터 유효성 검증
 */
export function validateUserLike(userLike: any): userLike is UserLike {
  return (
    typeof userLike === 'object' &&
    typeof userLike.id === 'string' &&
    userLike.id.length > 0 &&
    typeof userLike.userId === 'string' &&
    userLike.userId.length > 0 &&
    typeof userLike.wallpaperId === 'string' &&
    userLike.wallpaperId.length > 0 &&
    userLike.likedAt instanceof Date
  );
}

/**
 * 검색 결과 데이터 유효성 검증
 */
export function validateSearchResult(searchResult: any): searchResult is SearchResult {
  return (
    typeof searchResult === 'object' &&
    Array.isArray(searchResult.wallpapers) &&
    searchResult.wallpapers.every(validateWallpaper) &&
    typeof searchResult.totalCount === 'number' &&
    searchResult.totalCount >= 0 &&
    typeof searchResult.page === 'number' &&
    searchResult.page >= 1 &&
    typeof searchResult.pageSize === 'number' &&
    searchResult.pageSize > 0 &&
    typeof searchResult.hasMore === 'boolean'
  );
}

/**
 * 사용자 ID 유효성 검증 (세션 기반)
 */
export function validateUserId(userId: string): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100;
}

/**
 * 검색어 유효성 검증
 */
export function validateSearchQuery(query: string): boolean {
  return typeof query === 'string' && query.trim().length > 0 && query.length <= 200;
}

/**
 * 페이지네이션 파라미터 유효성 검증
 */
export function validatePaginationParams(page: number, pageSize: number): boolean {
  return (
    typeof page === 'number' &&
    page >= 1 &&
    typeof pageSize === 'number' &&
    pageSize > 0 &&
    pageSize <= 100
  );
}

/**
 * 테마 ID 유효성 검증
 */
export function validateThemeId(themeId: string): boolean {
  return typeof themeId === 'string' && themeId.length > 0 && themeId.length <= 50;
}

/**
 * 배경화면 ID 유효성 검증
 */
export function validateWallpaperId(wallpaperId: string): boolean {
  return typeof wallpaperId === 'string' && wallpaperId.length > 0 && wallpaperId.length <= 50;
}