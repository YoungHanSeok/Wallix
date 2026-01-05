/**
 * 애플리케이션 전역 상태 관리
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { Wallpaper, Theme } from '@wallix/shared'

// 상태 타입 정의
interface AppState {
  // 배경화면 관련 상태
  wallpapers: Wallpaper[]
  selectedWallpaper: Wallpaper | null
  
  // 테마 관련 상태
  themes: Theme[]
  selectedTheme: Theme | null
  
  // 사용자 관련 상태
  userId: string
  likedWallpapers: string[] // 좋아요한 배경화면 ID 목록
  
  // 관리자 관련 상태
  isAdmin: boolean
  adminKey: string | null
  
  // UI 상태
  isLoading: boolean
  error: string | null
  searchQuery: string
}

// 액션 타입 정의
type AppAction =
  | { type: 'SET_WALLPAPERS'; payload: Wallpaper[] }
  | { type: 'SET_SELECTED_WALLPAPER'; payload: Wallpaper | null }
  | { type: 'SET_THEMES'; payload: Theme[] }
  | { type: 'SET_SELECTED_THEME'; payload: Theme | null }
  | { type: 'SET_USER_ID'; payload: string }
  | { type: 'SET_LIKED_WALLPAPERS'; payload: string[] }
  | { type: 'ADD_LIKE'; payload: string }
  | { type: 'REMOVE_LIKE'; payload: string }
  | { type: 'SET_ADMIN_STATUS'; payload: boolean }
  | { type: 'SET_ADMIN_KEY'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }

// 초기 상태
const initialState: AppState = {
  wallpapers: [],
  selectedWallpaper: null,
  themes: [],
  selectedTheme: null,
  userId: 'default-user', // 실제 구현에서는 세션 기반으로 생성
  likedWallpapers: [],
  isAdmin: false,
  adminKey: localStorage.getItem('adminKey') || null,
  isLoading: false,
  error: null,
  searchQuery: ''
}

// 리듀서 함수
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WALLPAPERS':
      return { ...state, wallpapers: action.payload }
    
    case 'SET_SELECTED_WALLPAPER':
      return { ...state, selectedWallpaper: action.payload }
    
    case 'SET_THEMES':
      return { ...state, themes: action.payload }
    
    case 'SET_SELECTED_THEME':
      return { ...state, selectedTheme: action.payload }
    
    case 'SET_USER_ID':
      return { ...state, userId: action.payload }
    
    case 'SET_LIKED_WALLPAPERS':
      return { ...state, likedWallpapers: action.payload }
    
    case 'ADD_LIKE':
      return {
        ...state,
        likedWallpapers: [...state.likedWallpapers, action.payload]
      }
    
    case 'REMOVE_LIKE':
      return {
        ...state,
        likedWallpapers: state.likedWallpapers.filter(id => id !== action.payload)
      }
    
    case 'SET_ADMIN_STATUS':
      return { ...state, isAdmin: action.payload }
    
    case 'SET_ADMIN_KEY':
      // 로컬 스토리지에도 저장
      if (action.payload) {
        localStorage.setItem('adminKey', action.payload)
      } else {
        localStorage.removeItem('adminKey')
      }
      return { ...state, adminKey: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    
    default:
      return state
  }
}

// Context 생성
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider 컴포넌트
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Context 사용을 위한 커스텀 훅
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext는 AppProvider 내부에서 사용되어야 합니다')
  }
  return context
}