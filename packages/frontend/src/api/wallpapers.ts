/**
 * 배경화면 API 서비스
 */

import { apiClient } from './client'
import type { Wallpaper, SearchResult } from '@wallix/shared'

export const wallpaperApi = {
  /**
   * 모든 배경화면 조회
   */
  getAll: async (): Promise<Wallpaper[]> => {
    const response = await apiClient.get<{ success: boolean; data: Wallpaper[] }>('/wallpapers')
    return response.data.data
  },

  /**
   * 특정 배경화면 조회
   */
  getById: async (id: string): Promise<Wallpaper> => {
    const response = await apiClient.get<{ success: boolean; data: Wallpaper }>(`/wallpapers/${id}`)
    return response.data.data
  },

  /**
   * 테마별 배경화면 조회
   */
  getByTheme: async (themeId: string): Promise<Wallpaper[]> => {
    const response = await apiClient.get<{ success: boolean; data: Wallpaper[] }>(`/wallpapers/theme/${themeId}`)
    return response.data.data
  },

  /**
   * 배경화면 검색
   */
  search: async (query: string, page = 1, pageSize = 20): Promise<SearchResult> => {
    const response = await apiClient.get<{ success: boolean; data: SearchResult }>('/wallpapers/search', {
      params: { query, page, pageSize }
    })
    return response.data.data
  },

  /**
   * 배경화면 다운로드 URL 생성
   */
  getDownloadUrl: (id: string, resolution: string): string => {
    const baseURL = apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:3001'
    return `${baseURL}/uploads/${id}-${resolution}.jpg`
  }
}