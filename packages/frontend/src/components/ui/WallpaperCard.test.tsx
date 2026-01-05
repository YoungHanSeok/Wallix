/**
 * WallpaperCard 컴포넌트 테스트
 * **Feature: wallpaper-website, Property 7: 좋아요 상태 표시 일관성**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import * as fc from 'fast-check'
import { WallpaperCard } from './WallpaperCard'
import { AppProvider } from '../../context'
import type { Wallpaper } from '@wallix/shared'

// API 모킹
vi.mock('../../api', () => ({
  userApi: {
    addLike: vi.fn(),
    removeLike: vi.fn()
  }
}))

// 테스트용 배경화면 데이터 생성기
const wallpaperArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  title: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 2 && !/^\s|\s$/.test(s)),
  description: fc.option(fc.string({ maxLength: 200 })),
  themeId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { maxLength: 10 }),
  resolutions: fc.array(fc.record({
    width: fc.integer({ min: 800, max: 4000 }),
    height: fc.integer({ min: 600, max: 3000 }),
    fileUrl: fc.webUrl(),
    fileSize: fc.integer({ min: 100000, max: 10000000 })
  }), { minLength: 1, maxLength: 5 }),
  thumbnailUrl: fc.webUrl(),
  originalUrl: fc.webUrl(),
  likeCount: fc.integer({ min: 0, max: 10000 }),
  downloadCount: fc.integer({ min: 0, max: 50000 }),
  createdAt: fc.date(),
  updatedAt: fc.date()
}) as fc.Arbitrary<Wallpaper>

// 테스트 래퍼 컴포넌트
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  )
}

describe('WallpaperCard 속성 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * 속성 7: 좋아요 상태 표시 일관성
   * 모든 배경화면에 대해, 표시되는 좋아요 상태는 실제 데이터베이스의 좋아요 상태와 일치해야 한다
   * **검증 대상: 요구사항 3.4**
   */
  it('속성 7: 좋아요 상태 표시 일관성', () => {
    fc.assert(
      fc.property(
        wallpaperArbitrary,
        (wallpaper) => {
          const { container, unmount } = render(
            <TestWrapper>
              <WallpaperCard wallpaper={wallpaper} />
            </TestWrapper>
          )

          try {
            // 배경화면 제목이 올바르게 표시되는지 확인
            const titleElement = container.querySelector('.wallpaper-card__title')
            expect(titleElement).toBeInTheDocument()
            expect(titleElement?.textContent?.trim()).toBe(wallpaper.title.trim())
            
            // 썸네일 이미지가 올바른 src를 가지는지 확인
            const image = container.querySelector('.wallpaper-card__image') as HTMLImageElement
            expect(image).toHaveAttribute('src', wallpaper.thumbnailUrl)
            expect(image).toHaveAttribute('alt', wallpaper.title)

            // 좋아요 버튼이 존재하는지 확인
            const likeButton = container.querySelector('.wallpaper-card__like-button')
            expect(likeButton).toBeInTheDocument()

            // 통계 정보가 올바르게 표시되는지 확인
            const likeCountElement = container.querySelector('.stat-value')
            expect(likeCountElement).toHaveTextContent(wallpaper.likeCount.toString())
          } finally {
            unmount()
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * 기본 렌더링 테스트
   */
  it('배경화면 카드 기본 정보 표시', () => {
    const sampleWallpaper: Wallpaper = {
      id: 'test-1',
      title: '테스트 배경화면',
      description: '테스트용 배경화면입니다',
      themeId: 'nature',
      tags: ['자연', '산', '하늘'],
      resolutions: [{
        width: 1920,
        height: 1080,
        fileUrl: 'https://example.com/1920x1080.jpg',
        fileSize: 1024000
      }],
      thumbnailUrl: 'https://example.com/thumb.jpg',
      originalUrl: 'https://example.com/original.jpg',
      likeCount: 42,
      downloadCount: 123,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    render(
      <TestWrapper>
        <WallpaperCard wallpaper={sampleWallpaper} />
      </TestWrapper>
    )

    // 제목 확인
    expect(screen.getByText('테스트 배경화면')).toBeInTheDocument()
    
    // 이미지 확인
    const image = screen.getByAltText('테스트 배경화면')
    expect(image).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    
    // 통계 확인
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument()
    
    // 좋아요 버튼 확인
    expect(screen.getByRole('button', { name: /좋아요/ })).toBeInTheDocument()
  })

  /**
   * 이미지 로딩 오류 처리 테스트
   */
  it('이미지 로딩 오류 시 대체 이미지 표시', () => {
    const sampleWallpaper: Wallpaper = {
      id: 'test-2',
      title: '오류 테스트',
      themeId: 'test',
      tags: [],
      resolutions: [{
        width: 1920,
        height: 1080,
        fileUrl: 'https://example.com/1920x1080.jpg',
        fileSize: 1024000
      }],
      thumbnailUrl: 'https://invalid-url.com/thumb.jpg',
      originalUrl: 'https://example.com/original.jpg',
      likeCount: 0,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    render(
      <TestWrapper>
        <WallpaperCard wallpaper={sampleWallpaper} />
      </TestWrapper>
    )

    const image = screen.getByAltText('오류 테스트') as HTMLImageElement
    
    // 이미지 로딩 오류 시뮬레이션
    fireEvent.error(image)
    
    // 대체 이미지로 변경되었는지 확인
    expect(image.src).toContain('placeholder-wallpaper.jpg')
  })
})