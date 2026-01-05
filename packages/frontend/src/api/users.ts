/**
 * 사용자 API 서비스
 */

import { apiClient } from './client'
import type { Wallpaper } from '@wallix/shared'

export const userApi = {
  /**
   * 사용자 좋아요 목록 조회
   */
  getLikes: async (userId: string): Promise<Wallpaper[]> => {
    const response = await apiClient.get<Wallpaper[]>(`/users/${userId}/likes`)
    return response.data
  },

  /**
   * 좋아요 추가
   */
  addLike: async (userId: string, wallpaperId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/likes`, { wallpaperId })
  },

  /**
   * 좋아요 제거
   */
  removeLike: async (userId: string, wallpaperId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/likes/${wallpaperId}`)
  }
}