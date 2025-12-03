'use client';

import { useState, useRef } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import ResultsView from '../components/ResultsView';
import LanguageSelector from '../components/LanguageSelector';
import AuroraBackground from '../components/AuroraBackground';

// 应用状态
type AppState = 'idle' | 'select-source' | 'processing' | 'results';
// 功能模式
type AppMode = 'translate' | 'recognize';

export default function Home() {
  // 应用状态
  const [appState, setAppState] = useState<AppState>('idle');
  // 功能模式
  const [mode, setMode] = useState<AppMode>('translate');
  
  // 语言选择
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('English');
  
  // 处理结果
  const [resultImageUrl, setResultImageUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 保存最后一次拍摄的图片用于重试
  const [lastCapturedImage, setLastCapturedImage] = useState<File | null>(null);
  
  // 认证
  const { getToken } = useAuth();
  
  // 文件输入引用
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * 返回首页
   */
  const handleExit = () => {
    setAppState('idle');
    setErrorMessage('');
    setResultImageUrl('');
  };
  
  /**
   * 返回功能选择
   */
  const handleBackToIdle = () => {
    setAppState('idle');
  };
  
  /**
   * 选择功能并进入来源选择页
   */
  const handleSelectMode = (selectedMode: AppMode) => {
    setMode(selectedMode);
    setAppState('select-source');
  };
  
  /**
   * 处理文件选择（拍照或相册）
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleCapture(file);
    }
    // 重置 input 以便可以再次选择同一文件
    event.target.value = '';
  };

  /**
   * 压缩图片
   */
  const compressImage = async (
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(`图片压缩完成: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
    });
  };

  /**
   * 处理拍照/选择图片
   */
  const handleCapture = async (imageFile: File) => {
    try {
      setLastCapturedImage(imageFile);
      setErrorMessage('');
      setAppState('processing');

      const [token, compressedImage] = await Promise.all([
        getToken(),
        compressImage(imageFile, 1920, 0.8),
      ]);

      const formData = new FormData();
      formData.append('image', compressedImage);
      formData.append('toLang', selectedTargetLanguage);

      // 根据模式选择 API
      const apiEndpoint = mode === 'translate' ? '/api/translate' : '/api/recognize';
      
      console.log(`发送${mode === 'translate' ? '翻译' : '识别'}请求:`, {
        mode,
        toLang: selectedTargetLanguage,
        originalSize: `${(imageFile.size / 1024).toFixed(1)}KB`,
        compressedSize: `${(compressedImage.size / 1024).toFixed(1)}KB`,
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setResultImageUrl(result.imageDataUrl);
      setErrorMessage('');
      setAppState('results');
      
    } catch (error) {
      console.error('处理错误:', error);
      setErrorMessage((error as Error).message || 'Error processing image');
      setAppState('results');
    }
  };

  /**
   * 重试
   */
  const handleRetry = async () => {
    if (lastCapturedImage) {
      await handleCapture(lastCapturedImage);
    }
  };
  
  /**
   * 处理目标语言切换
   */
  const handleTargetLanguageChange = (languageName: string) => {
    setSelectedTargetLanguage(languageName);
  };
  
  return (
    <AuroraBackground className="text-white">
      {/* 首页 - 选择功能 */}
      {appState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 pb-32 text-center relative">
          {/* 右上角用户按钮 */}
          <div className="absolute top-4 right-4">
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
          
          <h1 className="text-4xl font-bold mb-12 text-black dark:text-white">CameraMenu</h1>

          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* 语言选择器 */}
            <div className="flex flex-col items-center w-full">
              <p className="mb-2 text-sm text-black dark:text-white">To:</p>
              <LanguageSelector 
                selectedLanguage={selectedTargetLanguage} 
                onLanguageChange={handleTargetLanguageChange} 
                className="w-full max-w-xs"
              />
            </div>
            
            {/* 功能按钮 */}
            <div className="flex items-center gap-6 mt-4">
              {/* 翻译菜单按钮 */}
              <button
                onClick={() => handleSelectMode('translate')}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg"
                aria-label="Translate Menu"
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
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </button>
              
              {/* 识别食物按钮 */}
              <button
                onClick={() => handleSelectMode('recognize')}
                className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg"
                aria-label="Recognize Food"
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 选择来源页面 */}
      {appState === 'select-source' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 pb-32 text-center relative">
          {/* 隐藏的文件输入 */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* 当前功能提示 */}
          <div className="mb-12">
            <p className="text-lg text-black dark:text-white mb-2">
              {mode === 'translate' ? 'Translate Menu' : 'Recognize Food'}
            </p>
            <p className="text-sm text-zinc-500">
              {mode === 'translate' 
                ? `Translate to ${selectedTargetLanguage}` 
                : `Label in ${selectedTargetLanguage}`}
            </p>
          </div>
          
          {/* 拍照和相册按钮 */}
          <div className="flex items-center gap-8">
            {/* 拍照按钮 */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg"
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
              className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg"
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
          
          {/* 返回按钮 */}
          <button
            onClick={handleBackToIdle}
            className="mt-12 w-12 h-12 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full transition-colors flex items-center justify-center"
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
      )}
      
      {/* 处理中状态 */}
      {appState === 'processing' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 border-r-transparent border-l-transparent mb-6"></div>
            <h2 className="text-2xl font-semibold mb-3 text-white">
              {mode === 'translate' ? 'Translating...' : 'Recognizing...'}
            </h2>
            <p className="text-zinc-500 text-sm mt-4">
              Please wait...
            </p>
          </div>
        </div>
      )}
      
      {/* 结果视图 */}
      {appState === 'results' && (
        <ResultsView 
          errorMessage={errorMessage}
          translatedImageUrl={resultImageUrl}
          onRetake={() => setAppState('select-source')}
          onBack={handleExit}
          onRetry={handleRetry}
        />
      )}
    </AuroraBackground>
  );
}
