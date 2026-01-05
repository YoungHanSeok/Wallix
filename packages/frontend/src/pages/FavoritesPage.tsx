/**
 * 즐겨찾기 페이지 컴포넌트
 * 사용자 좋아요 목록을 표시하고 좋아요 제거 기능을 제공
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppContext } from '../context'
import { WallpaperGrid, SearchBar } from '../components/ui'
import { userApi } from '../api'
import type { Wallpaper } from '@wallix/shared'
import './FavoritesPage.css'

// 정렬 옵션 타입
type SortOption = 'recent' | 'title' | 'popular'

interface SortConfig {
  key: SortOption
  label: string
  icon: string
}

const SORT_OPTIONS: SortConfig[] = [
  { key: 'recent', label: '최근 좋아요순', icon: '🕒' },
  { key: 'title', label: '제목순', icon: '🔤' },
  { key: 'popular', label: '인기순', icon: '🔥' }
]

export function FavoritesPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()
  
  const [likedWallpapers, setLikedWallpapers] = useState<Wallpaper[]>([])
  const [filteredWallpapers, setFilteredWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [searchQuery, setSearchQuery] = useState('')


  // 좋아요 목록 로드
  useEffect(() => {
    const loadLikedWallpapers = async () => {
      setLoading(true)
      setError(null)

      try {
        // 사용자 좋아요 목록 조회 (이미 Wallpaper 배열을 반환)
        const likedWallpapersData = await userApi.getLikes(state.userId)
        
        setLikedWallpapers(likedWallpapersData)
        setFilteredWallpapers(likedWallpapersData)
        
        // 전역 상태 업데이트
        dispatch({ 
          type: 'SET_LIKED_WALLPAPERS', 
          payload: likedWallpapersData.map(w => w.id) 
        })
      } catch (err) {
        console.error('좋아요 목록 로드 중 오류 발생:', err)
        setError('좋아요 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadLikedWallpapers()
  }, [state.userId, dispatch])

  // 배경화면 정렬
  const sortWallpapers = useCallback((wallpapers: Wallpaper[], sortOption: SortOption): Wallpaper[] => {
    const sorted = [...wallpapers]
    
    switch (sortOption) {
      case 'recent':
        // 좋아요 추가 순서는 API에서 제공되지 않으므로 ID 순으로 정렬 (최신 ID가 더 큰 값이라고 가정)
        return sorted.sort((a, b) => b.id.localeCompare(a.id))
      
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
      
      case 'popular':
        return sorted.sort((a, b) => {
          const scoreA = a.downloadCount + a.likeCount
          const scoreB = b.downloadCount + b.likeCount
          return scoreB - scoreA
        })
      
      default:
        return sorted
    }
  }, [])

  // 정렬 옵션 변경 처리
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy)
    const sorted = sortWallpapers(filteredWallpapers, newSortBy)
    setFilteredWallpapers(sorted)
  }, [filteredWallpapers, sortWallpapers])

  // 검색 처리
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      // 검색어가 비어있으면 전체 좋아요 목록 표시
      const sorted = sortWallpapers(likedWallpapers, sortBy)
      setFilteredWallpapers(sorted)
      return
    }

    // 로컬에서 검색 (제목과 태그에서 검색)
    const searchResults = likedWallpapers.filter(wallpaper => {
      const searchTerm = query.toLowerCase()
      return (
        wallpaper.title.toLowerCase().includes(searchTerm) ||
        wallpaper.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        (wallpaper.description && wallpaper.description.toLowerCase().includes(searchTerm))
      )
    })
    
    const sorted = sortWallpapers(searchResults, sortBy)
    setFilteredWallpapers(sorted)
  }, [likedWallpapers, sortBy, sortWallpapers])

  // 검색어 초기화 처리
  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    const sorted = sortWallpapers(likedWallpapers, sortBy)
    setFilteredWallpapers(sorted)
  }, [likedWallpapers, sortBy, sortWallpapers])

  // 배경화면 클릭 처리
  const handleWallpaperClick = useCallback((wallpaper: Wallpaper) => {
    dispatch({ type: 'SET_SELECTED_WALLPAPER', payload: wallpaper })
    navigate(`/wallpaper/${wallpaper.id}`)
  }, [dispatch, navigate])



  // 모든 좋아요 제거
  const handleClearAllLikes = useCallback(async () => {
    if (!window.confirm('모든 좋아요를 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 모든 좋아요 제거
      const removePromises = likedWallpapers.map(wallpaper => 
        userApi.removeLike(state.userId, wallpaper.id)
      )
      
      await Promise.all(removePromises)
      
      // 상태 초기화
      setLikedWallpapers([])
      setFilteredWallpapers([])
      dispatch({ type: 'SET_LIKED_WALLPAPERS', payload: [] })
    } catch (err) {
      console.error('모든 좋아요 제거 중 오류 발생:', err)
      setError('모든 좋아요 제거 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [likedWallpapers, state.userId, dispatch])

  // 오류 재시도
  const handleRetry = () => {
    setError(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="favorites-page loading">
        <div className="loading-container">
          <div className="loading-spinner">⟳</div>
          <p>좋아요 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="favorites-page error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
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
    <div className="favorites-page">
      {/* 브레드크럼 네비게이션 */}
      <nav className="favorites-page__breadcrumb">
        <Link to="/" className="breadcrumb-link">
          <span className="breadcrumb-icon">🏠</span>
          홈
        </Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">즐겨찾기</span>
      </nav>

      {/* 헤더 */}
      <header className="favorites-page__header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">
              <span className="title-icon">❤️</span>
              즐겨찾기
            </h1>
            <p className="page-description">
              좋아요를 표시한 배경화면들을 모아보세요
            </p>
          </div>
          
          {likedWallpapers.length > 0 && (
            <div className="header-actions">
              <button 
                className="clear-all-button"
                onClick={handleClearAllLikes}
              >
                <span className="clear-icon">🗑️</span>
                모두 제거
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 빈 상태 */}
      {likedWallpapers.length === 0 ? (
        <div className="favorites-page__empty">
          <div className="empty-container">
            <div className="empty-icon">💔</div>
            <h2>아직 좋아요한 배경화면이 없습니다</h2>
            <p>마음에 드는 배경화면에 좋아요를 표시해보세요!</p>
            <Link to="/" className="browse-button">
              <span className="browse-icon">🎨</span>
              배경화면 둘러보기
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 검색 및 필터 섹션 */}
          <section className="favorites-page__controls">
            <div className="controls-container">
              {/* 검색 바 */}
              <div className="search-section">
                <SearchBar
                  onSearch={handleSearch}
                  onClear={handleSearchClear}
                  placeholder="즐겨찾기에서 검색..."
                />
              </div>

              {/* 정렬 옵션 */}
              <div className="sort-section">
                <label className="sort-label">정렬:</label>
                <div className="sort-options">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`sort-button ${sortBy === option.key ? 'active' : ''}`}
                      onClick={() => handleSortChange(option.key)}
                    >
                      <span className="sort-icon">{option.icon}</span>
                      <span className="sort-text">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 결과 헤더 */}
          <section className="favorites-page__results-header">
            <div className="results-info">
              <h2>
                {searchQuery ? (
                  <>"{searchQuery}" 검색 결과</>
                ) : (
                  <>내 즐겨찾기</>
                )}
              </h2>
              <p className="results-count">
                {filteredWallpapers.length}개의 배경화면
                {searchQuery && likedWallpapers.length !== filteredWallpapers.length && (
                  <span className="total-count"> (전체 {likedWallpapers.length}개 중)</span>
                )}
              </p>
            </div>
          </section>

          {/* 배경화면 그리드 */}
          <section className="favorites-page__wallpapers">
            <WallpaperGrid
              wallpapers={filteredWallpapers}
              loading={false}
              onWallpaperClick={handleWallpaperClick}
              layout="grid"
              paginationMode="infinite"
            />
          </section>
        </>
      )}

      {/* 오류 배너 */}
      {error && (
        <div className="favorites-page__error-banner">
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