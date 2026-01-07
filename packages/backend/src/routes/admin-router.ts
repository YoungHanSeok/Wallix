/**
 * 관리자 라우터
 * 관리자 전용 기능을 제공합니다.
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// 간단한 오류 생성 함수들
function createValidationError(message: string): Error {
  const error = new Error(message) as any;
  error.status = 400;
  error.errorCode = 'VALIDATION_ERROR';
  return error;
}

function createUnauthorizedError(message: string): Error {
  const error = new Error(message) as any;
  error.status = 401;
  error.errorCode = 'UNAUTHORIZED';
  return error;
}

const router = Router();

// 관리자 인증 미들웨어
function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createUnauthorizedError('인증 헤더가 필요합니다');
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    
    if (!adminSecretKey) {
      console.error('ADMIN_SECRET_KEY 환경변수가 설정되지 않았습니다');
      throw createUnauthorizedError('서버 설정 오류');
    }
    
    if (token !== adminSecretKey) {
      throw createUnauthorizedError('유효하지 않은 관리자 키입니다');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, WebP만 허용됩니다.'));
    }
  }
});

/**
 * GET /api/admin/status - 관리자 상태 확인
 */
router.get('/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    
    if (!authHeader || !adminSecretKey) {
      res.json({ isAdmin: false });
      return;
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    const isAdmin = token === adminSecretKey;
    
    res.json({ isAdmin });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/wallpapers - 배경화면 업로드 (관리자 전용)
 */
router.post('/wallpapers', adminAuth, upload.single('wallpaper'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw createValidationError('배경화면 파일이 필요합니다');
    }

    const { title, description, tags, theme, resolutions } = req.body;

    if (!title) {
      throw createValidationError('배경화면 제목이 필요합니다');
    }

    // 해상도 파싱
    let targetResolution: {width: number, height: number} | null = null;
    if (resolutions) {
      try {
        const parsedResolutions = JSON.parse(resolutions);
        if (Array.isArray(parsedResolutions) && parsedResolutions.length > 0) {
          const res = parsedResolutions[0]; // 첫 번째 해상도만 사용
          if (res.width && res.height && 
              res.width > 0 && res.height > 0 &&
              res.width <= 7680 && res.height <= 4320) { // 8K 제한
            targetResolution = { width: res.width, height: res.height };
          }
        }
      } catch (error) {
        console.error('해상도 파싱 오류:', error);
      }
    }

    // 기본 해상도 설정 (선택하지 않은 경우)
    if (!targetResolution) {
      targetResolution = { width: 1920, height: 1080 };
    }

    // 태그 파싱
    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    // 기존 배경화면 데이터 로드
    const wallpapersPath = path.join(__dirname, '../data/wallpapers.json');
    let wallpapers = [];
    
    if (fs.existsSync(wallpapersPath)) {
      const data = fs.readFileSync(wallpapersPath, 'utf8');
      wallpapers = JSON.parse(data);
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const wallpaperId = uuidv4();
    const originalFilename = req.file.filename;
    const fileExtension = path.extname(originalFilename);
    const baseFilename = path.basename(originalFilename, fileExtension);

    // 선택된 해상도로 이미지 생성
    const resizedFilename = `${baseFilename}_${targetResolution.width}x${targetResolution.height}${fileExtension}`;
    const resizedFilePath = path.join(__dirname, '../../uploads', resizedFilename);
    
    let resolutionData;
    
    try {
      // Sharp를 사용하여 이미지 리사이징
      const resizedBuffer = await sharp(req.file.path)
        .resize(targetResolution.width, targetResolution.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      // 리사이징된 이미지 저장
      fs.writeFileSync(resizedFilePath, resizedBuffer);
      
      resolutionData = {
        width: targetResolution.width,
        height: targetResolution.height,
        fileUrl: `${baseUrl}/uploads/${resizedFilename}`,
        fileSize: resizedBuffer.length
      };
    } catch (error) {
      console.error(`해상도 ${targetResolution.width}x${targetResolution.height} 생성 실패:`, error);
      throw new Error('이미지 리사이징 중 오류가 발생했습니다');
    }

    // 원본 파일 삭제 (리사이징된 파일만 유지)
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 새 배경화면 데이터 생성
    const newWallpaper = {
      id: wallpaperId,
      title: title.trim(),
      description: description?.trim() || '',
      themeId: theme || 'general',
      tags: parsedTags,
      resolutions: [resolutionData], // 단일 해상도 배열
      thumbnailUrl: resolutionData.fileUrl,
      originalUrl: resolutionData.fileUrl,
      likeCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 배경화면 추가 및 저장
    wallpapers.push(newWallpaper);
    fs.writeFileSync(wallpapersPath, JSON.stringify(wallpapers, null, 2));

    res.status(201).json({
      success: true,
      data: newWallpaper,
      message: '배경화면이 성공적으로 업로드되었습니다'
    });
  } catch (error) {
    // 업로드 실패 시 파일 삭제
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error('임시 파일 삭제 실패:', deleteError);
      }
    }
    next(error);
  }
});

/**
 * PUT /api/admin/wallpapers/:id - 배경화면 수정 (관리자 전용)
 */
router.put('/wallpapers/:id', adminAuth, upload.single('wallpaper'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, tags, theme, resolutions } = req.body;

    if (!id) {
      throw createValidationError('배경화면 ID가 필요합니다');
    }

    if (!title) {
      throw createValidationError('배경화면 제목이 필요합니다');
    }

    // 기존 배경화면 데이터 로드
    const wallpapersPath = path.join(__dirname, '../data/wallpapers.json');
    
    if (!fs.existsSync(wallpapersPath)) {
      throw createValidationError('배경화면 데이터를 찾을 수 없습니다');
    }

    const data = fs.readFileSync(wallpapersPath, 'utf8');
    const wallpapers = JSON.parse(data);
    
    // 수정할 배경화면 찾기
    const wallpaperIndex = wallpapers.findIndex((wp: any) => wp.id === id);
    
    if (wallpaperIndex === -1) {
      throw createValidationError('요청한 배경화면을 찾을 수 없습니다');
    }

    const existingWallpaper = wallpapers[wallpaperIndex];

    // 태그 파싱
    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    let updatedResolutions = existingWallpaper.resolutions;
    let thumbnailUrl = existingWallpaper.thumbnailUrl;
    let originalUrl = existingWallpaper.originalUrl;

    // 새 이미지가 업로드된 경우
    if (req.file) {
      // 해상도 파싱
      let targetResolution: {width: number, height: number} | null = null;
      if (resolutions) {
        try {
          const parsedResolutions = JSON.parse(resolutions);
          if (Array.isArray(parsedResolutions) && parsedResolutions.length > 0) {
            const res = parsedResolutions[0];
            if (res.width && res.height && 
                res.width > 0 && res.height > 0 &&
                res.width <= 7680 && res.height <= 4320) {
              targetResolution = { width: res.width, height: res.height };
            }
          }
        } catch (error) {
          console.error('해상도 파싱 오류:', error);
        }
      }

      // 기본 해상도 설정
      if (!targetResolution) {
        targetResolution = { width: 1920, height: 1080 };
      }

      // 기존 이미지 파일들 삭제
      try {
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        for (const resolution of existingWallpaper.resolutions) {
          const filename = path.basename(resolution.fileUrl);
          const filePath = path.join(uploadsDir, filename);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (error) {
        console.error('기존 파일 삭제 중 오류 발생:', error);
      }

      // 새 이미지 생성
      const originalFilename = req.file.filename;
      const fileExtension = path.extname(originalFilename);
      const baseFilename = path.basename(originalFilename, fileExtension);

      const resizedFilename = `${baseFilename}_${targetResolution.width}x${targetResolution.height}${fileExtension}`;
      const resizedFilePath = path.join(__dirname, '../../uploads', resizedFilename);
      
      try {
        const resizedBuffer = await sharp(req.file.path)
          .resize(targetResolution.width, targetResolution.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toBuffer();
        
        fs.writeFileSync(resizedFilePath, resizedBuffer);
        
        updatedResolutions = [{
          width: targetResolution.width,
          height: targetResolution.height,
          fileUrl: `${baseUrl}/uploads/${resizedFilename}`,
          fileSize: resizedBuffer.length
        }];

        thumbnailUrl = `${baseUrl}/uploads/${resizedFilename}`;
        originalUrl = `${baseUrl}/uploads/${resizedFilename}`;
      } catch (error) {
        console.error(`해상도 ${targetResolution.width}x${targetResolution.height} 생성 실패:`, error);
        throw new Error('이미지 리사이징 중 오류가 발생했습니다');
      }

      // 원본 파일 삭제
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    // 배경화면 데이터 업데이트
    const updatedWallpaper = {
      ...existingWallpaper,
      title: title.trim(),
      description: description?.trim() || '',
      themeId: theme || existingWallpaper.themeId,
      tags: parsedTags,
      resolutions: updatedResolutions,
      thumbnailUrl,
      originalUrl,
      updatedAt: new Date().toISOString()
    };

    wallpapers[wallpaperIndex] = updatedWallpaper;
    
    // 파일에 저장
    fs.writeFileSync(wallpapersPath, JSON.stringify(wallpapers, null, 2));

    res.json({
      success: true,
      data: updatedWallpaper,
      message: '배경화면이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    // 업로드 실패 시 파일 삭제
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error('임시 파일 삭제 실패:', deleteError);
      }
    }
    next(error);
  }
});

/**
 * DELETE /api/admin/wallpapers/:id - 배경화면 삭제 (관리자 전용)
 */
router.delete('/wallpapers/:id', adminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createValidationError('배경화면 ID가 필요합니다');
    }

    // 기존 배경화면 데이터 로드
    const wallpapersPath = path.join(__dirname, '../data/wallpapers.json');
    
    if (!fs.existsSync(wallpapersPath)) {
      throw createValidationError('배경화면 데이터를 찾을 수 없습니다');
    }

    const data = fs.readFileSync(wallpapersPath, 'utf8');
    const wallpapers = JSON.parse(data);
    
    // 삭제할 배경화면 찾기
    const wallpaperIndex = wallpapers.findIndex((wp: any) => wp.id === id);
    
    if (wallpaperIndex === -1) {
      throw createValidationError('요청한 배경화면을 찾을 수 없습니다');
    }

    const wallpaper = wallpapers[wallpaperIndex];

    // 파일 시스템에서 이미지 파일 삭제
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      for (const resolution of wallpaper.resolutions) {
        const filename = path.basename(resolution.fileUrl);
        const filePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('파일 삭제 중 오류 발생:', error);
    }

    // 배경화면 목록에서 제거
    wallpapers.splice(wallpaperIndex, 1);
    
    // 파일에 저장
    fs.writeFileSync(wallpapersPath, JSON.stringify(wallpapers, null, 2));

    res.json({
      success: true,
      message: '배경화면이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    next(error);
  }
});

export default router;