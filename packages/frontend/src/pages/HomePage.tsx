/**
 * 홈 페이지 컴포넌트
 * 테마 선택기 및 인기 배경화면을 표시하고 검색 기능을 통합
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context'
import { 
  ThemeSelector, 
  SearchBar, 
  WallpaperGrid,
  LoadingSpinner,
  NetworkError
} from '../components/ui'
import { AdminPanel } from '../components/admin'
import { WallpaperEdit } from '../components/admin/WallpaperEdit'
import { SEOHead } from '../components/seo'
import { ResponsiveBannerAd, SquareAd } from '../components/ads'
import '../components/ads/ads.css'
import { useErrorHandler, useScreenSize } from '../hooks'
import { wallpaperApi, themeApi } from '../api'
import type { Wallpaper, Theme } from '@wallix/shared'
import './HomePage.css'

export function HomePage() {
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [filteredWallpapers, setFilteredWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const { error, isRetrying, handleError, clearError, retry } = useErrorHandler()
  const screenSize = useScreenSize()

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null)

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredWallpapers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentWallpapers = filteredWallpapers.slice(startIndex, endIndex)

  // 컴포넌트 마운트 시 상태 초기화 (뒤로가기 대응)
  useEffect(() => {
    // 홈페이지에 진입할 때마다 테마 선택과 검색어 초기화
    dispatch({ type: 'SET_SELECTED_THEME', payload: null })
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
    setCurrentPage(1) // 페이지도 초기화
  }, [dispatch])

  // 필터링된 배경화면이 변경될 때 페이지 초기화
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredWallpapers.length])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      clearError()

      try {
        // 병렬로 배경화면과 테마 데이터 로드
        const [wallpapersData, themesData] = await Promise.all([
          wallpaperApi.getAll(),
          themeApi.getAll()
        ])

        // 인기 배경화면 순으로 정렬 (다운로드 수 + 좋아요 수 기준)
        const sortedWallpapers = wallpapersData.sort((a, b) => {
          const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
          const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
          return scoreB - scoreA
        })

        setWallpapers(sortedWallpapers)
        setFilteredWallpapers(sortedWallpapers)
        
        // 전역 상태 업데이트
        dispatch({ type: 'SET_WALLPAPERS', payload: sortedWallpapers })
        dispatch({ type: 'SET_THEMES', payload: themesData })
        
        // 상태 초기화 확인 (뒤로가기 대응)
        dispatch({ type: 'SET_SELECTED_THEME', payload: null })
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
        
        // 초기 로딩 화면 제거 (있다면)
        const initialLoading = document.getElementById('initial-loading')
        if (initialLoading) {
          initialLoading.style.opacity = '0'
          initialLoading.style.transition = 'opacity 0.3s ease-out'
          setTimeout(() => {
            initialLoading.remove()
          }, 300)
        }
      } catch (err) {
        console.error('초기 데이터 로드 중 오류 발생:', err)
        handleError(err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, []) // dispatch 제거하여 무한 루프 방지

  // 테마 선택 처리
  const handleThemeSelect = useCallback(async (theme: Theme | null) => {
    // 전역 상태 먼저 업데이트
    dispatch({ type: 'SET_SELECTED_THEME', payload: theme })
    setCurrentPage(1) // 페이지 초기화
    
    if (!theme) {
      // 모든 테마 선택 시 전체 배경화면 표시
      setFilteredWallpapers(wallpapers)
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
      return
    }

    setLoading(true)
    clearError()

    try {
      const themeWallpapers = await wallpaperApi.getByTheme(theme.id)
      
      // 인기 순으로 정렬
      const sortedThemeWallpapers = themeWallpapers.sort((a, b) => {
        const scoreA = a.downloadCount + a.likeCount
        const scoreB = b.downloadCount + b.likeCount
        return scoreB - scoreA
      })

      setFilteredWallpapers(sortedThemeWallpapers)
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
    } catch (err) {
      console.error('테마별 배경화면 로드 중 오류 발생:', err)
      handleError(err)
      // 오류 발생 시 테마 선택 해제
      dispatch({ type: 'SET_SELECTED_THEME', payload: null })
    } finally {
      setLoading(false)
    }
  }, [wallpapers, dispatch, clearError, handleError])

  // 검색 처리
  const handleSearch = useCallback(async (query: string) => {
    setCurrentPage(1) // 페이지 초기화
    
    if (!query.trim()) {
      // 검색어가 비어있으면 현재 선택된 테마의 배경화면 또는 전체 배경화면 표시
      if (state.selectedTheme) {
        handleThemeSelect(state.selectedTheme)
      } else {
        setFilteredWallpapers(wallpapers)
      }
      return
    }

    setSearchLoading(true)
    clearError()

    try {
      const searchResult = await wallpaperApi.search(query)
      setFilteredWallpapers(searchResult.wallpapers)
      
      // 검색 시 테마 선택 해제
      dispatch({ type: 'SET_SELECTED_THEME', payload: null })
    } catch (err) {
      console.error('검색 중 오류 발생:', err)
      handleError(err)
    } finally {
      setSearchLoading(false)
    }
  }, [state.selectedTheme, wallpapers, handleThemeSelect])

  // 검색어 초기화 처리
  const handleSearchClear = useCallback(() => {
    if (state.selectedTheme) {
      handleThemeSelect(state.selectedTheme)
    } else {
      setFilteredWallpapers(wallpapers)
    }
  }, [state.selectedTheme, wallpapers, handleThemeSelect])

  // 배경화면 삭제 처리
  const handleWallpaperDelete = useCallback(async () => {
    // 배경화면 목록 새로고침
    try {
      const [wallpapersData, themesData] = await Promise.all([
        wallpaperApi.getAll(),
        themeApi.getAll()
      ])
      
      const sortedWallpapers = wallpapersData.sort((a, b) => {
        const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
        const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
        return scoreB - scoreA
      })

      setWallpapers(sortedWallpapers)
      
      // 현재 필터 상태에 따라 필터링된 목록도 업데이트
      // state 대신 현재 값을 직접 참조
      const currentSearchQuery = state.searchQuery
      const currentSelectedTheme = state.selectedTheme
      
      if (currentSearchQuery) {
        const searchResult = await wallpaperApi.search(currentSearchQuery)
        setFilteredWallpapers(searchResult.wallpapers)
      } else if (currentSelectedTheme) {
        const themeWallpapers = await wallpaperApi.getByTheme(currentSelectedTheme.id)
        const sortedThemeWallpapers = themeWallpapers.sort((a, b) => {
          const scoreA = a.downloadCount + a.likeCount
          const scoreB = b.downloadCount + b.likeCount
          return scoreB - scoreA
        })
        setFilteredWallpapers(sortedThemeWallpapers)
      } else {
        setFilteredWallpapers(sortedWallpapers)
      }
      
      // 전역 상태 업데이트 (배경화면과 테마 모두)
      dispatch({ type: 'SET_WALLPAPERS', payload: sortedWallpapers })
      dispatch({ type: 'SET_THEMES', payload: themesData })
    } catch (error) {
      console.error('배경화면 목록 새로고침 실패:', error)
      handleError(error)
    }
  }, [handleError]) // state 의존성 완전 제거

  // 배경화면 클릭 처리
  const handleWallpaperClick = useCallback((wallpaper: Wallpaper) => {
    dispatch({ type: 'SET_SELECTED_WALLPAPER', payload: wallpaper })
    navigate(`/wallpaper/${wallpaper.id}`)
  }, [navigate]) // dispatch 제거

  // 배경화면 수정 처리
  const handleWallpaperEdit = useCallback((wallpaper: Wallpaper) => {
    setEditingWallpaper(wallpaper)
    setShowEditModal(true)
  }, [])

  // 수정 성공 처리
  const handleEditSuccess = useCallback(async () => {
    try {
      // 배경화면 목록 새로고침
      const [wallpapersData, themesData] = await Promise.all([
        wallpaperApi.getAll(),
        themeApi.getAll()
      ])
      
      const sortedWallpapers = wallpapersData.sort((a, b) => {
        const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
        const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
        return scoreB - scoreA
      })

      setWallpapers(sortedWallpapers)
      
      // 현재 필터 상태에 따라 필터링된 목록도 업데이트
      const currentSearchQuery = state.searchQuery
      const currentSelectedTheme = state.selectedTheme
      
      if (currentSearchQuery) {
        const searchResult = await wallpaperApi.search(currentSearchQuery)
        setFilteredWallpapers(searchResult.wallpapers)
      } else if (currentSelectedTheme) {
        const themeWallpapers = await wallpaperApi.getByTheme(currentSelectedTheme.id)
        const sortedThemeWallpapers = themeWallpapers.sort((a, b) => {
          const scoreA = a.downloadCount + a.likeCount
          const scoreB = b.downloadCount + b.likeCount
          return scoreB - scoreA
        })
        setFilteredWallpapers(sortedThemeWallpapers)
      } else {
        setFilteredWallpapers(sortedWallpapers)
      }
      
      dispatch({ type: 'SET_WALLPAPERS', payload: sortedWallpapers })
      dispatch({ type: 'SET_THEMES', payload: themesData })
    } catch (error) {
      console.error('배경화면 목록 새로고침 실패:', error)
      handleError(error)
    }
  }, [state.searchQuery, state.selectedTheme, handleError, dispatch])

  // 수정 모달 닫기
  const handleEditClose = useCallback(() => {
    setShowEditModal(false)
    setEditingWallpaper(null)
  }, [])

  // 오류 재시도
  const handleRetry = async () => {
    await retry(async () => {
      const [wallpapersData, themesData] = await Promise.all([
        wallpaperApi.getAll(),
        themeApi.getAll()
      ])

      const sortedWallpapers = wallpapersData.sort((a, b) => {
        const scoreA = a.downloadCount + a.likeCount
        const scoreB = b.downloadCount + b.likeCount
        return scoreB - scoreA
      })

      setWallpapers(sortedWallpapers)
      setFilteredWallpapers(sortedWallpapers)
      dispatch({ type: 'SET_WALLPAPERS', payload: sortedWallpapers })
      dispatch({ type: 'SET_THEMES', payload: themesData })
    })
  }

  if (error && !wallpapers.length) {
    return (
      <div className="home-page error">
        <NetworkError
          message={error}
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      </div>
    )
  }

  return (
    <div className={`home-page home-page--${screenSize}`}>
      {/* 관리자 패널 */}
      <AdminPanel />

      {/* SEO 메타 태그 */}
      <SEOHead
        description="고품질 배경화면을 무료로 다운로드하세요. 다양한 테마의 아름다운 바탕화면을 제공합니다."
        keywords="배경화면, 바탕화면, 고화질, 무료다운로드, 데스크톱, 모바일, 테마, 자연, 도시, 추상"
        type="website"
      />

      {/* 헤더 섹션 */}
      <header className="home-page__header">
        <div className="header-content">
          <h1 className="site-title">
            <span className="title-icon">🎨</span>
            배경화면 갤러리
          </h1>
          <p className="site-description">
            고품질 배경화면을 찾아보세요. 다양한 테마와 해상도로 제공됩니다.
          </p>
        </div>
      </header>

      {/* 검색 섹션 */}
      <section className="home-page__search">
        <div className="search-container">
          <SearchBar
            onSearch={handleSearch}
            onClear={handleSearchClear}
            loading={searchLoading}
            autoFocus={false}
            placeholder="원하는 배경화면을 검색하세요..."
          />
          {searchLoading && (
            <div className="search-loading">
              <LoadingSpinner size="small" inline={true} />
            </div>
          )}
        </div>
      </section>

      {/* 테마 선택 섹션 */}
      <section className="home-page__themes">
        <ThemeSelector
          onThemeSelect={handleThemeSelect}
          layout="horizontal"
          showAllOption={true}
          compact={false}
        />
      </section>

      {/* 모바일 중간 광고 (테마와 배경화면 사이) */}
      {(screenSize === 'mobile' || screenSize === 'tablet') && (
        <section className="home-page__ad-middle">
          <ResponsiveBannerAd 
            adSlot="5566778899" 
            className="ad-banner-middle"
          />
        </section>
      )}

      {/* 배경화면 그리드 섹션 */}
      <section className="home-page__wallpapers">
        <div className="wallpapers-header">
          <h2>
            {state.searchQuery ? (
              <>검색 결과: "{state.searchQuery}"</>
            ) : state.selectedTheme ? (
              <>{state.selectedTheme.name} 테마</>
            ) : (
              <>인기 배경화면</>
            )}
          </h2>
          
          {filteredWallpapers.length > 0 && (
            <p className="wallpapers-count">
              총 {filteredWallpapers.length}개의 배경화면
            </p>
          )}
        </div>

        <div className={`wallpapers-content ${screenSize === 'desktop' || screenSize === 'wide' ? 'wallpapers-content--with-sidebar' : 'wallpapers-content--without-sidebar'}`}>
          {/* 좌측 사이드바 광고 (데스크톱에서만) */}
          {(screenSize === 'desktop' || screenSize === 'wide') && (
            <aside className="wallpapers-sidebar wallpapers-sidebar--left">
              <SquareAd 
                adSlot="1111111111" 
                className="ad-sidebar-left"
              />
            </aside>
          )}

          {/* 메인 그리드 */}
          <div className="wallpapers-main">
            <WallpaperGrid
              wallpapers={currentWallpapers}
              loading={loading}
              onWallpaperClick={handleWallpaperClick}
              onWallpaperDelete={handleWallpaperDelete}
              onWallpaperEdit={handleWallpaperEdit}
              layout="grid"
              paginationMode="pagination"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          {/* 우측 사이드바 광고 (데스크톱에서만) */}
          {(screenSize === 'desktop' || screenSize === 'wide') && (
            <aside className="wallpapers-sidebar wallpapers-sidebar--right">
              <SquareAd 
                adSlot="2222222222" 
                className="ad-sidebar-right"
              />
            </aside>
          )}
        </div>
      </section>

      {/* 오류 메시지 (데이터가 있는 상태에서 발생한 오류) */}
      {error && wallpapers.length > 0 && (
        <div className="home-page__error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="dismiss-button" onClick={clearError}>
            ✕
          </button>
        </div>
      )}

      {/* 배경화면 수정 모달 */}
      {showEditModal && editingWallpaper && (
        <WallpaperEdit
          wallpaper={editingWallpaper}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}