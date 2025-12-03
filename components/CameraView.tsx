'use client';

import { useRef } from 'react';

interface CameraViewProps {
  onCapture: (image: File) => Promise<void>;
  onExit: () => void;
  isLoading?: boolean;
}

/**
 * 相机视图组件
 * 提供拍照和从相册选取两种方式
 */
const CameraView = ({ onCapture, onExit, isLoading }: CameraViewProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择/拍照完成
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onCapture(file);
    }
    // 重置 input 以便可以再次选择同一文件
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white dark:bg-zinc-800">
      {/* 隐藏的文件输入 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* 主要内容区域 */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-zinc-800 dark:to-zinc-700 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-2xl border border-white/20">
        {isLoading ? (
          // 加载状态
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-zinc-500">Processing...</p>
          </div>
        ) : (
          <>
            {/* 相机图标 */}
            <div className="mb-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-blue-600"
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

            {/* 拍照和相册按钮 */}
            <div className="flex items-center gap-10">
              {/* 拍照按钮 */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg disabled:cursor-not-allowed"
                aria-label="Take Photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
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
              </button>
              
              {/* 相册按钮 */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isLoading}
                className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg disabled:cursor-not-allowed"
                aria-label="Choose from Gallery"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 返回按钮 */}
      <button
        onClick={onExit}
        disabled={isLoading}
        className="mt-8 w-12 h-12 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label="Back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-zinc-800 dark:text-white"
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
      </button>
    </div>
  );
};

export default CameraView;
