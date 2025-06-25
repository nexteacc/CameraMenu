
import { useState, useEffect, useRef } from "react"; 
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 配置PDF.js Worker - 移动端专用CDN配置确保兼容性
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedFileUrl?: string; // 保留但不使用，内部使用硬编码URL
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
  translationTask?: {
    taskId: string;
    status: string;
    progress: number;
  };
}

const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  selectedLanguage,
  onLanguageChange,
  translationTask,
}: ResultsViewProps) => {
  // 硬编码PDF URL用于测试
  const translatedFileUrl = "https://ai-trs.oss.simplifyai.cn/private/trsb-runner/translatorentitytask/5901c9bc-e99a-4548-9de4-b9a3d4ad8e94.pdf?OSSAccessKeyId=LTAI5tRiqSSi7zKGfT92Y3o3&Expires=1750848248&Signature=uKRZvK2JAkly5TvvpOc%2BFvkeFr4%3D";
  
  const [imageLoading, setImageLoading] = useState(true); 
  const [imageError, setImageError] = useState(false); 
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  

  
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // 移动端优化的PDF配置选项 - 确保原图质量
  const pdfOptions = {
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
    maxImageSize: -1, // 移除图片大小限制，保持原图质量
    disableFontFace: false,
    useSystemFonts: false,
  };

  // 智能计算最佳缩放比例 - 完全原图大小版本
  const calculateOptimalScale = (containerWidth: number) => {
    // 完全保持原图大小，就像浏览器原生PDF查看器
    return 1.0; // 始终保持原始大小，不做任何自动缩放
  };

  // 监听容器尺寸变化
  useEffect(() => {
    const updateContainerWidth = () => {
      if (pdfContainerRef.current) {
        const width = pdfContainerRef.current.clientWidth;
        setContainerWidth(width);
        const optimalScale = calculateOptimalScale(width);
        setScale(optimalScale);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // PDF获取和缓存逻辑 - 修复版本
  useEffect(() => {
    if (!translatedFileUrl) return;

    setImageLoading(true);
    setImageError(false);
    setNumPages(null);

    let currentBlobUrl: string | null = null;

    /**
     * 获取并缓存PDF文件
     */
    const fetchAndCachePdf = async () => {
      try {
        const response = await fetch(translatedFileUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;
        
        setPdfBlobUrl(blobUrl);
        
      } catch (error) {
        console.error("Failed to fetch and cache PDF:", error);
        setImageError(true);
        setImageLoading(false);
      }
    };

    fetchAndCachePdf();

    // 清理函数 - 使用局部变量避免闭包问题
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [translatedFileUrl]);

  useEffect(() => {
    if (pdfBlobUrl && containerWidth > 0) {
      const optimalScale = calculateOptimalScale(containerWidth);
      setScale(optimalScale);
    }
  }, [pdfBlobUrl, containerWidth]);

  /**
   * PDF文档加载成功回调
   */
  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    console.log('PDF loaded successfully, pages:', nextNumPages);
    setNumPages(nextNumPages);
    setImageLoading(false);
    setImageError(false);
  }

  /**
   * PDF文档加载失败回调
   */
  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setImageLoading(false);
    setImageError(true);
  }

  // 触摸和滚轮缩放事件处理
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


        {/* 错误信息显示 */}
        {errorMessage && (
          <div className="mb-6 bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-300 font-medium">错误信息</span>
            </div>
            <p className="text-red-200 mt-2">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
            >
              重试
            </button>
          </div>
        )}

        {/* PDF显示区域 */}
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
                className="relative w-full touch-manipulation" 
                style={{ 
                  touchAction: 'pan-y pinch-zoom',
                  minHeight: '100vh',
                  overflow: 'auto', // 确保可以滚动查看完整PDF
                  display: 'block' // 移除flex布局，让PDF自然显示
                }}
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
                          // 重新获取PDF，而不是触发整个应用重试
                          const hardcodedUrl = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
                          
                          const fetchPdf = async () => {
                            try {
                              const response = await fetch(hardcodedUrl);
                              if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                              }
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              setPdfBlobUrl(blobUrl);
                            } catch (error) {
                              console.error("Failed to reload PDF:", error);
                              setImageError(true);
                              setImageLoading(false);
                            }
                          };
                          
                          fetchPdf();
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
                    className="w-full" 
                    loading={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto my-4"></div>}
                    options={{
                      ...pdfOptions,
                      isEvalSupported: false,
                      disableAutoFetch: false,
                      disableStream: false,
                    }}
                  >
                    {/* 渲染所有页面 - 完全原图大小显示 */}
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page 
                        key={`page_${index + 1}`}
                        pageNumber={index + 1} 
                        scale={scale} // 使用动态缩放，支持用户手势缩放
                        renderTextLayer={false} 
                        renderAnnotationLayer={true}
                        className="mb-4 shadow-lg max-w-full" // 添加max-w-full确保响应式
                        // 不设置width，让PDF以原始尺寸显示
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