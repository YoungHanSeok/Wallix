/**
 * 구글 애드센스 광고 컴포넌트
 */

import { useEffect, useRef, useState } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adLayout?: string;
  adLayoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

// 전역 애드센스 타입 선언
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * 콜백 기능이 있는 AdSense 컴포넌트
 */
function AdSenseWithCallback({
  adSlot,
  adFormat = 'auto',
  adLayout,
  adLayoutKey,
  style = { display: 'block' },
  className = '',
  onEmpty
}: AdSenseProps & { onEmpty?: () => void }) {
  const adRef = useRef<HTMLModElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAd = () => {
      if (typeof window === 'undefined' || !adRef.current || isLoaded) {
        return;
      }

      const container = containerRef.current;
      if (container && container.offsetWidth === 0) {
        const retryCount = (container as any).retryCount || 0;
        if (retryCount < 10) {
          (container as any).retryCount = retryCount + 1;
          setTimeout(loadAd, 200);
        } else {
          console.warn('AdSense: 컨테이너 너비를 확인할 수 없어 광고 로드를 건너뜁니다.');
          onEmpty?.();
        }
        return;
      }

      const insElement = adRef.current;
      if (insElement.getAttribute('data-adsbygoogle-status')) {
        return;
      }

      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsLoaded(true);
          
          setTimeout(() => {
            const insElement = adRef.current;
            if (insElement && insElement.innerHTML.trim() !== '') {
              setHasContent(true);
            } else {
              onEmpty?.();
            }
          }, 1000);
        } else {
          console.warn('AdSense: adsbygoogle 스크립트가 로드되지 않았습니다.');
          onEmpty?.();
        }
      } catch (error) {
        console.error('AdSense 광고 로드 실패:', error);
        onEmpty?.();
      }
    };

    const timer = setTimeout(loadAd, 300);

    return () => {
      clearTimeout(timer);
      if (adRef.current) {
        const insElement = adRef.current;
        insElement.removeAttribute('data-adsbygoogle-status');
        insElement.innerHTML = '';
      }
    };
  }, [adSlot, isLoaded, onEmpty]);

  if (isLoaded && !hasContent) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className={`adsense-container ${className} ${!hasContent ? 'ad-loading' : ''}`} 
      style={{ 
        minHeight: hasContent ? '50px' : '0px', 
        minWidth: hasContent ? '300px' : '0px', 
        width: '100%',
        display: hasContent || !isLoaded ? 'flex' : 'none'
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ ...style, minWidth: '300px', minHeight: '50px' }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || "ca-pub-0000000000000000"}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-ad-layout-key={adLayoutKey}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdSense({
  adSlot,
  adFormat = 'auto',
  adLayout,
  adLayoutKey,
  style = { display: 'block' },
  className = ''
}: AdSenseProps) {
  return (
    <AdSenseWithCallback
      adSlot={adSlot}
      adFormat={adFormat}
      adLayout={adLayout}
      adLayoutKey={adLayoutKey}
      style={style}
      className={className}
    />
  );
}

/**
 * 반응형 배너 광고 컴포넌트 (상단/하단용)
 */
export function ResponsiveBannerAd({ adSlot, className }: { adSlot: string; className?: string }) {
  const [shouldRender, setShouldRender] = useState(true);
  
  const handleAdEmpty = () => {
    setShouldRender(false);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`responsive-banner-wrapper ${className || ''}`}>
      <AdSenseWithCallback
        adSlot={adSlot}
        adFormat="auto"
        className="responsive-banner-ad"
        onEmpty={handleAdEmpty}
        style={{ 
          display: 'block', 
          textAlign: 'center',
          maxWidth: '100%',
          height: 'auto',
          minHeight: '90px',
          maxHeight: '250px'
        }}
      />
    </div>
  );
}

/**
 * 사각형 광고 컴포넌트
 */
export function SquareAd({ adSlot, className }: { adSlot: string; className?: string }) {
  const [shouldRender, setShouldRender] = useState(true);
  
  const handleAdEmpty = () => {
    setShouldRender(false);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <AdSenseWithCallback
      adSlot={adSlot}
      adFormat="rectangle"
      className={className}
      onEmpty={handleAdEmpty}
      style={{ display: 'inline-block', width: '300px', height: '250px' }}
    />
  );
}

/**
 * 세로형 광고 컴포넌트
 */
export function VerticalAd({ adSlot, className }: { adSlot: string; className?: string }) {
  return (
    <AdSense
      adSlot={adSlot}
      adFormat="vertical"
      className={className}
      style={{ display: 'inline-block', width: '160px', height: '600px' }}
    />
  );
}

/**
 * AdSense 유틸리티 함수들
 */
export const AdSenseUtils = {
  /**
   * 페이지 전환 시 광고 정리
   */
  clearAds: () => {
    if (typeof window !== 'undefined') {
      const adElements = document.querySelectorAll('.adsbygoogle');
      adElements.forEach((element) => {
        element.removeAttribute('data-adsbygoogle-status');
        element.innerHTML = '';
      });
    }
  },

  /**
   * AdSense 스크립트 로드 상태 확인
   */
  isAdSenseLoaded: () => {
    return typeof window !== 'undefined' && window.adsbygoogle !== undefined;
  },

  /**
   * 광고 새로고침 (SPA에서 페이지 전환 시 사용)
   */
  refreshAds: () => {
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense 광고 새로고침 실패:', error);
      }
    }
  }
};

/**
 * React Router와 함께 사용할 수 있는 AdSense 훅
 */
export function useAdSense() {
  useEffect(() => {
    // 컴포넌트 언마운트 시 광고 정리
    return () => {
      AdSenseUtils.clearAds();
    };
  }, []);

  return {
    clearAds: AdSenseUtils.clearAds,
    refreshAds: AdSenseUtils.refreshAds,
    isLoaded: AdSenseUtils.isAdSenseLoaded()
  };
}