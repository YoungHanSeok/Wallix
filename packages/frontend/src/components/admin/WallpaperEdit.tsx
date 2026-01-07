/**
 * 배경화면 수정 컴포넌트 (관리자 전용)
 */

import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../context'
import { updateWallpaper } from '../../api'
import type { Wallpaper } from '@wallix/shared'
import './WallpaperEdit.css'

interface WallpaperEditProps {
  wallpaper: Wallpaper
  onClose: () => void
  onSuccess: () => void
}

interface Resolution {
  width: number
  height: number
}

const PRESET_RESOLUTIONS = [
  { name: 'HD', width: 1280, height: 720 },
  { name: 'FHD', width: 1920, height: 1080 },
  { name: '2K', width: 2560, height: 1440 },
  { name: '4K', width: 3840, height: 2160 }
]

export function WallpaperEdit({ wallpaper, onClose, onSuccess }: WallpaperEditProps) {
  const { state } = useAppContext()
  const [formData, setFormData] = useState({
    title: wallpaper.title,
    description: wallpaper.description || '',
    tags: wallpaper.tags.join(', '),
    theme: wallpaper.themeId
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 해상도 관련 상태
  const [selectedResolution, setSelectedResolution] = useState<string>('FHD')
  const [customResolution, setCustomResolution] = useState({ width: '', height: '' })

  // 현재 배경화면의 해상도 정보 설정
  useEffect(() => {
    if (wallpaper.resolutions && wallpaper.resolutions.length > 0) {
      const currentRes = wallpaper.resolutions[0]
      const preset = PRESET_RESOLUTIONS.find(p => 
        p.width === currentRes.width && p.height === currentRes.height
      )
      
      if (preset) {
        setSelectedResolution(preset.name)
      } else {
        setSelectedResolution('custom')
        setCustomResolution({
          width: currentRes.width.toString(),
          height: currentRes.height.toString()
        })
      }
    }
  }, [wallpaper])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다')
        return
      }

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다')
        return
      }

      setSelectedFile(file)
      setError(null)

      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResolutionChange = (resolutionName: string) => {
    setSelectedResolution(resolutionName)
    if (resolutionName !== 'custom') {
      setCustomResolution({ width: '', height: '' })
    }
  }

  const getSelectedResolutionData = (): Resolution[] => {
    if (selectedResolution === 'custom') {
      const width = parseInt(customResolution.width)
      const height = parseInt(customResolution.height)
      
      if (width && height && width > 0 && height > 0) {
        return [{ width, height }]
      }
      return []
    }
    
    const preset = PRESET_RESOLUTIONS.find(p => p.name === selectedResolution)
    return preset ? [{ width: preset.width, height: preset.height }] : []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요')
      return
    }

    if (selectedResolution === 'custom') {
      const width = parseInt(customResolution.width)
      const height = parseInt(customResolution.height)
      
      if (!width || !height || width <= 0 || height <= 0) {
        setError('올바른 해상도를 입력해주세요')
        return
      }
      
      if (width > 7680 || height > 4320) {
        setError('해상도는 8K(7680x4320) 이하여야 합니다')
        return
      }
    } else if (!selectedResolution) {
      setError('해상도를 선택해주세요')
      return
    }

    if (!state.adminKey) {
      setError('관리자 인증이 필요합니다')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const updateFormData = new FormData()
      
      // 새 이미지가 선택된 경우에만 추가
      if (selectedFile) {
        updateFormData.append('wallpaper', selectedFile)
        
        // 해상도 데이터 추가
        const resolutionData = getSelectedResolutionData()
        updateFormData.append('resolutions', JSON.stringify(resolutionData))
      }
      
      updateFormData.append('title', formData.title.trim())
      updateFormData.append('description', formData.description.trim())
      updateFormData.append('theme', formData.theme)
      
      // 태그 처리
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      tags.forEach(tag => {
        updateFormData.append('tags', tag)
      })

      await updateWallpaper(state.adminKey, wallpaper.id, updateFormData)
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('수정 오류:', error)
      setError('수정 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    // 파일 입력 초기화
    const fileInput = document.getElementById('wallpaper-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="wallpaper-edit-overlay">
      <div className="wallpaper-edit-modal">
        <div className="edit-header">
          <h2>배경화면 수정</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          {/* 현재 이미지 미리보기 */}
          <div className="current-image-section">
            <label>현재 이미지</label>
            <div className="current-image-preview">
              <img 
                src={wallpaper.thumbnailUrl} 
                alt={wallpaper.title}
                className="current-image"
              />
              <div className="current-image-info">
                <p className="image-title">{wallpaper.title}</p>
                <p className="image-resolution">
                  {wallpaper.resolutions[0]?.width} × {wallpaper.resolutions[0]?.height}
                </p>
              </div>
            </div>
          </div>

          {/* 새 이미지 업로드 */}
          <div className="form-group">
            <label htmlFor="wallpaper-file">새 이미지 (선택사항)</label>
            <input
              id="wallpaper-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {previewUrl && (
              <div className="file-preview">
                <img src={previewUrl} alt="새 이미지 미리보기" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="remove-image-button"
                  disabled={isLoading}
                >
                  이미지 제거
                </button>
              </div>
            )}
          </div>

          {/* 해상도 선택 (새 이미지가 있을 때만) */}
          {selectedFile && (
            <div className="form-group">
              <label>해상도 선택 *</label>
              <div className="resolution-options">
                {PRESET_RESOLUTIONS.map((preset) => (
                  <label key={preset.name} className="resolution-radio">
                    <input
                      type="radio"
                      name="resolution"
                      value={preset.name}
                      checked={selectedResolution === preset.name}
                      onChange={(e) => handleResolutionChange(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="resolution-label">
                      {preset.name} ({preset.width}×{preset.height})
                    </span>
                  </label>
                ))}
                
                <label className="resolution-radio">
                  <input
                    type="radio"
                    name="resolution"
                    value="custom"
                    checked={selectedResolution === 'custom'}
                    onChange={(e) => handleResolutionChange(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="resolution-label">직접입력</span>
                </label>
              </div>
              
              {selectedResolution === 'custom' && (
                <div className="custom-resolution-inputs">
                  <input
                    type="number"
                    placeholder="너비"
                    value={customResolution.width}
                    onChange={(e) => setCustomResolution(prev => ({ ...prev, width: e.target.value }))}
                    disabled={isLoading}
                    min="1"
                    max="7680"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    placeholder="높이"
                    value={customResolution.height}
                    onChange={(e) => setCustomResolution(prev => ({ ...prev, height: e.target.value }))}
                    disabled={isLoading}
                    min="1"
                    max="4320"
                  />
                </div>
              )}

              <div className="selected-resolution-display">
                <span className="selected-label">선택된 해상도:</span>
                <span className="selected-resolution">
                  {selectedResolution === 'custom' 
                    ? (customResolution.width && customResolution.height 
                        ? `${customResolution.width}×${customResolution.height}` 
                        : '직접입력 (미완성)')
                    : (() => {
                        const preset = PRESET_RESOLUTIONS.find(p => p.name === selectedResolution)
                        return preset ? `${preset.name} (${preset.width}×${preset.height})` : selectedResolution
                      })()
                  }
                </span>
              </div>
            </div>
          )}

          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="배경화면 제목을 입력하세요"
              disabled={isLoading}
              required
            />
          </div>

          {/* 설명 */}
          <div className="form-group">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="배경화면에 대한 설명을 입력하세요"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* 태그 */}
          <div className="form-group">
            <label htmlFor="tags">태그</label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 자연, 풍경, 산)"
              disabled={isLoading}
            />
          </div>

          {/* 테마 */}
          <div className="form-group">
            <label htmlFor="theme">테마</label>
            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="general">일반</option>
              <option value="nature">자연</option>
              <option value="abstract">추상</option>
              <option value="minimal">미니멀</option>
              <option value="dark">다크</option>
              <option value="city">도시</option>
              <option value="space">우주</option>
            </select>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cancel-button"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="update-button"
            >
              {isLoading ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}