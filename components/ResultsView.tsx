'use client';

import React from 'react';

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedImageUrl: string;
}

/**
 * 翻译结果展示组件
 * 直接显示 Gemini 返回的 Base64 图片
 */
const ResultsView = ({
  onRetake,
  onBack,
  onRetry,
  errorMessage,
  translatedImageUrl,
}: ResultsViewProps) => {

  /**
   * 下载翻译后的图片
   */
  const handleDownload = () => {
    if (!translatedImageUrl) return;

    const link = document.createElement('a');
    link.href = translatedImageUrl;
    link.download = `translated-menu-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * 分享图片（移动端）
   */
  const handleShare = async () => {
    if (!translatedImageUrl || !navigator.share) return;

    try {
      // 将 Data URL 转换为 Blob
      const response = await fetch(translatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'translated-menu.png', { type: 'image/png' });

      await navigator.share({
        title: 'CameraMenu 翻译结果',
        text: '查看我翻译的菜单',
        files: [file],
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 检查是否支持分享功能
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-zinc-700 dark:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>
          
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">翻译结果</h1>
          
          <button
            onClick={onRetake}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新拍照
          </button>
        </div>

        {/* 错误信息 */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 dark:text-red-200 font-medium">翻译失败</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>重试</span>
            </button>
          </div>
        )}

        {/* 翻译结果图片 */}
        {translatedImageUrl && !errorMessage && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
            {/* 工具栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">翻译完成</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 分享按钮（仅移动端显示） */}
                {canShare && (
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>分享</span>
                  </button>
                )}

                {/* 下载按钮 */}
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>下载</span>
                </button>
              </div>
            </div>

            {/* 图片显示区域 */}
            <div className="p-4">
                <div className="flex justify-center">
                  <img
                  src={translatedImageUrl}
                    alt="翻译结果"
                  className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
                    style={{ maxHeight: '70vh' }}
                  onError={(e) => {
                    console.error('图片加载失败');
                    (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
            </div>

            {/* 底部操作区 */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onRetake}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>拍摄新照片</span>
                </button>

                <button
                  onClick={onRetry}
                  className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>重新翻译</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 无结果时的空状态 */}
        {!translatedImageUrl && !errorMessage && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">暂无翻译结果</p>
            <button
              onClick={onRetake}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              拍摄照片
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsView;
