'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import CameraView from '../components/CameraView';
import ResultsView from '../components/ResultsView';
import LanguageSelector from '../components/LanguageSelector';
import AuroraBackground from '../components/AuroraBackground';

// Simplified status mapping based on actual API states
type TranslationStatus = 
  | 'Analyzing'     // Initial analysis phase
  | 'Waiting'       // Waiting in queue
  | 'Processing'    // Active translation
  | 'Completed'     // Successfully completed
  | 'Terminated'    // Failed/terminated
  | 'NotSupported'; // Unsupported content

interface TranslationTask {
  taskId: string;
  status: TranslationStatus;
  progress: number;
}

// Helper function to map API status to user-friendly display
const getStatusDisplay = (status: TranslationStatus): string => {
  switch (status) {
    case 'Analyzing': return 'Analyzing...';
    case 'Waiting': return 'Waiting...';
    case 'Processing': return 'Translating...';
    case 'Completed': return 'Translation Complete';
    case 'Terminated': return 'Translation Failed';
    case 'NotSupported': return 'Unsupported Content';
    default: return 'Processing...';
  }
};

// Helper function to determine if status is final
const isFinalStatus = (status: TranslationStatus): boolean => {
  return status === 'Completed' || status === 'Terminated' || status === 'NotSupported';
};

