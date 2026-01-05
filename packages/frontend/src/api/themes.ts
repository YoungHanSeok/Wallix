/**
 * 테마 API 서비스
 */

import { apiClient } from './client'
import type { Theme } from '@wallix/shared'

export const themeApi = {
  /**
   * 모든 테마 조회
   */
  getAll: async (): Promise<Theme[]> => {
    const response = await apiClient.get<{ success: boolean; data: Theme[] }>('/themes')
    return response.data.data
  },

  /**
   * 특정 테마 조회
   */
  getById: async (id: string): Promise<Theme> => {
    const response = await apiClient.get<{ success: boolean; data: Theme }>(`/themes/${id}`)
    return response.data.data
  }
}