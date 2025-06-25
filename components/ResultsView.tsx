
import { useState, useEffect, useRef, useCallback } from "react"; 
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 配置PDF.js Worker - 移动端专用CDN配置确保兼容性
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

// 翻译状态类型定义
type TranslationStatus = 
  | 'Analyzing'     // Initial analysis phase
  | 'Waiting'       // Waiting in queue
  | 'Processing'    // Active translation
  | 'Completed'     // Successfully completed
  | 'Terminated'    // Failed/terminated
  | 'NotSupported'; // Unsupported content

interface TranslationTask {
  taskId: string;
  status: TranslationStatus;
  progress: number;
}

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
  translationTask?: TranslationTask | null;
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
  const HARDCODED_PDF_URL = "https://ai-trs.oss.simplifyai.cn/private/trsb-runner/translatorentitytask/5901c9bc-e99a-4548-9de4-b9a3d4ad8e94.pdf?OSSAccessKeyId=LTAI5tRiqSSi7zKGfT92Y3o3&Expires=1750848248&Signature=uKRZvK2JAkly5TvvpOc%2BFvkeFr4%3D";
  
  const [imageLoading, setImageLoading] = useState(true); 
  const [imageError, setImageError] = useState(false); 
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(0);
  
  // 分离两个不同的 ref
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true); // 组件挂载状态追踪
  
  // 组件挂载状态管理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 安全的状态更新函数
  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  // 组件卸载时的全局清理 - 增强版
  useEffect(() => {
    return () => {
      // 清理所有可能的blob URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      isMountedRef.current = false;
    };
  }, [pdfBlobUrl]);

  // 移动端优化的PDF配置选项 - 确保原图质量
  const pdfOptions = {
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
    maxImageSize: -1, // 移除图片大小限制，保持原图质量
    disableFontFace: false,
    useSystemFonts: false,
  };

  /**
   * 智能计算最佳缩放比例 - 自适应屏幕大小
   */
  const calculateOptimalScale = useCallback((containerWidth: number, pageWidth?: number) => {
    if (!pageWidth || containerWidth <= 0) return 1.0;
    
    const margin = 32;
    const availableWidth = containerWidth - margin;
    const scale = availableWidth / pageWidth;
    
    return Math.min(Math.max(scale, 0.3), 2.0);
  }, []);

  // 监听容器尺寸变化 - 修复版
  useEffect(() => {
    const updateContainerWidth = () => {
      if (outerContainerRef.current && isMountedRef.current) {
        const width = outerContainerRef.current.clientWidth;
        safeSetState(() => {
          setContainerWidth(width);
          const optimalScale = calculateOptimalScale(width, pageWidth);
          setScale(optimalScale);
        });
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [pageWidth, calculateOptimalScale, safeSetState]);

  // PDF获取和缓存逻辑 - 使用硬编码URL
  useEffect(() => {
    safeSetState(() => {
      setImageLoading(true);
      setImageError(false);
      setNumPages(null);
    });

    let currentBlobUrl: string | null = null;
    let abortController = new AbortController();

    const fetchAndCachePdf = async () => {
      try {
        const response = await fetch(HARDCODED_PDF_URL, {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }
        
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;
        
        safeSetState(() => {
          setPdfBlobUrl(blobUrl);
        });
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        
        console.error("Failed to fetch and cache PDF:", error);
        safeSetState(() => {
          setImageError(true);
          setImageLoading(false);
        });
      }
    };

    fetchAndCachePdf();

    return () => {
      abortController.abort();
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [safeSetState]);

  // 自适应缩放效果
  useEffect(() => {
    if (pdfBlobUrl && containerWidth > 0 && pageWidth > 0 && isMountedRef.current) {
      const optimalScale = calculateOptimalScale(containerWidth, pageWidth);
      setScale(optimalScale);
    }
  }, [pdfBlobUrl, containerWidth, pageWidth, calculateOptimalScale]);

  // PDF回调函数 - 安全版本
  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    console.log('PDF loaded successfully, pages:', nextNumPages);
    safeSetState(() => {
      setNumPages(nextNumPages);
      setImageLoading(false);
      setImageError(false);
    });
  }, [safeSetState]);

  const onPageLoadSuccess = useCallback((page: any) => {
    if (page && page.width && !pageWidth && isMountedRef.current) {
      console.log('Page loaded, width:', page.width);
      safeSetState(() => {
        setPageWidth(page.width);
      });
    }
  }, [pageWidth, safeSetState]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    safeSetState(() => {
      setImageLoading(false);
      setImageError(true);
    });
  }, [safeSetState]);

  // 触摸和滚轮缩放支持 - 修复版本
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;
    let isZooming = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      safeSetState(() => {
        setScale(prevScale => {
          const newScale = prevScale + delta;
          return Math.min(Math.max(newScale, 0.3), 3.0);
        });
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isZooming = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = scale; // 直接使用当前scale值
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isZooming) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (initialDistance > 0) {
          const scaleChange = currentDistance / initialDistance;
          const newScale = initialScale * scaleChange;
          safeSetState(() => {
            setScale(Math.min(Math.max(newScale, 0.3), 3.0));
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isZooming = false;
        initialDistance = 0;
        initialScale = 1;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, safeSetState]);

  // 安全的重新加载函数
  const handleReload = useCallback(() => {
    safeSetState(() => {
      setImageError(false);
      setImageLoading(true);
    });
    
    // 清理旧的 blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    
    const fetchPdf = async () => {
      try {
        const response = await fetch(HARDCODED_PDF_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        
        if (!isMountedRef.current) return;
        
        const blobUrl = URL.createObjectURL(blob);
        safeSetState(() => {
          setPdfBlobUrl(blobUrl);
        });
      } catch (error) {
        console.error("Failed to reload PDF:", error);
        safeSetState(() => {
          setImageError(true);
          setImageLoading(false);
        });
      }
    };
    
    fetchPdf();
  }, [pdfBlobUrl, safeSetState]);

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
            {imageLoading && !pdfBlobUrl && (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading PDF...</p>
              </div>
            )}
            {pdfBlobUrl && (
              <div 
                ref={outerContainerRef} 
                className="relative w-full touch-manipulation" 
                style={{ 
                  touchAction: 'pan-y pinch-zoom',
                  minHeight: '100vh',
                  overflow: 'auto',
                  display: 'block'
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
                        onClick={handleReload}
                        className="mt-2 text-blue-400 hover:text-blue-300 underline"
                      >
                        Reload
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">PDF预览</h3>
                      
                      {/* 缩放控制区域 */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setScale(prev => Math.max(prev - 0.2, 0.3))}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="缩小"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <span className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
                          {Math.round(scale * 100)}%
                        </span>
                        
                        <button
                          onClick={() => setScale(prev => Math.min(prev + 0.2, 3.0))}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="放大"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (containerWidth > 0 && pageWidth > 0) {
                              const optimalScale = calculateOptimalScale(containerWidth, pageWidth);
                              setScale(optimalScale);
                            }
                          }}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
                          title="适应屏幕"
                        >
                          适应
                        </button>
                      </div>
                    </div>
                    
                    <div 
                       ref={pdfContainerRef}
                       className="relative overflow-auto" 
                       style={{ 
                         height: '70vh',
                         touchAction: 'none'
                       }}
                     >
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
                        {Array.from(new Array(numPages), (el, index) => (
                          <Page 
                            key={`page_${index + 1}`}
                            pageNumber={index + 1} 
                            scale={scale}
                            onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                            renderTextLayer={false} 
                            renderAnnotationLayer={true}
                            className="mb-4 shadow-lg mx-auto"
                          />
                        ))}
                      </Document>
                    </div>
                  </div>
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