export default function Home() {
  const [cameraState, setCameraState] = useState<'idle' | 'active' | 'processing' | 'results'>('idle');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('English');
  const [selectedFromLanguage, setSelectedFromLanguage] = useState<string>('Simplified Chinese');
  const [translationTask, setTranslationTask] = useState<TranslationTask | null>(null);
  // 移除translatedFileUrl状态，现在使用硬编码PDF
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastCapturedImage, setLastCapturedImage] = useState<Blob | null>(null);
  
  const { getToken } = useAuth();
  
  
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
 
  const handleExit = () => {
    setCameraState('idle');
    setErrorMessage('');
    

    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };
  

  /**
   * 处理拍照 - 测试模式：跳过后端API调用，直接展示硬编码PDF
   * 用于测试PDF显示、下载和缓存功能
   */
  const handleCapture = async (imageBlob: Blob) => {
    try {
      // 保存拍摄的图片（用于重试功能）
      setLastCapturedImage(imageBlob);
      
      // 清除之前的错误信息
      setErrorMessage('');
      
      // 模拟处理状态（可选，也可以直接跳转到结果页）
      setCameraState('processing');
      
      // 模拟短暂的处理时间，然后直接跳转到结果页
      setTimeout(() => {
        // 设置模拟的翻译任务状态
        setTranslationTask({
          taskId: 'test-task-id-' + Date.now(),
          status: 'Completed',
          progress: 100
        });
        
        // 直接跳转到结果页面，ResultsView组件内部会使用硬编码的PDF URL
        setCameraState('results');
        
        console.log('测试模式：跳过后端API调用，直接展示硬编码PDF');
      }, 1000); // 1秒后跳转，模拟处理时间
      
    } catch (error) {
      console.error('Photo processing error:', error);
      setErrorMessage((error as Error).message || 'Error processing image');
      setCameraState('results');
    }
  };
  
  const pollTranslationResult = async (taskId: string) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    
    const pollInterval = 2000;
    let pollCount = 0;
    const maxPolls = 30;
    
    pollingTimerRef.current = setInterval(async () => {
      try {
        pollCount++;
        
        const token = await getToken();
        
        const response = await fetch(`/api/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to get task status and unable to parse error response' }));
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setErrorMessage(errorData.error || 'Failed to get task status');
          setCameraState('results');
          return;
        }
        
        const resultData = await response.json();
        
        const currentStatus = resultData.status as TranslationStatus;
        setTranslationTask({
          taskId: resultData.taskId,
          status: currentStatus,
          progress: resultData.progress || 0
        });
        
        if (isFinalStatus(currentStatus)) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          
          if (currentStatus === 'Completed') {
            // 移除setTranslatedFileUrl调用，现在使用硬编码PDF
            setErrorMessage('');
          } else {
            let errorMsg = resultData.error || 'Translation failed';
            if (currentStatus === 'NotSupported') {
              errorMsg = 'Document content is not supported for translation, please try another document';
            } else if (currentStatus === 'Terminated') {
              errorMsg = resultData.error || 'Translation task was terminated, please try again';
            }
            setErrorMessage(errorMsg);
          }
          
          setCameraState('results');
        }
        
        if (pollCount >= maxPolls && !isFinalStatus(currentStatus)) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setErrorMessage('Translation timeout, please try again later');
          setCameraState('results');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        
        setErrorMessage((error as Error).message || 'Error getting translation results');
        setCameraState('results');
      }
    }, pollInterval);
  };
  
  /**
   * 处理重试 - 测试模式：跳过后端API调用，直接展示硬编码PDF
   */
  const handleRetry = async () => {
    try {
      if (!lastCapturedImage) {
        throw new Error('No image available for retry');
      }
      
      setCameraState('processing');
      setErrorMessage('');
      
      // 模拟短暂的处理时间，然后直接跳转到结果页
      setTimeout(() => {
        // 设置模拟的翻译任务状态
        setTranslationTask({
          taskId: 'retry-task-id-' + Date.now(),
          status: 'Completed',
          progress: 100
        });
        
        // 直接跳转到结果页面，ResultsView组件内部会使用硬编码的PDF URL
        setCameraState('results');
        
        console.log('测试模式重试：跳过后端API调用，直接展示硬编码PDF');
      }, 800); // 稍短的处理时间
      
    } catch (error) {
      console.error('Retry error:', error);
      setErrorMessage((error as Error).message || 'Error during retry');
      setCameraState('results');
    }
  };
  
  /**
   * 处理源语言切换 - 测试模式
   */
  const handleFromLanguageChange = (languageName: string) => {
    setSelectedFromLanguage(languageName);
    if (cameraState === 'results' && lastCapturedImage) {
      console.log('测试模式：源语言切换到', languageName);
      handleRetry();
    }
  };

  /**
   * 处理目标语言切换 - 测试模式
   */
  const handleTargetLanguageChange = (languageName: string) => {
    setSelectedTargetLanguage(languageName);
    
    if (cameraState === 'results' && lastCapturedImage) {
      console.log('测试模式：目标语言切换到', languageName);
      handleRetry();
    }
  };
  
  const handleCameraStart = () => {
    setCameraState('active');
    setErrorMessage('');
  };
  
  return (
    <AuroraBackground className="text-white">
      {cameraState === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-4xl font-bold mb-6 text-black dark:text-white">CameraMenu</h1>
          <div className="text-xl mb-8 max-w-md text-black dark:text-white text-left">
            <p>Travel, Scan Any Menu</p>
            <p>Spot allergens</p>
            <p>Dine freely</p>
          </div>

          <div className="flex flex-row items-stretch justify-center gap-2 sm:gap-4 mb-8 w-full max-w-3xl px-2">
            <div className="flex-1 flex flex-col items-center w-full">
              <p className="mb-1 sm:mb-2 text-sm sm:text-base text-black dark:text-white">From:</p>
              <LanguageSelector 
                selectedLanguage={selectedFromLanguage} 
                onLanguageChange={handleFromLanguageChange} 
                className="w-full text-base md:text-lg"
              />
            </div>
            
            <div className="text-xl sm:text-2xl text-black dark:text-white mx-1 sm:mx-2 flex items-center self-center pt-5 sm:pt-6">→</div>

            <div className="flex-1 flex flex-col items-center w-full">
              <p className="mb-1 sm:mb-2 text-sm sm:text-base text-black dark:text-white">To:</p>
              <LanguageSelector 
                selectedLanguage={selectedTargetLanguage} 
                onLanguageChange={handleTargetLanguageChange} 
                className="w-full text-base md:text-lg"
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
            Start Camera
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
            <h2 className="text-2xl font-semibold mb-3 text-white">
              {translationTask ? getStatusDisplay(translationTask.status) : ''}
            </h2>
            <p className="text-emerald-200 text-lg">
              {translationTask ? `Progress: ${translationTask.progress}%` : ''}
            </p>
          </div>
        </div>
      )}
      
      {cameraState === 'results' && (
        <ResultsView 
          errorMessage={errorMessage}
          selectedLanguage={selectedTargetLanguage}
          onRetake={() => setCameraState('active')}
          onBack={handleExit}
          onRetry={handleRetry}
          onLanguageChange={handleTargetLanguageChange}
          translationTask={translationTask}
        />
      )}
    </AuroraBackground>
  );
}