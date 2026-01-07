/**
 * 관리자 API 함수들
 */

import axios from 'axios'
import type { Wallpaper, ApiResponse } from '@wallix/shared'

// 관리자 서버 클라이언트
const adminClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
})

/**
 * 관리자 상태 확인
 */
export async function checkAdminStatus(adminKey: string): Promise<{ isAdmin: boolean }> {
  const response = await adminClient.get('/admin/status', {
    headers: {
      Authorization: `Bearer ${adminKey}`
    }
  })
  return response.data
}

/**
 * 배경화면 업로드 (관리자 전용)
 */
export async function uploadWallpaper(
  adminKey: string,
  formData: FormData
): Promise<ApiResponse<Wallpaper>> {
  const response = await adminClient.post('/admin/wallpapers', formData, {
    headers: {
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

/**
 * 배경화면 수정 (관리자 전용)
 */
export async function updateWallpaper(
  adminKey: string,
  wallpaperId: string,
  formData: FormData
): Promise<ApiResponse<Wallpaper>> {
  const response = await adminClient.put(`/admin/wallpapers/${wallpaperId}`, formData, {
    headers: {
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

/**
 * 배경화면 삭제 (관리자 전용)
 */
export async function deleteWallpaper(
  adminKey: string,
  wallpaperId: string
): Promise<ApiResponse<void>> {
  const response = await adminClient.delete(`/admin/wallpapers/${wallpaperId}`, {
    headers: {
      Authorization: `Bearer ${adminKey}`
    }
  })
  return response.data
}