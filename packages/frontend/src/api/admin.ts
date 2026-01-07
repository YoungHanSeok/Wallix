/**
 * 관리자 API 함수들
 * JWT 기반 인증을 사용합니다.
 */

import axios from 'axios'
import type { Wallpaper, ApiResponse } from '@wallix/shared'

// 관리자 서버 클라이언트
const adminClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  withCredentials: true
})

// 요청 인터셉터 - 보안 헤더 추가
adminClient.interceptors.request.use(
  (config) => {
    // CSRF 방지를 위한 커스텀 헤더
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 강화
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패 시 로컬 스토리지 정리
      localStorage.removeItem('adminToken');
      // 로그인 페이지로 리다이렉트 (실제 구현에서는 라우터 사용)
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 관리자 로그인
 */
export async function adminLogin(
  username: string, 
  password: string
): Promise<ApiResponse<{ token: string; user: any }>> {
  // 입력 검증
  if (!username || !password) {
    throw new Error('사용자명과 비밀번호를 입력해주세요');
  }
  
  if (username.length > 50 || password.length > 100) {
    throw new Error('입력값이 너무 깁니다');
  }
  
  const response = await adminClient.post('/admin/login', {
    username: username.trim(),
    password
  });
  
  // 토큰을 안전하게 저장 (실제로는 httpOnly 쿠키 권장)
  if (response.data.success && response.data.data.token) {
    localStorage.setItem('adminToken', response.data.data.token);
  }
  
  return response.data;
}

/**
 * 관리자 로그아웃
 */
export async function adminLogout(): Promise<void> {
  localStorage.removeItem('adminToken');
  // 서버 측 토큰 무효화 (실제 구현에서는 블랙리스트 등 사용)
}

/**
 * 저장된 토큰 가져오기
 */
function getStoredToken(): string | null {
  return localStorage.getItem('adminToken');
}

/**
 * 관리자 상태 확인
 */
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; user?: any }> {
  const token = getStoredToken();
  
  if (!token) {
    return { isAdmin: false };
  }
  
  try {
    const response = await adminClient.get('/admin/status', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    // 토큰이 유효하지 않으면 제거
    localStorage.removeItem('adminToken');
    return { isAdmin: false };
  }
}

/**
 * 배경화면 업로드 (관리자 전용)
 */
export async function uploadWallpaper(
  formData: FormData
): Promise<ApiResponse<Wallpaper>> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('관리자 인증이 필요합니다');
  }
  
  // FormData 크기 검증 (대략적)
  let totalSize = 0;
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      totalSize += value.size;
    }
  }
  
  const maxSize = 15 * 1024 * 1024; // 15MB
  if (totalSize > maxSize) {
    throw new Error('파일 크기가 너무 큽니다 (최대 15MB)');
  }
  
  const response = await adminClient.post('/admin/wallpapers', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 업로드는 더 긴 타임아웃
  });
  
  return response.data;
}

/**
 * 배경화면 수정 (관리자 전용)
 */
export async function updateWallpaper(
  wallpaperId: string,
  formData: FormData
): Promise<ApiResponse<Wallpaper>> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('관리자 인증이 필요합니다');
  }
  
  if (!wallpaperId || wallpaperId.length > 50) {
    throw new Error('유효하지 않은 배경화면 ID입니다');
  }
  
  const response = await adminClient.put(`/admin/wallpapers/${encodeURIComponent(wallpaperId)}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000
  });
  
  return response.data;
}

/**
 * 배경화면 삭제 (관리자 전용)
 */
export async function deleteWallpaper(
  wallpaperId: string
): Promise<ApiResponse<void>> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('관리자 인증이 필요합니다');
  }
  
  if (!wallpaperId || wallpaperId.length > 50) {
    throw new Error('유효하지 않은 배경화면 ID입니다');
  }
  
  const response = await adminClient.delete(`/admin/wallpapers/${encodeURIComponent(wallpaperId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
}