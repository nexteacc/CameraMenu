'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import CameraView from '../components/CameraView';
import ResultsView from '../components/ResultsView';
import LanguageSelector from '../components/LanguageSelector';
import AuroraBackground from '../components/AuroraBackground';

// 简化的应用状态
type AppState = 'idle' | 'active' | 'processing' | 'results';

export default function Home() {
  // 应用状态
  const [appState, setAppState] = useState<AppState>('idle');
  
  // 语言选择
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('English');
  
  // 翻译结果
  const [translatedImageUrl, setTranslatedImageUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 保存最后一次拍摄的图片用于重试
  const [lastCapturedImage, setLastCapturedImage] = useState<File | null>(null);
  
  // 认证
  const { getToken } = useAuth();
  
  /**
   * 返回首页
   */
  const handleExit = () => {
    setAppState('idle');
    setErrorMessage('');
    setTranslatedImageUrl('');
  };

  /**
   * 处理拍照/选择图片
   */
  const handleCapture = async (imageFile: File) => {
    try {
      // 保存图片用于重试
      setLastCapturedImage(imageFile);
      setErrorMessage('');
      setAppState('processing');
      
      // 获取认证 token
      const token = await getToken();
      
      // 构建请求数据
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('toLang', selectedTargetLanguage);

      console.log('发送翻译请求:', {
        toLang: selectedTargetLanguage,
        imageSize: imageFile.size,
        imageType: imageFile.type,
      });

      // 调用翻译 API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '翻译失败');
      }

      // 设置翻译结果
      setTranslatedImageUrl(result.imageDataUrl);
      setErrorMessage('');
      setAppState('results');
      
    } catch (error) {
      console.error('翻译处理错误:', error);
      setErrorMessage((error as Error).message || '处理图片时发生错误');
      setAppState('results');
    }
  };

  /**
   * 重试翻译
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
  
  /**
   * 启动相机
   */
  const handleCameraStart = () => {
    setAppState('active');
    setErrorMessage('');
    setTranslatedImageUrl('');
  };
  
  return (
    <AuroraBackground className="text-white">
      {/* 首页 - 语言选择和启动相机 */}
      {appState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-4xl font-bold mb-6 text-black dark:text-white">CameraMenu</h1>
          <div className="text-xl mb-8 max-w-md text-black dark:text-white text-left">
            <p>Travel, Scan Any Menu</p>
          </div>

          {/* 语言选择器 */}
          <div className="flex flex-col items-center mb-8 w-full max-w-md">
            <p className="mb-2 text-sm sm:text-base text-black dark:text-white">翻译为:</p>
            <LanguageSelector 
              selectedLanguage={selectedTargetLanguage} 
              onLanguageChange={handleTargetLanguageChange} 
              className="w-full text-base md:text-lg"
            />
          </div>
          
          {/* 启动相机按钮 */}
          <button
            onClick={handleCameraStart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
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
            Start Camera
          </button>
        </div>
      )}
      
      {/* 相机视图 */}
      {appState === 'active' && (
        <CameraView 
          onCapture={handleCapture} 
          onExit={handleExit} 
        />
      )}
      
      {/* 处理中状态 */}
      {appState === 'processing' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-400 border-r-transparent border-l-transparent mb-6"></div>
            <h2 className="text-2xl font-semibold mb-3 text-white">
              正在翻译菜单...
            </h2>
            <p className="text-emerald-200 text-lg">
              AI 正在识别并翻译图片中的文字
            </p>
            <p className="text-zinc-400 text-sm mt-4">
              这可能需要几秒钟，请稍候
            </p>
          </div>
        </div>
      )}
      
      {/* 结果视图 */}
      {appState === 'results' && (
        <ResultsView 
          errorMessage={errorMessage}
          translatedImageUrl={translatedImageUrl}
          onRetake={() => setAppState('active')}
          onBack={handleExit}
          onRetry={handleRetry}
        />
      )}
    </AuroraBackground>
  );
}
