/**
 * 배경화면 상세 페이지 컴포넌트
 * 배경화면 상세 정보 및 큰 이미지를 표시하고 다운로드 모달과 좋아요 기능을 통합
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '../context'
import { DownloadModal } from '../components/ui'
import { SEOHead } from '../components/seo'
import { ResponsiveBannerAd, SquareAd } from '../components/ads'
import { useScreenSize } from '../hooks'
import { wallpaperApi, userApi, themeApi } from '../api'
import type { Wallpaper, Theme } from '@wallix/shared'
import './WallpaperDetailPage.css'

export function WallpaperDetailPage() {
  const { wallpaperId } = useParams<{ wallpaperId: string }>()

  const { state, dispatch } = useAppContext()
  const screenSize = useScreenSize()
  
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // 배경화면 데이터 로드
  useEffect(() => {
    const loadWallpaper = async () => {
      if (!wallpaperId) {
        setError('배경화면 ID가 제공되지 않았습니다.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const wallpaperData = await wallpaperApi.getById(wallpaperId)
        setWallpaper(wallpaperData)
        
        // 테마 데이터도 로드
        try {
          const themeData = await themeApi.getById(wallpaperData.themeId)
          setTheme(themeData)
        } catch (themeError) {
          console.error('테마 데이터 로드 실패:', themeError)
          // 테마 로드 실패해도 배경화면은 표시
        }
        
        // 전역 상태 업데이트
        dispatch({ type: 'SET_SELECTED_WALLPAPER', payload: wallpaperData })
        
        // 좋아요 상태 확인
        const isLikedByUser = state.likedWallpapers.includes(wallpaperData.id)
        setIsLiked(isLikedByUser)
      } catch (err) {
        console.error('배경화면 데이터 로드 중 오류 발생:', err)
        setError('배경화면 데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadWallpaper()
  }, [wallpaperId, dispatch, state.likedWallpapers])

  // 좋아요 토글 처리
  const handleLikeToggle = useCallback(async () => {
    if (!wallpaper || likeLoading) return

    setLikeLoading(true)

    try {
      if (isLiked) {
        // 좋아요 제거
        await userApi.removeLike(state.userId, wallpaper.id)
        dispatch({ type: 'REMOVE_LIKE', payload: wallpaper.id })
        setIsLiked(false)
        
        // 배경화면 좋아요 수 업데이트
        const updatedWallpaper = {
          ...wallpaper,
          likeCount: Math.max(0, wallpaper.likeCount - 1)
        }
        setWallpaper(updatedWallpaper)
      } else {
        // 좋아요 추가
        await userApi.addLike(state.userId, wallpaper.id)
        dispatch({ type: 'ADD_LIKE', payload: wallpaper.id })
        setIsLiked(true)
        
        // 배경화면 좋아요 수 업데이트
        const updatedWallpaper = {
          ...wallpaper,
          likeCount: wallpaper.likeCount + 1
        }
        setWallpaper(updatedWallpaper)
      }
    } catch (err) {
      console.error('좋아요 처리 중 오류 발생:', err)
      setError('좋아요 처리 중 오류가 발생했습니다.')
    } finally {
      setLikeLoading(false)
    }
  }, [wallpaper, isLiked, likeLoading, state.userId, dispatch])

  // 다운로드 모달 열기
  const handleDownloadClick = useCallback(() => {
    setShowDownloadModal(true)
  }, [])

  // 다운로드 모달 닫기
  const handleDownloadModalClose = useCallback(() => {
    setShowDownloadModal(false)
  }, [])

  // 이미지 로딩 완료 처리
  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
    setImageError(false)
  }, [])

  // 이미지 로딩 오류 처리
  const handleImageError = useCallback(() => {
    setImageLoading(false)
    setImageError(true)
  }, [])

  // 공유 기능
  const handleShare = useCallback(async () => {
    if (!wallpaper) return

    const shareData = {
      title: wallpaper.title,
      text: `${wallpaper.title} - 고품질 배경화면`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // 폴백: 클립보드에 URL 복사
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 클립보드에 복사되었습니다!')
      }
    } catch (err) {
      console.error('공유 중 오류 발생:', err)
    }
  }, [wallpaper])

  // 오류 재시도
  const handleRetry = () => {
    setError(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="wallpaper-detail-page loading">
        <div className="loading-container">
          <div className="loading-spinner">⟳</div>
          <p>배경화면을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !wallpaper) {
    return (
      <div className="wallpaper-detail-page error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>오류가 발생했습니다</h2>
          <p>{error || '배경화면을 찾을 수 없습니다.'}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={handleRetry}>
              다시 시도
            </button>
            <Link to="/" className="home-button">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallpaper-detail-page">
      {/* SEO 메타 태그 */}
      {wallpaper && (
        <SEOHead
          title={wallpaper.title}
          description={`${wallpaper.title} - 고품질 배경화면을 무료로 다운로드하세요. ${wallpaper.description || ''}`}
          keywords={`배경화면, 바탕화면, ${wallpaper.title}, ${wallpaper.tags.join(', ')}, 고화질, 무료다운로드`}
          image={wallpaper.thumbnailUrl}
          type="article"
        />
      )}

      {/* 브레드크럼 네비게이션 */}
      <nav className="wallpaper-detail-page__breadcrumb">
        <Link to="/" className="breadcrumb-link">
          <span className="breadcrumb-icon">🏠</span>
          홈
        </Link>
        <span className="breadcrumb-separator">›</span>
        <Link to={`/theme/${wallpaper.themeId}`} className="breadcrumb-link">
          {theme?.name || '테마'}
        </Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{wallpaper.title}</span>
      </nav>

      {/* 상단 광고 */}
      <section className="wallpaper-detail-page__ad-top">
        <ResponsiveBannerAd 
          adSlot="2233445566" 
          className="ad-banner-detail-top"
        />
      </section>

      {/* 메인 콘텐츠 */}
      <main className="wallpaper-detail-page__main">
        <div className="main-container">
          {/* 이미지 섹션 */}
          <section className="wallpaper-detail-page__image">
            <div className="image-container">
              {imageLoading && (
                <div className="image-loading">
                  <div className="loading-spinner">⟳</div>
                  <p>이미지를 불러오는 중...</p>
                </div>
              )}
              
              {imageError ? (
                <div className="image-error">
                  <div className="error-icon">🖼️</div>
                  <p>이미지를 불러올 수 없습니다</p>
                  <button 
                    className="retry-image-button"
                    onClick={() => {
                      setImageError(false)
                      setImageLoading(true)
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <img
                  src={wallpaper.originalUrl}
                  alt={wallpaper.title}
                  className={`wallpaper-image ${imageLoading ? 'loading' : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>
          </section>

          {/* 정보 섹션 */}
          <section className="wallpaper-detail-page__info">
            <div className="info-container">
              {/* 제목 및 기본 정보 */}
              <header className="wallpaper-header">
                <h1 className="wallpaper-title">{wallpaper.title}</h1>
                {wallpaper.description && (
                  <p className="wallpaper-description">{wallpaper.description}</p>
                )}
              </header>

              {/* 통계 정보 */}
              <div className="wallpaper-stats">
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <div className="stat-content">
                    <span className="stat-value">{wallpaper.likeCount.toLocaleString()}</span>
                    <span className="stat-label">좋아요</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⬇️</span>
                  <div className="stat-content">
                    <span className="stat-value">{wallpaper.downloadCount.toLocaleString()}</span>
                    <span className="stat-label">다운로드</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <div className="stat-content">
                    <span className="stat-value">
                      {(() => {
                        const date = new Date(wallpaper.createdAt);
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        
                        // 화면 크기에 따라 다른 형식 사용
                        if (screenSize === 'mobile') {
                          return `${year.toString().slice(-2)}.${month}.${day}`;
                        } else {
                          return `${year}.${month}.${day}`;
                        }
                      })()}
                    </span>
                    <span className="stat-label">등록일</span>
                  </div>
                </div>
              </div>

              {/* 사이드바 광고 (데스크톱) */}
              <div className="wallpaper-ad-sidebar">
                <SquareAd 
                  adSlot="3344556677" 
                  className="ad-detail-sidebar"
                />
              </div>

              {/* 해상도 정보 */}
              <div className="wallpaper-resolutions">
                <h3 className="resolutions-title">사용 가능한 해상도</h3>
                <div className="resolutions-list">
                  {wallpaper.resolutions.map((resolution, index) => {
                    // 해상도 이름 매핑
                    const getResolutionName = (width: number, height: number) => {
                      if (width === 1280 && height === 720) return 'HD'
                      if (width === 1920 && height === 1080) return 'FHD'
                      if (width === 2560 && height === 1440) return '2K'
                      if (width === 3840 && height === 2160) return '4K'
                      if (width === 7680 && height === 4320) return '8K'
                      return '커스텀'
                    }

                    const resolutionName = getResolutionName(resolution.width, resolution.height)
                    
                    return (
                      <div key={index} className="resolution-item">
                        <div className="resolution-info">
                          <span className="resolution-name">{resolutionName}</span>
                          <span className="resolution-size">
                            {resolution.width} × {resolution.height}
                          </span>
                        </div>
                        <span className="resolution-filesize">
                          {(resolution.fileSize / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 태그 */}
              {wallpaper.tags.length > 0 && (
                <div className="wallpaper-tags">
                  <h3 className="tags-title">태그</h3>
                  <div className="tags-list">
                    {wallpaper.tags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="wallpaper-actions">
                <button
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeToggle}
                  disabled={likeLoading}
                >
                  <span className="like-icon">
                    {likeLoading ? '⟳' : isLiked ? '❤️' : '🤍'}
                  </span>
                  <span className="like-text">
                    {isLiked ? '좋아요 취소' : '좋아요'}
                  </span>
                </button>

                <button
                  className="download-button"
                  onClick={handleDownloadClick}
                >
                  <span className="download-icon">⬇️</span>
                  <span className="download-text">다운로드</span>
                </button>

                <button
                  className="share-button"
                  onClick={handleShare}
                >
                  <span className="share-icon">🔗</span>
                  <span className="share-text">공유</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 하단 광고 */}
      <section className="wallpaper-detail-page__ad-bottom">
        <ResponsiveBannerAd 
          adSlot="4455667788" 
          className="ad-banner-detail-bottom"
        />
      </section>

      {/* 다운로드 모달 */}
      <DownloadModal
        isOpen={showDownloadModal}
        wallpaper={wallpaper}
        onClose={handleDownloadModalClose}
      />

      {/* 오류 배너 */}
      {error && (
        <div className="wallpaper-detail-page__error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="dismiss-button" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}