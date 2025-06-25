
import { useState, useEffect, useRef } from "react"; 
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


// 配置PDF.js Worker - 移动端专用CDN配置确保兼容性
if (typeof window !== 'undefined') {
  // 直接使用4.8.69版本的CDN路径，避免版本变量解析问题
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedFileUrl?: string;
}





const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  // translatedFileUrl
}: ResultsViewProps) => {
  const translatedFileUrl = "https://ai-trs.oss.simplifyai.cn/private/trsb-runner/translatorentitytask/5901c9bc-e99a-4548-9de4-b9a3d4ad8e94.pdf?OSSAccessKeyId=LTAI5tRiqSSi7zKGfT92Y3o3&Expires=1750848248&Signature=uKRZvK2JAkly5TvvpOc%2BFvkeFr4%3D";
  const [imageLoading, setImageLoading] = useState(true); 
  const [imageError, setImageError] = useState(false); 
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // 移动端优化的PDF配置选项
  const pdfOptions = {
    // 使用CDN提供的cMaps，支持非拉丁字符
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
    // 使用CDN提供的标准字体
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
    // 移动端性能优化
    maxImageSize: 1024 * 1024, // 限制图片大小
    disableFontFace: false,
    useSystemFonts: false,
  };

  // 获取设备特征信息
  const getDeviceCharacteristics = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = isIOS || isAndroid;
    const pixelRatio = window.devicePixelRatio || 1;
    
    return { isIOS, isAndroid, isMobile, pixelRatio };
  };

  // 智能计算最佳缩放比例
  const calculateOptimalScale = (containerWidth: number) => {
    const { isMobile, pixelRatio } = getDeviceCharacteristics();
    let baseScale = 1.0;
    
    if (isMobile) {
      // 移动端：基于容器宽度动态计算
      baseScale = Math.min(containerWidth / 600, 0.9);
      
      // 高分辨率屏幕微调
      if (pixelRatio > 2) {
        baseScale *= 1.1;
      }
    } else {
      // 桌面端：保持原始大小或轻微缩放
      baseScale = containerWidth < 1024 ? 0.9 : 1.0;
    }
    
    return Math.max(0.5, Math.min(baseScale, 1.2));
  };

  // 监听容器尺寸变化，智能调整显示参数
  useEffect(() => {
    const updateContainerWidth = () => {
      if (pdfContainerRef.current) {
        const width = pdfContainerRef.current.clientWidth;
        setContainerWidth(width);
        
        // 使用智能缩放计算
        const optimalScale = calculateOptimalScale(width);
        setScale(optimalScale);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  useEffect(() => {
    if (!translatedFileUrl) return;

    setImageLoading(true);
    setImageError(false);
    setNumPages(null);

    const fetchAndCachePdf = async () => {
      try {
        const response = await fetch(translatedFileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (error) {
        console.error("Failed to fetch and cache PDF:", error);
        setImageError(true);
        setImageLoading(false);
      }
    };

    fetchAndCachePdf();

    // Cleanup function to revoke the blob URL
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [translatedFileUrl]);

   useEffect(() => {
    if (pdfBlobUrl && containerWidth > 0) {
      // 当新PDF加载时重置缩放比例
      const optimalScale = calculateOptimalScale(containerWidth);
      setScale(optimalScale);
    }
  }, [pdfBlobUrl, containerWidth]);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    console.log('PDF loaded successfully, pages:', nextNumPages);
    setNumPages(nextNumPages);
    setImageLoading(false);
    setImageError(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setImageLoading(false);
    setImageError(true);
  }


  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let currentScale = scale;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        currentScale = scale;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        if (initialDistance > 0) {
          const newScale = currentScale * (newDistance / initialDistance);
          setScale(Math.min(Math.max(newScale, 0.5), 3.0));
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const newScale = scale - event.deltaY * 0.002; 
      setScale(Math.min(Math.max(newScale, 0.5), 3.0));
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center mb-8">
          <h1 className="text-2xl font-bold">Translation Result</h1>
        </div>

        


        {!errorMessage && (
          <div className="mb-8 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            {!translatedFileUrl && (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Waiting for translation result...</p>
              </div>
            )}
            {translatedFileUrl && (
              <div 
              ref={pdfContainerRef} 
              className="relative w-full flex flex-col items-center touch-manipulation overflow-auto" 
              style={{ touchAction: 'pan-y pinch-zoom' }}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-gray-300">Loading...</span>
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-300 z-10">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p>File loading failed</p>
                    <button 
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                        
                        onRetry(); 
                      }}
                      className="mt-2 text-blue-400 hover:text-blue-300 underline"
                    >
                      Reload
                    </button>
                  </div>
                </div>
              ) : (
                <Document
                  file={pdfBlobUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center w-full overflow-auto" 
                  loading={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto my-4"></div>}
                  options={{
                    ...pdfOptions, // 使用移动端优化配置
                    isEvalSupported: false,
                    disableAutoFetch: false,
                    disableStream: false,
                  }}
                >
                  {/* 渲染所有页面 */}
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page 
                      key={`page_${index + 1}`}
                      pageNumber={index + 1} 
                      scale={scale} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={true}
                      width={containerWidth > 0 ? Math.min(containerWidth - 40, 800) : undefined}
                      className="mb-4 shadow-lg"
                    />
                  ))}
                </Document>
              )}
            </div>
            )}


          </div>
        )}

        


      </div>
    </div>
  );
};

export default ResultsView;