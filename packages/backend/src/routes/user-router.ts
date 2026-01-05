/**
 * 사용자 라우터
 * 사용자 좋아요 관련 API 엔드포인트를 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { UserPreferenceService } from '../services/user-preference-service';
import { ApiResponse } from '@wallix/shared';

const router = Router();
const userPreferenceService = new UserPreferenceService();

/**
 * GET /api/users/:userId/likes - 사용자 좋아요 목록 조회
 * 요구사항 3.5: 사용자가 좋아요 목록을 요청하면 사용자가 좋아요를 표시한 모든 배경화면을 표시한다
 * 요구사항 6.3: API 요청이 발생할 때 프론트엔드와 백엔드 간의 통신을 원활하게 처리한다
 */
router.get('/:userId/likes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    const userLikes = await userPreferenceService.getUserLikes(userId);
    
    const response: ApiResponse = {
      success: true,
      data: userLikes
    };
    
    res.json(response);
  } catch (error) {
    console.error('사용자 좋아요 목록 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요 목록을 불러오는 중 오류가 발생했습니다',
      errorCode: 'USER_LIKES_LIST_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/users/:userId/liked-wallpapers - 사용자가 좋아요한 배경화면 목록 조회
 */
router.get('/:userId/liked-wallpapers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    const likedWallpapers = await userPreferenceService.getUserLikedWallpapers(userId);
    
    const response: ApiResponse = {
      success: true,
      data: likedWallpapers
    };
    
    res.json(response);
  } catch (error) {
    console.error('사용자 좋아요 배경화면 목록 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요한 배경화면 목록을 불러오는 중 오류가 발생했습니다',
      errorCode: 'USER_LIKED_WALLPAPERS_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/users/:userId/likes - 좋아요 추가
 * 요구사항 3.2: 좋아요 버튼을 클릭하면 해당 배경화면을 사용자의 좋아요 목록에 추가한다
 * 요구사항 6.3: API 요청이 발생할 때 프론트엔드와 백엔드 간의 통신을 원활하게 처리한다
 */
router.post('/:userId/likes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { wallpaperId } = req.body;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!wallpaperId) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    const userLike = await userPreferenceService.addLike(userId, wallpaperId);
    
    if (!userLike) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면을 찾을 수 없거나 좋아요 추가에 실패했습니다',
        errorCode: 'LIKE_ADD_FAILED'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: { liked: true, userLike }
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('좋아요 추가 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요 추가 중 오류가 발생했습니다',
      errorCode: 'LIKE_ADD_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/users/:userId/likes/:wallpaperId - 좋아요 제거
 * 요구사항 3.3: 이미 좋아요를 표시한 배경화면을 다시 클릭하면 좋아요를 취소하고 목록에서 제거한다
 * 요구사항 6.3: API 요청이 발생할 때 프론트엔드와 백엔드 간의 통신을 원활하게 처리한다
 */
router.delete('/:userId/likes/:wallpaperId', async (req: Request, res: Response) => {
  try {
    const { userId, wallpaperId } = req.params;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!wallpaperId) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    const removed = await userPreferenceService.removeLike(userId, wallpaperId);
    
    if (!removed) {
      const response: ApiResponse = {
        success: false,
        message: '좋아요를 찾을 수 없거나 제거에 실패했습니다',
        errorCode: 'LIKE_REMOVE_FAILED'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: { liked: false }
    };
    
    res.json(response);
  } catch (error) {
    console.error('좋아요 제거 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요 제거 중 오류가 발생했습니다',
      errorCode: 'LIKE_REMOVE_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/users/:userId/likes/toggle - 좋아요 토글 (추가/제거)
 */
router.post('/:userId/likes/toggle', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { wallpaperId } = req.body;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!wallpaperId) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    const result = await userPreferenceService.toggleLike(userId, wallpaperId);
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요 토글 중 오류가 발생했습니다',
      errorCode: 'LIKE_TOGGLE_ERROR'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/users/:userId/likes/:wallpaperId/status - 좋아요 상태 확인
 */
router.get('/:userId/likes/:wallpaperId/status', async (req: Request, res: Response) => {
  try {
    const { userId, wallpaperId } = req.params;
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '사용자 ID가 필요합니다',
        errorCode: 'MISSING_USER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!wallpaperId) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    const isLiked = await userPreferenceService.isLiked(userId, wallpaperId);
    
    const response: ApiResponse = {
      success: true,
      data: { liked: isLiked }
    };
    
    res.json(response);
  } catch (error) {
    console.error('좋아요 상태 확인 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '좋아요 상태 확인 중 오류가 발생했습니다',
      errorCode: 'LIKE_STATUS_ERROR'
    };
    
    res.status(500).json(response);
  }
});

export default router;