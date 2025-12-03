'use client';

import { useEffect, useRef } from 'react';

interface CameraViewProps {
  onCapture: (image: File) => Promise<void>;
  onExit: () => void;
  isLoading?: boolean;
}

/**
 * 相机视图组件
 * 使用 HTML input capture 调用系统原生相机（移动端）或文件选择器（桌面端）
 */
const CameraView = ({ onCapture, onExit, isLoading }: CameraViewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 组件挂载时自动触发一次相机/文件选择
  useEffect(() => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  }, [isLoading]);

  /**
   * 处理文件选择/拍照完成
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onCapture(file);
    }
    // 重置 input 以便可以再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 触发文件选择/相机
   */
  const triggerCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50 dark:bg-zinc-900">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* 主要内容区域 */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-zinc-800 dark:to-zinc-700 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-2xl border border-white/20">
        {/* 相机图标 */}
        <div className="mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-blue-500 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* 提示文字 */}
        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8 text-center px-6">
          如果没有自动弹出相机或相册，请点击下方按钮重新选择
        </p>

        {/* 拍照按钮 */}
        <button
          onClick={triggerCapture}
          disabled={isLoading}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>处理中...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
              <span>选择/拍摄照片</span>
            </>
          )}
        </button>

        {/* 或者从相册选择 */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
          移动端将自动打开相机
        </p>
      </div>

      {/* 返回按钮 */}
      <button
        onClick={onExit}
        disabled={isLoading}
        className="mt-8 px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
        <span>返回</span>
      </button>
    </div>
  );
};

export default CameraView;
