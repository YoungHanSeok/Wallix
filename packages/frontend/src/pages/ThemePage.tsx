/**
 * 테마별 배경화면 페이지 컴포넌트
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '../context'
import { 
  WallpaperGrid,
  LoadingSpinner,
  NetworkError
} from '../components/ui'
import { SEOHead } from '../components/seo'
import { ResponsiveBannerAd, SquareAd } from '../components/ads'
import { useErrorHandler, useScreenSize } from '../hooks'
import { wallpaperApi, themeApi } from '../api'
import type { Wallpaper, Theme } from '@wallix/shared'
import './ThemePage.css'

export function ThemePage() {
  const { themeId } = useParams<{ themeId: string }>()
  const { state, dispatch } = useAppContext()
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const { error, isRetrying, handleError, clearError, retry } = useErrorHandler()
  const screenSize = useScreenSize()

  // 테마 데이터 및 배경화면 로드
  useEffect(() => {
    const loadThemeData = async () => {
      if (!themeId) return

      setLoading(true)
      clearError()

      try {
        // 테마 정보와 배경화면을 병렬로 로드
        const [themeData, wallpapersData] = await Promise.all([
          themeApi.getById(themeId),
          wallpaperApi.getByTheme(themeId)
        ])

        setTheme(themeData)
        
        // 인기 순으로 정렬
        const sortedWallpapers = wallpapersData.sort((a, b) => {
          const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
          const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
          return scoreB - scoreA
        })

        setWallpapers(sortedWallpapers)
        
        // 전역 상태 업데이트
        dispatch({ type: 'SET_SELECTED_THEME', payload: themeData })
      } catch (err) {
        console.error('테마 데이터 로드 중 오류 발생:', err)
        handleError(err)
      } finally {
        setLoading(false)
      }
    }

    loadThemeData()
  }, [themeId, dispatch, clearError, handleError])

  // 배경화면 클릭 처리
  const handleWallpaperClick = useCallback((wallpaper: Wallpaper) => {
    dispatch({ type: 'SET_SELECTED_WALLPAPER', payload: wallpaper })
  }, [dispatch])

  // 배경화면 삭제 처리 (관리자 전용)
  const handleWallpaperDelete = useCallback(async () => {
    if (!themeId) return
    
    try {
      const wallpapersData = await wallpaperApi.getByTheme(themeId)
      const sortedWallpapers = wallpapersData.sort((a, b) => {
        const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
        const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
        return scoreB - scoreA
      })
      setWallpapers(sortedWallpapers)
    } catch (error) {
      console.error('배경화면 목록 새로고침 실패:', error)
      handleError(error)
    }
  }, [themeId, handleError])

  // 오류 재시도
  const handleRetry = async () => {
    await retry(async () => {
      if (!themeId) return
      
      const [themeData, wallpapersData] = await Promise.all([
        themeApi.getById(themeId),
        wallpaperApi.getByTheme(themeId)
      ])

      setTheme(themeData)
      const sortedWallpapers = wallpapersData.sort((a, b) => {
        const scoreA = (a.downloadCount || 0) + (a.likeCount || 0)
        const scoreB = (b.downloadCount || 0) + (b.likeCount || 0)
        return scoreB - scoreA
      })
      setWallpapers(sortedWallpapers)
      dispatch({ type: 'SET_SELECTED_THEME', payload: themeData })
    })
  }

  if (error && !wallpapers.length) {
    return (
      <div className="theme-page error">
        <NetworkError
          message={error}
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      </div>
    )
  }

  return (
    <div className={`theme-page theme-page--${screenSize}`}>
      {/* SEO 메타 태그 */}
      {theme && (
        <SEOHead
          title={`${theme.name} 테마 배경화면`}
          description={`${theme.name} 테마의 고품질 배경화면을 무료로 다운로드하세요. ${theme.description}`}
          keywords={`배경화면, 바탕화면, ${theme.name}, 고화질, 무료다운로드`}
          type="website"
        />
      )}

      {/* 브레드크럼 네비게이션 */}
      <nav className="theme-page__breadcrumb">
        <div className="breadcrumb-container">
          <Link to="/" className="breadcrumb-link">
            <span className="breadcrumb-icon">🏠</span>
            <span>홈</span>
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{theme?.name || '테마'}</span>
        </div>
      </nav>

      {/* 상단 광고 */}
      <section className="theme-page__ad-top">
        <ResponsiveBannerAd 
          adSlot="3344556677" 
          className="ad-banner-theme-top"
        />
      </section>

      {/* 헤더 섹션 */}
      <header className="theme-page__header">
        <div className="header-content">
          <h1 className="theme-title">
            {theme?.iconUrl && (
              <img src={theme.iconUrl} alt={`${theme.name} 아이콘`} className="theme-icon" />
            )}
            {theme?.name || '테마'} 배경화면
          </h1>
          {theme?.description && (
            <p className="theme-description">{theme.description}</p>
          )}
          <div className="theme-stats">
            <span className="wallpaper-count">총 {wallpapers.length}개의 배경화면</span>
          </div>
        </div>
      </header>

      {/* 배경화면 그리드 섹션 */}
      <section className="theme-page__wallpapers">
        <div className={`wallpapers-content ${screenSize === 'desktop' || screenSize === 'wide' ? 'wallpapers-content--with-sidebar' : 'wallpapers-content--without-sidebar'}`}>
          {/* 좌측 사이드바 광고 (데스크톱에서만) */}
          {(screenSize === 'desktop' || screenSize === 'wide') && (
            <aside className="wallpapers-sidebar wallpapers-sidebar--left">
              <SquareAd 
                adSlot="4455667788" 
                className="ad-sidebar-left"
              />
            </aside>
          )}

          {/* 메인 그리드 */}
          <div className="wallpapers-main">
            {/* 모바일 중간 광고 */}
            {(screenSize === 'mobile' || screenSize === 'tablet') && wallpapers.length > 6 && (
              <div className="mobile-ad-container" style={{ gridColumn: '1 / -1' }}>
                <ResponsiveBannerAd 
                  adSlot="5566778899" 
                  className="ad-banner-mobile-middle"
                />
              </div>
            )}
            
            <WallpaperGrid
              wallpapers={wallpapers}
              loading={loading}
              onWallpaperClick={handleWallpaperClick}
              onWallpaperDelete={handleWallpaperDelete}
              layout="grid"
              paginationMode="infinite"
              mobileAdInterval={8} // 8개마다 광고 삽입
            />
          </div>

          {/* 우측 사이드바 광고 (데스크톱에서만) */}
          {(screenSize === 'desktop' || screenSize === 'wide') && (
            <aside className="wallpapers-sidebar wallpapers-sidebar--right">
              <SquareAd 
                adSlot="6677889900" 
                className="ad-sidebar-right"
              />
            </aside>
          )}
        </div>
      </section>

      {/* 하단 광고 */}
      <section className="theme-page__ad-bottom">
        <ResponsiveBannerAd 
          adSlot="7788990011" 
          className="ad-banner-theme-bottom"
        />
      </section>

      {/* 오류 메시지 */}
      {error && wallpapers.length > 0 && (
        <div className="theme-page__error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="dismiss-button" onClick={clearError}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}