/**
 * 다운로드 라우터
 * 배경화면 다운로드 관련 API 엔드포인트를 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { WallpaperService } from '../services/wallpaper-service';
import { ApiResponse } from '@wallix/shared';
import path from 'path';
import fs from 'fs';

const router = Router();
const wallpaperService = new WallpaperService();

/**
 * GET /api/download/:id/:resolution - 특정 해상도 이미지 다운로드
 * 요구사항 2.2: 사용자가 특정 해상도를 선택하면 해당 해상도의 이미지 다운로드를 시작한다
 * 요구사항 2.3: 다운로드가 진행될 때 다운로드 진행 상태를 사용자에게 표시한다
 * 요구사항 2.4: 다운로드가 완료되면 사용자의 기본 다운로드 폴더에 파일을 저장한다
 */
router.get('/:id/:resolution', async (req: Request, res: Response) => {
  try {
    const { id, resolution } = req.params;
    
    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: '배경화면 ID가 필요합니다',
        errorCode: 'MISSING_WALLPAPER_ID'
      };
      return res.status(400).json(response);
    }
    
    if (!resolution) {
      const response: ApiResponse = {
        success: false,
        message: '해상도 정보가 필요합니다',
        errorCode: 'MISSING_RESOLUTION'
      };
      return res.status(400).json(response);
    }
    
    // 해상도 파싱 (예: "1920x1080")
    const resolutionMatch = resolution.match(/^(\d+)x(\d+)$/);
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
    
    // 배경화면 조회
    const wallpaper = await wallpaperService.getWallpaperById(id);
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
    
    // 파일 경로 구성 (실제 구현에서는 파일 시스템 구조에 맞게 조정)
    const fileName = `${wallpaper.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${bestResolution.width}x${bestResolution.height}.jpg`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      // 실제 구현에서는 bestResolution.fileUrl에서 파일을 가져오거나
      // 미리 준비된 샘플 이미지를 사용
      const response: ApiResponse = {
        success: false,
        message: '요청한 해상도의 파일을 찾을 수 없습니다',
        errorCode: 'FILE_NOT_FOUND'
      };
      return res.status(404).json(response);
    }
    
    // 다운로드 수 증가
    await wallpaperService.incrementDownloadCount(id);
    
    // 파일 정보 조회
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // 다운로드 헤더 설정
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
    
    // 진행 상태 추적을 위한 헤더 (클라이언트에서 활용 가능)
    res.setHeader('X-File-Size', fileSize.toString());
    res.setHeader('X-Resolution', `${bestResolution.width}x${bestResolution.height}`);
    res.setHeader('X-Wallpaper-Title', wallpaper.title);
    
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