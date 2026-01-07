/**
 * 입력 검증 및 Sanitization 유틸리티
 * XSS 공격 방지 및 입력 데이터 검증
 */

/**
 * 입력 데이터 sanitization
 * XSS 공격을 방지합니다.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTML 태그 제거 및 특수 문자 이스케이프
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match] || match;
    });
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
 * URL 검증 (간단한 버전)
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 파일명 검증
 * 안전한 파일명인지 확인합니다.
 */
export function validateFileName(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  // 파일명 길이 제한 (최대 255자)
  if (filename.length > 255) {
    return false;
  }
  
  // 위험한 문자 및 패턴 검사
  const dangerousPatterns = [
    /\.\./,           // 경로 조작
    /[<>:"|?*]/,      // Windows 금지 문자
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows 예약어
    /^\./,            // 숨김 파일
    /\s$/,            // 끝에 공백
    /^$/              // 빈 문자열
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(filename));
}