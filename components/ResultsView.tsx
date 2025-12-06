'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import FoodListDrawer from './FoodListDrawer';

interface ResultsViewProps {
  onRetake: () => void;
  onBack: () => void;
  onRetry: () => void;
  errorMessage: string;
  translatedImageUrl: string;
  foodList: string[];
}

/**
 * 结果展示组件 - 全屏沉浸式布局
 * 点击图片显示/隐藏操作按钮
 */
const ResultsView = ({
  onBack,
  onRetry,
  errorMessage,
  translatedImageUrl,
  foodList,
}: ResultsViewProps) => {
  // 控制操作按钮的显示/隐藏
  const [showActions, setShowActions] = useState(false);
  // 控制图片加载错误状态
  const [hasError, setHasError] = useState(false);
  // 记录图片宽高比，用于自适应高度
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  // 当图片 URL 变化时重置错误状态
  useEffect(() => {
    setHasError(false);
    setImageRatio(null);
  }, [translatedImageUrl]);

  /**
   * 下载图片
   */
  const handleDownload = () => {
    if (!translatedImageUrl) return;

    const link = document.createElement('a');
    link.href = translatedImageUrl;
    link.download = `result-${Date.now()}.png`;
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
      const response = await fetch(translatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'result.png', { type: 'image/png' });

      await navigator.share({
        title: 'BananaFood Result',
        text: 'Check out my result',
        files: [file],
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  /**
   * 点击图片切换操作按钮显示状态
   */
  const handleImageClick = () => {
    setShowActions(!showActions);
  };

  // 检查是否支持分享/需要隐藏下载
  const isClient = typeof navigator !== 'undefined';
  const canShareApi = isClient && typeof navigator.share === 'function';
  const isMobileDevice = isClient && /iPhone|iPad|Android/i.test(navigator.userAgent);
  const shouldUseSystemSave = isMobileDevice && canShareApi;
  const canShare = canShareApi;
  const displayFoodList = foodList && foodList.length > 0
    ? foodList
    : ['coconut', 'bread', 'chocolate', 'almond', 'raisin'];
  const handleFoodSelect = (name: string) => {
    // 占位交互：后续可接入科普请求
    alert(`即将提供科普：${name}`);
  };

  // 错误状态 - 显示错误信息和重试按钮（毛玻璃效果）
  if (errorMessage) {
    return (
      <div style={{ position: 'fixed' }} className="inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col">
        {/* 右上角关闭按钮 */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onBack}
            className="p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 错误内容居中显示 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-zinc-900/80 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Failed</h3>
            <p className="text-zinc-400 text-sm mb-6">{errorMessage}</p>
            <button
              onClick={onRetry}
              className="w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 成功状态 - 全屏沉浸式图片展示（毛玻璃效果）
  if (translatedImageUrl) {
    return (
      <div style={{ position: 'fixed' }} className="inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col">
        {/* 右上角关闭按钮 */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onBack}
            className="p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 顶部提示文字 - 放在图片容器之外，避免遮挡；点击后淡出 */}
        <div 
          className={`absolute top-10 left-0 right-0 text-center transition-all duration-300 pointer-events-none ${
            showActions 
              ? 'opacity-0' 
              : 'opacity-70'
          }`}
        >
          <p className="text-amber-300 text-sm drop-shadow">Tap image for options</p>
        </div>

        {/* 图片展示区域 - 点击切换操作按钮 */}
        <div 
          className="flex-1 flex items-center justify-center p-6 cursor-pointer"
          onClick={handleImageClick}
        >
          <div className="flex flex-col items-center">
            <div
              className="relative w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden"
              style={{ aspectRatio: imageRatio ? `${imageRatio} / 1` : '3 / 4' }}
            >
              {!hasError && (
                <Image
                  src={translatedImageUrl}
                  alt="Result"
                  fill
                  className="object-contain rounded-2xl shadow-2xl"
                  unoptimized
                  onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                    if (naturalWidth && naturalHeight) {
                      setImageRatio(naturalWidth / naturalHeight);
                    }
                  }}
                  onError={() => {
                    console.error('Image load failed');
                    setHasError(true);
                  }}
                />
              )}
            </div>
            
            {/* 重试按钮 - 始终显示 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry</span>
            </button>
          </div>
        </div>

        {/* 右下角操作按钮 - 点击图片后显示/隐藏 */}
        <div 
          className={`absolute bottom-8 right-6 flex items-center space-x-3 transition-all duration-300 ${
            showActions 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* 分享按钮（仅移动端支持时显示） */}
          {canShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-3.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
              aria-label="Share"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

          {/* 下载按钮（桌面/不支持系统保存时显示） */}
          {!shouldUseSystemSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-3.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              aria-label="Download"
              title="下载图片"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
        </div>

        {/* 右侧食物列表抽屉 - 点击图片后显示/隐藏 */}
        <FoodListDrawer
          foodList={displayFoodList}
          open={showActions}
          onSelect={handleFoodSelect}
        />
      </div>
    );
  }

  // 空状态 - 无结果（毛玻璃效果）
  return (
    <div style={{ position: 'fixed' }} className="inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col">
      {/* 右上角关闭按钮 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onBack}
          className="p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 空状态内容 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-zinc-500">No result</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
