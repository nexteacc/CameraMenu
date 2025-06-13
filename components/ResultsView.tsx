
import { useState, useEffect } from "react"; // 确保导入 useEffect
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 配置 PDF.js worker
// 您需要将 'pdf.worker.min.js' 文件从 'pdfjs-dist/build' 复制到您的 public 文件夹下
// 或者使用 CDN
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedFileUrl?: string; // 修改为 translatedFileUrl
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}



const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Simplified Chinese', label: 'Simplified Chinese' }
];

const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedFileUrl, // 修改变量名
  selectedLanguage,
  onLanguageChange
}: ResultsViewProps) => {
  const [imageLoading, setImageLoading] = useState(true); // 可以复用，表示PDF加载
  const [imageError, setImageError] = useState(false); // 可以复用，表示PDF加载错误
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const pdfContainerRef = useRef<HTMLDivElement>(null); // Ref for the PDF container

  // Reset state when translatedFileUrl changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    setNumPages(null);
    setPageNumber(1);
    setScale(1.0); // Reset zoom
  }, [translatedFileUrl]);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    setNumPages(nextNumPages);
    setImageLoading(false);
    setImageError(false);
  }

  function onDocumentLoadError() {
    setImageLoading(false);
    setImageError(true);
  }

  // Effect for handling touch and wheel zoom
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let currentScale = scale; // Use a mutable variable for current scale within handlers

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        currentScale = scale; // Capture the scale at the start of the gesture
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
      // Adjust sensitivity; negative deltaY for zoom in (scroll up/forward)
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
  }, [scale]); // Re-run if scale changes from outside, or to ensure currentScale is fresh for touch start


  // selectedLanguage prop is now the display name itself
  const getLanguageDisplayName = (languageName: string): string => {
    return languageName;
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
            aria-label="返回上一页"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回
          </button>
          <h1 className="text-2xl font-bold">翻译结果</h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        {errorMessage ? (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 text-center" role="alert">
            <p className="text-red-300">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="重新尝试翻译"
            >
              重试
            </button>
          </div>
        ) : null}

        {/* 显示翻译后的文件 (PDF) */}
        {translatedFileUrl && !errorMessage && (
          <div className="mb-8 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            {/* PDF Container with ref for touch/wheel events */}
            <div 
              ref={pdfContainerRef} 
              className="relative w-full flex flex-col items-center touch-manipulation overflow-auto" 
              style={{ touchAction: 'pan-y pinch-zoom' }} // Crucial for enabling native-like pinch-zoom and vertical pan
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-gray-300">加载中...</span>
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-300 z-10">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p>文件加载失败</p>
                    <button 
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                        // 触发重新加载，可能需要父组件配合或重新设置 translatedFileUrl
                        onRetry(); // 或者一个专门的重载函数
                      }}
                      className="mt-2 text-blue-400 hover:text-blue-300 underline"
                    >
                      重新加载
                    </button>
                  </div>
                </div>
              ) : (
                <Document
                  file={translatedFileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center w-full overflow-auto" // 允许PDF内容滚动
                  loading={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto my-4"></div>} // Document自身的loading
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false} // 提高性能，如果不需要文本选择
                    renderAnnotationLayer={true} // 通常需要
                  />
                </Document>
              )}
            </div>
            {/* Footer with language info, zoom buttons removed */}
            {!imageLoading && !imageError && numPages && (
              <div className="p-4 bg-gray-700 flex justify-end items-center">
                <div className="text-sm text-gray-400">
                  已翻译为: {getLanguageDisplayName(selectedLanguage)}
                </div>
                {/* Optional: Display current scale for debugging 
                <span className="text-sm text-gray-300 ml-4">Zoom: {Math.round(scale * 100)}%</span> 
                */}
              </div>
            )}
            <div className="p-4 flex justify-end items-center bg-gray-800">
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="目标语言"
              >
                {LANGUAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="重新拍照"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            重新拍照
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;