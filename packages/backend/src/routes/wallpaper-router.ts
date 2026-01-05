/**
 * 배경화면 라우터
 * 배경화면 관련 API 엔드포인트를 제공합니다.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { WallpaperService } from '../services/wallpaper-service';
import { ApiResponse, SearchParams } from '@wallix/shared';
import { createValidationError, createNotFoundError } from '../middleware/error-handler';

const router = Router();
const wallpaperService = new WallpaperService();

/**
 * GET /api/wallpapers - 모든 배경화면 조회
 * 요구사항 1.2, 1.3: 배경화면 목록 표시 및 기본 정보 제공
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallpapers = await wallpaperService.getAllWallpapers();
    
    const response: ApiResponse = {
      success: true,
      data: wallpapers
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallpapers/search - 배경화면 검색
 * 요구사항 4.2: 검색어를 입력하면 실시간으로 관련 배경화면을 필터링하여 표시한다
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, page = '1', pageSize = '20' } = req.query;
    
    if (!query || typeof query !== 'string') {
      throw createValidationError('검색어가 필요합니다');
    }
    
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError('유효한 페이지 번호가 필요합니다');
    }
    
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw createValidationError('페이지 크기는 1-100 사이여야 합니다');
    }
    
    // 검색어가 너무 짧거나 유효하지 않은 경우 빈 결과 반환
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      const emptyResult = {
        wallpapers: [],
        totalCount: 0,
        currentPage: pageNum,
        totalPages: 0,
        pageSize: pageSizeNum
      };
      
      const response: ApiResponse = {
        success: true,
        data: emptyResult
      };
      
      res.json(response);
      return;
    }
    
    const searchResult = await wallpaperService.searchWallpapers(
      trimmedQuery,
      pageNum,
      pageSizeNum
    );
    
    const response: ApiResponse = {
      success: true,
      data: searchResult
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallpapers/theme/:theme - 테마별 배경화면 조회
 * 요구사항 1.2: 특정 테마를 선택하면 해당 테마에 속하는 배경화면들을 표시한다
 */
router.get('/theme/:theme', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { theme } = req.params;
    
    if (!theme) {
      throw createValidationError('테마 ID가 필요합니다');
    }
    
    const wallpapers = await wallpaperService.getWallpapersByTheme(theme);
    
    const response: ApiResponse = {
      success: true,
      data: wallpapers
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallpapers/:id - 특정 배경화면 조회
 * 요구사항 1.3: 배경화면 상세 정보 제공
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw createValidationError('배경화면 ID가 필요합니다');
    }
    
    const wallpaper = await wallpaperService.getWallpaperById(id);
    
    if (!wallpaper) {
      throw createNotFoundError('요청한 배경화면을 찾을 수 없습니다');
    }
    
    const response: ApiResponse = {
      success: true,
      data: wallpaper
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;