/**
 * 환경변수 검증 유틸리티
 * 프로덕션 환경에서 보안 설정 강제
 */

interface EnvConfig {
  JWT_SECRET: string;
  ADMIN_PASSWORD_HASH: string;
  ADMIN_USERNAME: string;
  NODE_ENV: string;
  ALLOWED_ORIGINS?: string;
  PORT?: string;
  BASE_URL?: string;
}

/**
 * 필수 환경변수 검증
 */
export function validateEnvironment(): EnvConfig {
  const requiredVars = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'ADMIN_USERNAME'];
  const missing: string[] = [];

  // 필수 환경변수 확인
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`필수 환경변수가 설정되지 않았습니다: ${missing.join(', ')}`);
  }

  const config: EnvConfig = {
    JWT_SECRET: process.env.JWT_SECRET!,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH!,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME!,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    PORT: process.env.PORT,
    BASE_URL: process.env.BASE_URL
  };

  // 프로덕션 환경 보안 검증
  if (config.NODE_ENV === 'production') {
    validateProductionSecurity(config);
  }

  return config;
}

/**
 * 프로덕션 환경 보안 설정 검증
 */
function validateProductionSecurity(config: EnvConfig): void {
  const errors: string[] = [];

  // JWT 시크릿 강도 검증
  if (config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET은 최소 32자 이상이어야 합니다');
  }

  if (config.JWT_SECRET.includes('your-') || config.JWT_SECRET.includes('change-')) {
    errors.push('JWT_SECRET에 기본값이 포함되어 있습니다. 프로덕션용 시크릿으로 변경하세요');
  }

  // 관리자 계정 보안 검증
  if (config.ADMIN_USERNAME === 'admin') {
    errors.push('기본 관리자 사용자명(admin)을 사용하고 있습니다. 보안을 위해 변경하세요');
  }

  // 기본 비밀번호 해시 검증 (admin123의 해시)
  const defaultPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJguGdRGG';
  if (config.ADMIN_PASSWORD_HASH === defaultPasswordHash) {
    errors.push('기본 관리자 비밀번호를 사용하고 있습니다. 강력한 비밀번호로 변경하세요');
  }

  // CORS 설정 검증
  if (!config.ALLOWED_ORIGINS) {
    errors.push('프로덕션 환경에서는 ALLOWED_ORIGINS를 설정해야 합니다');
  } else if (config.ALLOWED_ORIGINS.includes('localhost')) {
    errors.push('프로덕션 환경에서 localhost를 ALLOWED_ORIGINS에 포함하면 안됩니다');
  }

  // HTTPS 검증
  if (config.BASE_URL && !config.BASE_URL.startsWith('https://')) {
    errors.push('프로덕션 환경에서는 HTTPS를 사용해야 합니다');
  }

  if (errors.length > 0) {
    console.error('🚨 프로덕션 보안 설정 오류:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('프로덕션 보안 설정이 올바르지 않습니다');
  }
}

/**
 * 개발 환경 보안 경고
 */
export function showDevelopmentWarnings(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const warnings: string[] = [];

  // 기본값 사용 경고
  if (process.env.JWT_SECRET?.includes('your-')) {
    warnings.push('개발용 JWT_SECRET을 사용 중입니다');
  }

  if (process.env.ADMIN_USERNAME === 'admin') {
    warnings.push('기본 관리자 계정(admin)을 사용 중입니다');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  개발 환경 보안 경고:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('  프로덕션 배포 전에 보안 설정을 변경하세요\n');
  }
}

/**
 * 환경변수 마스킹 (로깅용)
 */
export function maskSensitiveEnvVars(config: EnvConfig): Record<string, string> {
  return {
    ...config,
    JWT_SECRET: maskString(config.JWT_SECRET),
    ADMIN_PASSWORD_HASH: maskString(config.ADMIN_PASSWORD_HASH)
  };
}

/**
 * 문자열 마스킹 헬퍼
 */
function maskString(str: string): string {
  if (str.length <= 8) {
    return '*'.repeat(str.length);
  }
  return str.slice(0, 4) + '*'.repeat(str.length - 8) + str.slice(-4);
}