'use client';

import { useState, useRef } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import ResultsView from '../components/ResultsView';
import LanguageSelector from '../components/LanguageSelector';
import UpdatePrompt from '../components/UpdatePrompt';
import BananaBackground from '../components/BananaBackground';
import useServiceWorkerUpdate from '../hooks/useServiceWorkerUpdate';

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
  const { hasUpdate, isRefreshing, refreshApp } = useServiceWorkerUpdate();
  
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
    <main className="banana-page text-white">
      {/* 背景图标网格 */}
      <BananaBackground />
      
      {/* 首页 - 选择功能 */}
      {appState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 pb-32 text-center relative">
          {/* 右上角用户按钮 */}
          <div className="absolute top-4 right-4 z-20">
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
          
          {/* Glass Card Container */}
          <div className="w-full max-w-md bg-amber-50/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-amber-200/50 p-8 flex flex-col items-center gap-8">
            <h1 className="text-4xl font-bold text-zinc-900 drop-shadow-sm">BananaFood</h1>

            <div className="flex flex-col items-center gap-6 w-full">
              {/* 语言选择器 */}
              <div className="flex flex-col items-center w-full">
                <p className="mb-2 text-sm font-medium text-zinc-700">To</p>
                <LanguageSelector 
                  selectedLanguage={selectedTargetLanguage} 
                  onLanguageChange={handleTargetLanguageChange} 
                  className="w-48 shadow-sm"
                />
              </div>
              
              {/* 功能按钮 */}
              <div className="flex items-center gap-8 mt-4">
                {/* 翻译菜单按钮 */}
                <div className="flex flex-col items-center gap-2">
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
                </div>
                
                {/* 识别食物按钮 */}
                <div className="flex flex-col items-center gap-2">
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
          
          {/* Glass Card Container */}
          <div className="w-full max-w-md bg-amber-50/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-amber-200/50 p-8 flex flex-col items-center">
            {/* 当前功能提示 */}
            <div className="mb-8 text-center">
              <p className="text-2xl font-bold text-zinc-900 mb-2">
                {mode === 'translate' ? 'Translate Menu' : 'Recognize Food'}
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200">
                <span className="text-sm font-medium text-zinc-600">
                  {mode === 'translate' 
                    ? `To: ${selectedTargetLanguage}` 
                    : `Label: ${selectedTargetLanguage}`}
                </span>
              </div>
            </div>
            
            {/* 拍照和相册按钮 */}
            <div className="flex gap-8 mb-8">
              {/* 拍照按钮 */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg shadow-blue-500/20 group"
                  aria-label="Take Photo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-9 w-9 text-white group-hover:scale-110 transition-transform"
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
              </div>
              
              {/* 相册按钮 */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-full transition-all hover:scale-105 flex items-center justify-center shadow-lg shadow-emerald-500/20 group"
                  aria-label="Choose from Gallery"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-9 w-9 text-white group-hover:scale-110 transition-transform"
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
            </div>
            
            {/* 返回按钮 */}
            <button
              onClick={handleBackToIdle}
              className="px-6 py-2 text-zinc-500 hover:text-zinc-800 font-medium transition-colors flex items-center gap-2"
              aria-label="Back"
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
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 处理中状态 */}
      {appState === 'processing' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-50">
          <div className="text-center bg-amber-50/80 backdrop-blur-xl rounded-3xl p-10 border border-amber-200/50 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-zinc-200 border-t-blue-500 border-b-emerald-500 mb-2"></div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                {mode === 'translate' ? 'Translating...' : 'Recognizing...'}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                Please wait...
              </p>
            </div>
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
      <UpdatePrompt open={hasUpdate} isRefreshing={isRefreshing} onReload={refreshApp} />
    </main>
  );
}
