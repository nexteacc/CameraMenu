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

const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedImageUrl,
  selectedLanguage,
  onLanguageChange
}: ResultsViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
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
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-300">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              重试
            </button>
          </div>
        ) : null}

        {/* 显示翻译后的图片 */}
        {translatedImageUrl && (
          <div className="mb-8 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <img 
              src={translatedImageUrl} 
              alt="Translated Menu" 
              className="w-full h-auto"
            />
            <div className="p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                已翻译为: {selectedLanguage === 'en' ? '英语' : 
                          selectedLanguage === 'ja' ? '日语' : 
                          selectedLanguage === 'ko' ? '韩语' : 
                          selectedLanguage === 'fr' ? '法语' : 
                          selectedLanguage === 'de' ? '德语' : 
                          selectedLanguage === 'es' ? '西班牙语' : 
                          selectedLanguage === 'ru' ? '俄语' : 
                          selectedLanguage === 'it' ? '意大利语' : 
                          selectedLanguage === 'pt' ? '葡萄牙语' : 
                          selectedLanguage === 'ar' ? '阿拉伯语' : 
                          selectedLanguage === 'hi' ? '印地语' : 
                          selectedLanguage === 'zh' ? '中文' : 
                          selectedLanguage}
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
                <option value="fr">法语</option>
                <option value="de">德语</option>
                <option value="es">西班牙语</option>
                <option value="ru">俄语</option>
                <option value="it">意大利语</option>
                <option value="pt">葡萄牙语</option>
                <option value="ar">阿拉伯语</option>
                <option value="hi">印地语</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
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