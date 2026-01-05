/**
 * 다운로드 모달 컴포넌트
 * 해상도 선택 옵션을 표시하고 다운로드 진행 상태를 표시
 */

import { useState, useEffect } from 'react'
import './DownloadModal.css'
import { wallpaperApi } from '../../api'
import type { Wallpaper, Resolution } from '@wallix/shared'
import './DownloadModal.css'

interface DownloadModalProps {
  /** 다운로드할 배경화면 */
  wallpaper: Wallpaper | null
  /** 모달 열림/닫힘 상태 */
  isOpen: boolean
  /** 모달 닫기 콜백 */
  onClose: () => void
  /** 다운로드 완료 콜백 */
  onDownloadComplete?: (wallpaper: Wallpaper, resolution: Resolution) => void
}

interface DownloadProgress {
  resolution: Resolution
  status: 'preparing' | 'downloading' | 'completed' | 'error'
  progress: number
  error?: string
}

export function DownloadModal({
  wallpaper,
  isOpen,
  onClose,
  onDownloadComplete
}: DownloadModalProps) {
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // 모달이 열릴 때 기본 해상도 선택
  useEffect(() => {
    if (isOpen && wallpaper && wallpaper.resolutions.length > 0) {
      // 가장 높은 해상도를 기본으로 선택
      const highestResolution = wallpaper.resolutions.reduce((prev, current) => 
        (prev.width * prev.height) > (current.width * current.height) ? prev : current
      )
      setSelectedResolution(highestResolution)
    }
  }, [isOpen, wallpaper])

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedResolution(null)
      setDownloadProgress(null)
      setIsDownloading(false)
    }
  }, [isOpen])

  // 해상도 선택 핸들러
  const handleResolutionSelect = (resolution: Resolution) => {
    if (isDownloading) return
    setSelectedResolution(resolution)
  }

  // 다운로드 시작
  const handleDownload = async () => {
    if (!wallpaper || !selectedResolution || isDownloading) return

    setIsDownloading(true)
    setDownloadProgress({
      resolution: selectedResolution,
      status: 'preparing',
      progress: 0
    })

    try {
      // 다운로드 준비
      setDownloadProgress(prev => prev ? { ...prev, status: 'downloading', progress: 10 } : null)

      // 다운로드 URL 생성 - 실제 파일 URL 사용
      const downloadUrl = selectedResolution.fileUrl

      // 진행 상태 시뮬레이션 (실제 구현에서는 실제 다운로드 진행률을 사용)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (!prev || prev.progress >= 90) return prev
          return { ...prev, progress: prev.progress + 10 }
        })
      }, 200)

      // 다운로드 실행
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      const link = document.createElement('a')
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = `${wallpaper.title}-${selectedResolution.width}x${selectedResolution.height}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url);

      // 다운로드 완료 처리
      setTimeout(() => {
        clearInterval(progressInterval)
        setDownloadProgress(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null)
        
        if (onDownloadComplete) {
          onDownloadComplete(wallpaper, selectedResolution)
        }

        // 2초 후 모달 닫기
        setTimeout(() => {
          onClose()
        }, 2000)
      }, 1000)

    } catch (error) {
      console.error('다운로드 중 오류 발생:', error)
      setDownloadProgress(prev => prev ? {
        ...prev,
        status: 'error',
        error: '다운로드 중 오류가 발생했습니다.'
      } : null)
      setIsDownloading(false)
    }
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 해상도 비율 계산
  const getAspectRatio = (resolution: Resolution): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(resolution.width, resolution.height)
    const ratioW = resolution.width / divisor
    const ratioH = resolution.height / divisor
    return `${ratioW}:${ratioH}`
  }

  // 해상도 품질 레벨 계산
  const getQualityLevel = (resolution: Resolution): string => {
    const pixels = resolution.width * resolution.height
    if (pixels >= 3840 * 2160) return '4K'
    if (pixels >= 2560 * 1440) return 'QHD'
    if (pixels >= 1920 * 1080) return 'FHD'
    if (pixels >= 1280 * 720) return 'HD'
    return 'SD'
  }

  if (!isOpen || !wallpaper) return null

  return (
    <div className="download-modal-overlay" onClick={onClose}>
      <div className="download-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="download-modal__header">
          <h2 className="download-modal__title">배경화면 다운로드</h2>
          <button 
            className="download-modal__close"
            onClick={onClose}
            aria-label="모달 닫기"
          >
            ✕
          </button>
        </div>

        {/* 배경화면 정보 */}
        <div className="download-modal__wallpaper-info">
          <img 
            src={wallpaper.thumbnailUrl}
            alt={wallpaper.title}
            className="wallpaper-preview"
          />
          <div className="wallpaper-details">
            <h3 className="wallpaper-title">{wallpaper.title}</h3>
            {wallpaper.description && (
              <p className="wallpaper-description">{wallpaper.description}</p>
            )}
          </div>
        </div>

        {/* 다운로드 진행 중이 아닐 때 해상도 선택 */}
        {!downloadProgress && (
          <>
            <div className="download-modal__section">
              <h4 className="section-title">해상도 선택</h4>
              <div className="resolution-grid">
                {wallpaper.resolutions.map((resolution) => (
                  <button
                    key={`${resolution.width}x${resolution.height}`}
                    className={`resolution-option ${
                      selectedResolution === resolution ? 'selected' : ''
                    }`}
                    onClick={() => handleResolutionSelect(resolution)}
                  >
                    <div className="resolution-info">
                      <span className="resolution-size">
                        {resolution.width} × {resolution.height}
                      </span>
                      <span className="resolution-quality">
                        {getQualityLevel(resolution)}
                      </span>
                    </div>
                    <div className="resolution-details">
                      <span className="aspect-ratio">
                        {getAspectRatio(resolution)}
                      </span>
                      <span className="file-size">
                        {formatFileSize(resolution.fileSize)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 다운로드 버튼 */}
            <div className="download-modal__actions">
              <button 
                className="download-button"
                onClick={handleDownload}
                disabled={!selectedResolution}
              >
                <span className="download-icon">⬇️</span>
                다운로드 시작
              </button>
            </div>
          </>
        )}

        {/* 다운로드 진행 상태 */}
        {downloadProgress && (
          <div className="download-modal__progress">
            <div className="progress-info">
              <h4 className="progress-title">
                {downloadProgress.status === 'preparing' && '다운로드 준비 중...'}
                {downloadProgress.status === 'downloading' && '다운로드 중...'}
                {downloadProgress.status === 'completed' && '다운로드 완료!'}
                {downloadProgress.status === 'error' && '다운로드 실패'}
              </h4>
              
              {downloadProgress.status !== 'error' && (
                <div className="progress-details">
                  <span>
                    {downloadProgress.resolution.width} × {downloadProgress.resolution.height}
                  </span>
                  <span>
                    {formatFileSize(downloadProgress.resolution.fileSize)}
                  </span>
                </div>
              )}
            </div>

            {/* 진행률 바 */}
            {downloadProgress.status !== 'error' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${downloadProgress.progress}%` }}
                />
              </div>
            )}

            {/* 오류 메시지 */}
            {downloadProgress.status === 'error' && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{downloadProgress.error}</span>
                <button 
                  className="retry-button"
                  onClick={() => {
                    setDownloadProgress(null)
                    setIsDownloading(false)
                  }}
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 완료 메시지 */}
            {downloadProgress.status === 'completed' && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                <span>다운로드가 완료되었습니다!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}