
import { useState, useEffect, useRef } from "react"; 
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedFileUrl?: string; 
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  translationTask?: {
    taskId: string;
    status: string;
    progress: number;
  } | null;
}



const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Simplified Chinese', label: 'Simplified Chinese' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Russian', label: 'Russian' }
];

const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedFileUrl, 
  selectedLanguage,
  onLanguageChange,
  translationTask
}: ResultsViewProps) => {
  const [imageLoading, setImageLoading] = useState(true); 
  const [imageError, setImageError] = useState(false); 
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (translatedFileUrl) {
      setImageLoading(true);
      setImageError(false);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
    }
  }, [translatedFileUrl]);

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
            aria-label="Go back"
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
            Back
          </button>
          <h1 className="text-2xl font-bold">Translation Result</h1>
          <div className="w-20"></div>
        </div>

        {errorMessage ? (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 text-center" role="alert">
            <p className="text-red-300">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Retry translation"
            >
              Retry
            </button>
          </div>
        ) : null}


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
                  file={translatedFileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center w-full overflow-auto" 
                  loading={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto my-4"></div>}
                  options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                  }}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={true} 
                  />
                </Document>
              )}
            </div>
            )

            {!imageLoading && !imageError && numPages && (
              <div className="p-4 bg-gray-700 flex justify-end items-center">
                <div className="text-sm text-gray-400">
                  Translated to: {getLanguageDisplayName(selectedLanguage)}
                </div>
              </div>
            )}
            <div className="p-4 flex justify-end items-center bg-gray-800">
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Target language"
              >
                {LANGUAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            }
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="Retake photo"
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
            Retake Photo
          </button>
        </div>

        {/* 展示上传API返回的结果信息 */}
        {translationTask && (
          <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-200">翻译任务信息</h3>
            {translatedFileUrl && (
              <div className="mb-3 p-2 bg-gray-700 rounded text-xs">
                <span className="text-gray-400">PDF URL:</span>
                <div className="text-green-400 break-all mt-1">{translatedFileUrl}</div>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">任务ID:</span>
                <span className="text-gray-200 font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                  {translationTask.taskId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">状态:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  translationTask.status === 'Completed' ? 'bg-green-600 text-green-100' :
                  translationTask.status === 'Processing' ? 'bg-blue-600 text-blue-100' :
                  translationTask.status === 'Analyzing' ? 'bg-yellow-600 text-yellow-100' :
                  translationTask.status === 'Waiting' ? 'bg-orange-600 text-orange-100' :
                  translationTask.status === 'Terminated' ? 'bg-red-600 text-red-100' :
                  translationTask.status === 'NotSupported' ? 'bg-gray-600 text-gray-100' :
                  'bg-gray-600 text-gray-100'
                }`}>
                  {translationTask.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">进度:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(translationTask.progress * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-200 text-xs">
                    {Math.round(translationTask.progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsView;