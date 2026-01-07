/**
 * 파일 보안 유틸리티
 * 파일 경로 조작 방지 및 파일 타입 검증
 */

import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

/**
 * 안전한 파일 경로 생성
 * 경로 조작(Path Traversal) 공격을 방지합니다.
 */
export function sanitizeFilePath(fileName: string, baseDir: string): string {
  // 파일명에서 위험한 문자 제거
  const sanitized = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
  
  // 절대 경로 생성
  const fullPath = path.resolve(baseDir, sanitized);
  const normalizedBaseDir = path.resolve(baseDir);
  
  // 기본 디렉토리 외부 접근 차단
  if (!fullPath.startsWith(normalizedBaseDir + path.sep) && fullPath !== normalizedBaseDir) {
    throw new Error('잘못된 파일 경로입니다');
  }
  
  return fullPath;
}

/**
 * 파일 타입 검증 (매직 바이트 기반)
 * MIME 타입 조작을 방지합니다.
 */
export async function validateFileType(buffer: Buffer, allowedTypes: string[]): Promise<boolean> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      return false;
    }
    
    return allowedTypes.includes(fileType.mime);
  } catch (error) {
    console.error('파일 타입 검증 오류:', error);
    return false;
  }
}

/**
 * 안전한 파일명 생성
 */
export function generateSafeFileName(originalName: string, extension?: string): string {
  // 파일명에서 확장자 분리
  const ext = extension || path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  // 안전한 파일명 생성 (한글, 영문, 숫자만 허용)
  const safeName = baseName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  
  // 타임스탬프와 랜덤 문자열 추가
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${safeName}_${timestamp}_${random}${ext}`;
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * 디렉토리 존재 확인 및 생성
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
  }
}

/**
 * 허용된 이미지 MIME 타입
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

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
 * 최대 파일 크기 (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;