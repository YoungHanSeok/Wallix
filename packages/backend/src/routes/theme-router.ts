/**
 * 테마 라우터
 * 테마 관련 API 엔드포인트를 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { ThemeService } from '../services/theme-service';
import { ApiResponse } from '@wallix/shared';

const router = Router();
const themeService = new ThemeService();

/**
 * GET /api/themes - 모든 테마 조회
 * 요구사항 1.1: 웹사이트에 접속하면 사용 가능한 모든 테마 카테고리를 표시한다
 * 요구사항 6.3: API 요청이 발생할 때 프론트엔드와 백엔드 간의 통신을 원활하게 처리한다
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // 활성화된 테마들만 조회 (일반 사용자용)
    const themes = await themeService.getActiveThemes();
    
    const response: ApiResponse = {
      success: true,
      data: themes
    };
    
    res.json(response);
  } catch (error) {
    console.error('테마 목록 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '테마 목록을 불러오는 중 오류가 발생했습니다',
      errorCode: 'THEME_LIST_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/themes/all - 모든 테마 조회 (관리자용)
 * 활성화되지 않은 테마도 포함
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const themes = await themeService.getAllThemes();
    
    const response: ApiResponse = {
      success: true,
      data: themes
    };
    
    res.json(response);
  } catch (error) {
    console.error('전체 테마 목록 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '전체 테마 목록을 불러오는 중 오류가 발생했습니다',
      errorCode: 'ALL_THEMES_LIST_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/themes/:id - 특정 테마 조회
 * 요구사항 6.3: API 요청이 발생할 때 프론트엔드와 백엔드 간의 통신을 원활하게 처리한다
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: '테마 ID가 필요합니다',
        errorCode: 'MISSING_THEME_ID'
      };
      return res.status(400).json(response);
    }
    
    const theme = await themeService.getThemeById(id);
    
    if (!theme) {
      const response: ApiResponse = {
        success: false,
        message: '요청한 테마를 찾을 수 없습니다',
        errorCode: 'THEME_NOT_FOUND'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: theme
    };
    
    res.json(response);
  } catch (error) {
    console.error('테마 상세 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '테마 정보를 불러오는 중 오류가 발생했습니다',
      errorCode: 'THEME_DETAIL_ERROR'
    };
    
    res.status(500).json(response);
  }
});

export default router;