/**
 * 프론트엔드 애플리케이션 진입점
 */

import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AppProvider } from './context'
import { AppRouter } from './router'
import { ErrorBoundary } from './components/ui'
import { AdSenseScript } from './components/ads'

function App() {
  // 앱 로드 시 즉시 제목 설정
  useEffect(() => {
    document.title = '배경화면 갤러리 - 고품질 무료 다운로드'
  }, [])

  return (
    <HelmetProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // 프로덕션 환경에서는 오류 로깅 서비스로 전송
          console.error('Application Error:', error, errorInfo)
        }}
      >
        <AdSenseScript />
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </ErrorBoundary>
    </HelmetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)