/**
 * 다운로드 라우터
 * 보안이 강화된 배경화면 다운로드 API를 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { WallpaperService } from '../services/wallpaper-service';
import { ApiResponse } from '@wallix/shared';
import { downloadLimiter } from '../middleware/security';
import { sanitizeFilePath, validateFileName } from '../utils/file-security';
import { sanitizeString, validateAndSanitizeSearchQuery } from '../utils/input-validation';
import path from 'path';
import fs from 'fs';

const router = Router();
const wallpaperService = new WallpaperService();

// 다운로드 라우터에 레이트 리미팅 적용
router.use(downloadLimiter);

/**
 * GET /api/download/:id/:resolution - 특정 해상도 이미지 다운로드
 */
router.get('/:id/:resolution', async (req: Request, res: Response) => {
  try {
    const { id, resolution } = req.params;
    
    // 입력 검증 및 sanitization
    if (!id || typeof id !== 'string') {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!resolution || typeof resolution !== 'string') {
      const response: ApiResponse = {
        success: false,
        message: '해상도 정보가 필요합니다',
        errorCode: 'MISSING_RESOLUTION'
      };
      return res.status(400).json(response);
    }
    
    // ID와 해상도 sanitization
    const sanitizedId = sanitizeString(id);
    const sanitizedResolution = sanitizeString(resolution);
    
    // 해상도 파싱 및 검증 (예: "1920x1080")
    const resolutionMatch = sanitizedResolution.match(/^(\d{1,5})x(\d{1,5})$/);
    if (!resolutionMatch) {
      const response: ApiResponse = {
        success: false,
        message: '올바른 해상도 형식이 아닙니다 (예: 1920x1080)',
        errorCode: 'INVALID_RESOLUTION_FORMAT'
      };
      return res.status(400).json(response);
    }
    
    const targetWidth = parseInt(resolutionMatch[1], 10);
    const targetHeight = parseInt(resolutionMatch[2], 10);
    
    // 해상도 범위 검증
    if (targetWidth < 100 || targetWidth > 10000 || targetHeight < 100 || targetHeight > 10000) {
      const response: ApiResponse = {
        success: false,
        message: '지원하지 않는 해상도입니다',
        errorCode: 'UNSUPPORTED_RESOLUTION'
      };
      return res.status(400).json(response);
    }
    
    // 배경화면 조회
    const wallpaper = await wallpaperService.getWallpaperById(sanitizedId);
    if (!wallpaper) {
      const response: ApiResponse = {
        success: false,
        message: '요청한 배경화면을 찾을 수 없습니다',
        errorCode: 'WALLPAPER_NOT_FOUND'
      };
      return res.status(404).json(response);
    }
    
    // 최적 해상도 찾기
    const bestResolution = wallpaperService.findBestResolutionMatch(
      wallpaper.resolutions,
      targetWidth,
      targetHeight
    );
    
    if (!bestResolution) {
      const response: ApiResponse = {
        success: false,
        message: '사용 가능한 해상도가 없습니다',
        errorCode: 'NO_AVAILABLE_RESOLUTION'
      };
      return res.status(404).json(response);
    }
    
    // 안전한 파일명 생성
    const safeTitle = wallpaper.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '_').trim();
    const fileName = `${safeTitle}_${bestResolution.width}x${bestResolution.height}.jpg`;
    
    // 파일명 검증
    if (!validateFileName(fileName)) {
      const response: ApiResponse = {
        success: false,
        message: '유효하지 않은 파일명입니다',
        errorCode: 'INVALID_FILENAME'
      };
      return res.status(400).json(response);
    }
    
    // 안전한 파일 경로 생성
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    let filePath: string;
    
    try {
      filePath = sanitizeFilePath(fileName, uploadsDir);
    } catch (error) {
      console.error('파일 경로 보안 오류:', error);
      const response: ApiResponse = {
        success: false,
        message: '잘못된 파일 경로입니다',
        errorCode: 'INVALID_FILE_PATH'
      };
      return res.status(400).json(response);
    }
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      const response: ApiResponse = {
        success: false,
        message: '요청한 해상도의 파일을 찾을 수 없습니다',
        errorCode: 'FILE_NOT_FOUND'
      };
      return res.status(404).json(response);
    }
    
    // 다운로드 수 증가 (동시성 제어 필요시 추후 개선)
    await wallpaperService.incrementDownloadCount(sanitizedId);
    
    // 파일 정보 조회
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // 파일 크기 검증 (너무 큰 파일 방지)
    const maxDownloadSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxDownloadSize) {
      const response: ApiResponse = {
        success: false,
        message: '파일 크기가 너무 큽니다',
        errorCode: 'FILE_TOO_LARGE'
      };
      return res.status(413).json(response);
    }
    
    // 보안 다운로드 헤더 설정
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    // 진행 상태 추적을 위한 헤더
    res.setHeader('X-File-Size', fileSize.toString());
    res.setHeader('X-Resolution', `${bestResolution.width}x${bestResolution.height}`);
    res.setHeader('X-Wallpaper-Title', encodeURIComponent(wallpaper.title));
    
    // 파일 스트림으로 전송
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('파일 스트림 오류:', error);
      if (!res.headersSent) {
        const response: ApiResponse = {
          success: false,
          message: '파일 전송 중 오류가 발생했습니다',
          errorCode: 'FILE_STREAM_ERROR'
        };
        res.status(500).json(response);
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('다운로드 오류:', error);
    
    if (!res.headersSent) {
      const response: ApiResponse = {
        success: false,
        message: '다운로드 중 오류가 발생했습니다',
        errorCode: 'DOWNLOAD_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * GET /api/download/:id/info - 다운로드 가능한 해상도 정보 조회
 */
router.get('/:id/info', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    const wallpaper = await wallpaperService.getWallpaperById(id);
    if (!wallpaper) {
      const response: ApiResponse = {
        success: false,
        message: '요청한 배경화면을 찾을 수 없습니다',
        errorCode: 'WALLPAPER_NOT_FOUND'
      };
      return res.status(404).json(response);
    }
    
    const downloadInfo = {
      wallpaperId: wallpaper.id,
      title: wallpaper.title,
      availableResolutions: wallpaper.resolutions.map(res => ({
        resolution: `${res.width}x${res.height}`,
        width: res.width,
        height: res.height,
        fileSize: res.fileSize,
        downloadUrl: `/api/download/${id}/${res.width}x${res.height}`
      }))
    };
    
    const response: ApiResponse = {
      success: true,
      data: downloadInfo
    };
    
    res.json(response);
  } catch (error) {
    console.error('다운로드 정보 조회 오류:', error);
    
    const response: ApiResponse = {
      success: false,
      message: '다운로드 정보 조회 중 오류가 발생했습니다',
      errorCode: 'DOWNLOAD_INFO_ERROR'
    };
    
    res.status(500).json(response);
  }
});

export default router;