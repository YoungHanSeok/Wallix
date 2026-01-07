/**
 * 비동기 파일 작업 유틸리티
 * 동기식 파일 작업을 안전한 비동기 작업으로 대체
 */

import fs from 'fs/promises';
import path from 'path';
import { safeJsonParse, safeJsonStringify } from './secure-json';

/**
 * 안전한 JSON 파일 읽기
 */
export async function readJsonFile<T = any>(
  filePath: string,
  schema?: {
    allowedKeys?: string[];
    maxSize?: number;
    maxDepth?: number;
  }
): Promise<T[]> {
  try {
    // 파일 존재 여부 확인
    await fs.access(filePath);
    
    // 파일 읽기
    const data = await fs.readFile(filePath, 'utf8');
    
    // 안전한 JSON 파싱
    return safeJsonParse<T[]>(data, schema);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // 파일이 없으면 빈 배열 반환
      return [];
    }
    throw new Error(`JSON 파일 읽기 실패: ${error.message}`);
  }
}

/**
 * 안전한 JSON 파일 쓰기
 */
export async function writeJsonFile<T = any>(
  filePath: string,
  data: T[],
  options: {
    maxSize?: number;
    space?: number;
    backup?: boolean;
  } = {}
): Promise<void> {
  const { maxSize = 1024 * 1024, space = 2, backup = true } = options;

  try {
    // 디렉토리 생성
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // 백업 생성 (선택사항)
    if (backup) {
      try {
        await fs.access(filePath);
        const backupPath = `${filePath}.backup`;
        await fs.copyFile(filePath, backupPath);
      } catch (error) {
        // 원본 파일이 없으면 백업하지 않음
      }
    }

    // 안전한 JSON 문자열화
    const jsonString = safeJsonStringify(data, { maxSize, space });

    // 임시 파일에 먼저 쓰기 (원자적 쓰기)
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, jsonString, 'utf8');

    // 임시 파일을 원본으로 이동
    await fs.rename(tempPath, filePath);
  } catch (error: any) {
    throw new Error(`JSON 파일 쓰기 실패: ${error.message}`);
  }
}

/**
 * 안전한 파일 삭제
 */
export async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    // 파일 존재 여부 확인
    await fs.access(filePath);
    
    // 파일 삭제
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw new Error(`파일 삭제 실패: ${error.message}`);
    }
    // 파일이 없으면 무시
  }
}

/**
 * 안전한 파일 이동
 */
export async function safeMoveFile(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  try {
    // 대상 디렉토리 생성
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });

    // 파일 이동
    await fs.rename(sourcePath, targetPath);
  } catch (error: any) {
    throw new Error(`파일 이동 실패: ${error.message}`);
  }
}

/**
 * 안전한 이미지 파일 쓰기
 */
export async function writeImageFile(
  filePath: string,
  buffer: Buffer,
  options: {
    maxSize?: number;
    allowedExtensions?: string[];
  } = {}
): Promise<void> {
  const {
    maxSize = 15 * 1024 * 1024, // 15MB
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;

  try {
    // 파일 크기 검증
    if (buffer.length > maxSize) {
      throw new Error(`파일 크기가 제한을 초과했습니다 (최대: ${maxSize}바이트)`);
    }

    // 확장자 검증
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`허용되지 않은 파일 확장자입니다: ${ext}`);
    }

    // 디렉토리 생성
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // 파일 쓰기
    await fs.writeFile(filePath, buffer);
  } catch (error: any) {
    throw new Error(`이미지 파일 쓰기 실패: ${error.message}`);
  }
}

/**
 * 파일 존재 여부 확인
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}