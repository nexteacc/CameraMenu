'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import CameraView from '../components/CameraView';
import ResultsView from '../components/ResultsView';
import LanguageSelector from '../components/LanguageSelector';
import AuroraBackground from '../components/AuroraBackground';

interface TranslationTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export default function Home() {
  // 状态管理
  const [cameraState, setCameraState] = useState<'idle' | 'active' | 'processing' | 'results'>('idle');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('English'); // Default to English name
  const [selectedFromLanguage, setSelectedFromLanguage] = useState<string>('Simplified Chinese'); // Default to Simplified Chinese name
  const [translationTask, setTranslationTask] = useState<TranslationTask | null>(null);
  // const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [translatedImageUrl, setTranslatedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastCapturedImage, setLastCapturedImage] = useState<Blob | null>(null);
  
  // Auth
  const { getToken } = useAuth();
  
  // 轮询计时器引用
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 处理退出相机
  const handleExit = () => {
    setCameraState('idle');
    setErrorMessage('');
    
    // 清除轮询计时器
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };
  
  // 处理拍照
  const handleCapture = async (imageBlob: Blob) => {
    try {
      // 保存拍摄的图片以便重试
      setLastCapturedImage(imageBlob);
      
      // 设置状态为处理中
      setCameraState('processing');
      setErrorMessage('');
      
      // 获取用户Token
      const token = await getToken();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('fromLang', selectedFromLanguage); // Add fromLang
      formData.append('targetLang', selectedTargetLanguage);
      formData.append('userId', 'user123'); // 临时用户ID
      
      // 调用上传API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }
      
      const resultData = await response.json(); // Expect { taskId: string, status: string }
      

      setTranslationTask({
        taskId: resultData.taskId,
        status: resultData.status as 'pending' | 'processing' | 'completed' | 'failed', // Cast status to be more specific
        progress: 0 // Initialize progress
      });
      

      // /api/upload (fastCreation:true) 只返回taskId和初始status
      // 总是启动轮询获取最终结果和translatedImageUrl
      if (resultData.taskId) {
        pollTranslationResult(resultData.taskId);
      } else {
        // 处理未能获取taskId的错误情况
        console.error('Failed to get task ID from /api/upload');
        setErrorMessage('无法启动翻译任务，请重试。');
        setCameraState('results');
        // 清除可能存在的轮询计时器，以防万一
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
      
    } catch (error) {
      console.error('拍照处理错误:', error);
      setErrorMessage((error as Error).message || '处理图片时出错');
      setCameraState('results');
      // 清除可能存在的轮询计时器
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }
  };
  
  // 轮询翻译结果
  const pollTranslationResult = async (taskId: string) => {
    // 清除之前的计时器
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null; // 确保引用也被清除
    }
    
    // 设置轮询间隔
    const pollInterval = 2000; // 2秒
    let pollCount = 0;
    const maxPolls = 30; // 增加最大轮询次数以适应更长的翻译时间
    
    pollingTimerRef.current = setInterval(async () => {
      try {
        pollCount++;
        
        // 获取用户Token
        const token = await getToken();
        
        // 调用任务状态API
        const response = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // 如果响应不成功，也视为轮询失败
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '获取任务状态失败，且无法解析错误响应' }));
          // 清除轮询计时器
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setErrorMessage(errorData.error || '获取任务状态失败');
          setCameraState('results');
          return; // 提前退出，不再继续
        }
        
        const resultData = await response.json();
        
        // 更新任务状态
        setTranslationTask({
          taskId: resultData.taskId,
          status: resultData.status,
          progress: resultData.progress || 0
        });
        
        // 如果任务完成或失败
        if (resultData.status === 'completed' || resultData.status === 'failed') {
          // 清除轮询计时器
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          
          if (resultData.status === 'completed') {
            // 设置翻译后的图片URL
            setTranslatedImageUrl(resultData.translatedFileUrl);
            setErrorMessage(''); // 清除之前的错误信息（如果有）
          } else {
            // 设置错误信息
            setErrorMessage(resultData.error || '翻译失败');
          }
          
          // 切换到结果视图
          setCameraState('results');
        }
        
