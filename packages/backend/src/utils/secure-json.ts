/**
 * 보안이 강화된 JSON 처리 유틸리티
 * JSON 인젝션 및 메모리 소모 공격 방지
 */

/**
 * 안전한 JSON 파싱
 * 크기 제한 및 깊이 제한을 통한 보안 강화
 */
export function safeJsonParse<T = any>(
  jsonString: string,
  options: {
    maxSize?: number;
    maxDepth?: number;
    allowedKeys?: string[];
  } = {}
): T {
  const {
    maxSize = 1024 * 1024, // 1MB 기본 제한
    maxDepth = 10,
    allowedKeys
  } = options;

  // 크기 검증
  if (jsonString.length > maxSize) {
    throw new Error(`JSON 크기가 제한을 초과했습니다 (최대: ${maxSize}바이트)`);
  }

  // 기본 JSON 파싱
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('유효하지 않은 JSON 형식입니다');
  }

  // 깊이 검증
  function checkDepth(obj: any, currentDepth = 0): void {
    if (currentDepth > maxDepth) {
      throw new Error(`JSON 깊이가 제한을 초과했습니다 (최대: ${maxDepth})`);
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach(item => checkDepth(item, currentDepth + 1));
      } else {
        Object.values(obj).forEach(value => checkDepth(value, currentDepth + 1));
      }
    }
  }

  checkDepth(parsed);

  // 허용된 키만 포함하는지 검증 (선택사항)
  if (allowedKeys && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    const invalidKeys = keys.filter(key => !allowedKeys.includes(key));
    
    if (invalidKeys.length > 0) {
      throw new Error(`허용되지 않은 키가 포함되어 있습니다: ${invalidKeys.join(', ')}`);
    }
  }

  return parsed as T;
}

/**
 * 안전한 JSON 문자열화
 * 순환 참조 및 함수 제거
 */
export function safeJsonStringify(
  obj: any,
  options: {
    maxSize?: number;
    space?: number;
  } = {}
): string {
  const { maxSize = 1024 * 1024, space = 2 } = options;

  // 순환 참조 감지를 위한 WeakSet
  const seen = new WeakSet();

  const result = JSON.stringify(obj, (key, value) => {
    // 함수 제거
    if (typeof value === 'function') {
      return undefined;
    }

    // 순환 참조 감지
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }

    return value;
  }, space);

  // 크기 검증
  if (result.length > maxSize) {
    throw new Error(`JSON 문자열 크기가 제한을 초과했습니다 (최대: ${maxSize}바이트)`);
  }

  return result;
}

/**
 * 배경화면 데이터 검증을 위한 스키마
 */
export const WALLPAPER_SCHEMA = {
  allowedKeys: [
    'id', 'title', 'description', 'themeId', 'tags', 
    'resolutions', 'thumbnailUrl', 'originalUrl', 
    'likeCount', 'downloadCount', 'createdAt', 'updatedAt'
  ],
  maxSize: 50 * 1024, // 50KB
  maxDepth: 5
};

/**
 * 테마 데이터 검증을 위한 스키마
 */
export const THEME_SCHEMA = {
  allowedKeys: ['id', 'name', 'description', 'color', 'createdAt'],
  maxSize: 10 * 1024, // 10KB
  maxDepth: 3
};