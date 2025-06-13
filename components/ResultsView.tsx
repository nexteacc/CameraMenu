import Image from "next/image";
import { useState } from "react";

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedImageUrl?: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

// 语言映射配置
const LANGUAGE_MAP: Record<string, string> = {
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'fr': '法语',
  'de': '德语',
  'es': '西班牙语',
  'ru': '俄语',
  'it': '意大利语',
  'pt': '葡萄牙语',
  'ar': '阿拉伯语',
  'hi': '印地语',
  'zh': '中文'
};

// 语言选项配置
const LANGUAGE_OPTIONS = [
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'es', label: '西班牙语' },
  { value: 'ru', label: '俄语' },
  { value: 'it', label: '意大利语' },
  { value: 'pt', label: '葡萄牙语' },
  { value: 'ar', label: '阿拉伯语' },
  { value: 'hi', label: '印地语' },
  { value: 'zh', label: '中文' }
];

const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedImageUrl,
  selectedLanguage,
  onLanguageChange
}: ResultsViewProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getLanguageDisplayName = (langCode: string): string => {
    return LANGUAGE_MAP[langCode] || langCode;
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

        {/* 显示翻译后的图片 */}
        {translatedImageUrl && (
          <div className="mb-8 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="relative w-full aspect-[4/3]">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-gray-300">加载中...</span>
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-300">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p>图片加载失败</p>
                    <button 
                      onClick={() => {
                        setImageError(false);
                        setImageLoading(true);
                      }}
                      className="mt-2 text-blue-400 hover:text-blue-300 underline"
                    >
                      重新加载
                    </button>
                  </div>
                </div>
              ) : (
                <Image 
                  src={translatedImageUrl} 
                  alt={`翻译为${getLanguageDisplayName(selectedLanguage)}的菜单图片`}
                  fill
                  className="object-contain"
                  unoptimized
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  priority
                />
              )}
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                已翻译为: {getLanguageDisplayName(selectedLanguage)}
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="选择目标语言"
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