        // 如果达到最大轮询次数且任务仍未完成/失败
        if (pollCount >= maxPolls && (resultData.status !== 'completed' && resultData.status !== 'failed')) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setErrorMessage('翻译超时，请稍后重试');
          setCameraState('results');
        }
        
      } catch (error) {
        console.error('轮询错误:', error);
        
        // 清除轮询计时器
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        
        setErrorMessage((error as Error).message || '获取翻译结果时出错');
        setCameraState('results');
      }
    }, pollInterval);
  };
  
  // 处理重试
  const handleRetry = async () => {
    try {
      // 检查是否有上一次拍摄的图片
      if (!lastCapturedImage) {
        throw new Error('没有可重试的图片');
      }
      
      // 设置状态为处理中
      setCameraState('processing');
      setErrorMessage('');
      
      // 获取用户Token
      const token = await getToken();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('image', lastCapturedImage);
      formData.append('fromLang', selectedFromLanguage); // Add fromLang
      formData.append('targetLang', selectedTargetLanguage);
      formData.append('userId', 'user123'); // 临时用户ID
      
      // 调用上传API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重试上传失败');
      }
      
      const resultData = await response.json();
      
      // 更新任务状态
      setTranslationTask({
        taskId: resultData.taskId,
        status: resultData.status,
        progress: resultData.progress || 0
      });
      
      // setCurrentTaskId(resultData.taskId);
      
      // 如果任务已完成，直接显示结果
      if (resultData.status === 'completed') {
        setTranslatedImageUrl(resultData.translatedImageUrl);
        setCameraState('results');
      } else {
        // 否则开始轮询任务状态
        pollTranslationResult(resultData.taskId);
      }
      
    } catch (error) {
      console.error('重试错误:', error);
      setErrorMessage((error as Error).message || '重试时出错');
      setCameraState('results');
    }
  };
  
  // 处理源语言变更
  const handleFromLanguageChange = (languageName: string) => {
    setSelectedFromLanguage(languageName);
    // Optionally, trigger retry if in results state and image exists
    if (cameraState === 'results' && lastCapturedImage) {
      handleRetry();
    }
  };

  // 处理目标语言变更
  const handleTargetLanguageChange = (languageName: string) => {
    setSelectedTargetLanguage(languageName);
    
    // 如果在结果页面更改语言，自动重试翻译
    if (cameraState === 'results' && lastCapturedImage) {
      handleRetry();
    }
  };
  
  // 处理开始相机
  const handleCameraStart = () => {
    setCameraState('active');
    setErrorMessage('');
  };
  
  return (
    <AuroraBackground className="text-white">
      {cameraState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-4xl font-bold mb-6 text-black dark:text-white">菜单翻译</h1>
          <p className="text-xl mb-8 max-w-md text-black dark:text-white">
            拍摄菜单照片，获取即时翻译。支持多种语言，让您在国外用餐无障碍。
          </p>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 mb-8 w-full max-w-3xl">
            <div className="flex-1 flex flex-col items-center md:items-start w-full">
              <p className="mb-2 text-black dark:text-white">从 (源语言):</p>
              <LanguageSelector 
                selectedLanguage={selectedFromLanguage} 
                onLanguageChange={handleFromLanguageChange} 
                label="选择源语言"
                className="w-full max-w-xs md:max-w-none"
              />
            </div>
            
            <div className="text-2xl text-black dark:text-white mx-2 hidden md:flex items-center self-center">→</div>
            {/* Show arrow on medium screens and up, centered */}
            <div className="block md:hidden text-2xl text-black dark:text-white my-2 self-center">↓</div> 
            {/* Show down arrow on small screens, centered */}

            <div className="flex-1 flex flex-col items-center md:items-start w-full">
              <p className="mb-2 text-black dark:text-white">到 (目标语言):</p>
              <LanguageSelector 
                selectedLanguage={selectedTargetLanguage} 
                onLanguageChange={handleTargetLanguageChange} 
                label="选择目标语言"
                className="w-full max-w-xs md:max-w-none"
              />
            </div>
          </div>
          
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
            开始拍照
          </button>
        </div>
      )}
      
      {cameraState === 'active' && (
        <CameraView 
          onCapture={handleCapture} 
          onExit={handleExit} 
        />
      )}
      
      {cameraState === 'processing' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-400 border-r-transparent border-l-transparent mb-6"></div>
            <h2 className="text-2xl font-semibold mb-3 text-white">正在处理...</h2>
            <p className="text-emerald-200 text-lg">
              {translationTask ? `进度: ${Math.round(translationTask.progress * 100)}%` : '准备中...'}
            </p>
          </div>
        </div>
      )}
      
      {cameraState === 'results' && (
        <ResultsView 
          translatedImageUrl={translatedImageUrl || undefined}
          errorMessage={errorMessage}
          selectedLanguage={selectedTargetLanguage} // 使用已定义的目标语言状态
          onRetake={() => setCameraState('active')}
          onBack={handleExit}
          onRetry={handleRetry}
          onLanguageChange={handleTargetLanguageChange} // 使用已定义的目标语言处理函数
        />
      )}
    </AuroraBackground>
  );
}