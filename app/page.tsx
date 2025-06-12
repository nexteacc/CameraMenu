'use client'

import { useState, useCallback } from "react";
import { CameraButton } from "../components/CameraButton";
import { AuroraBackground } from "../components/AuroraBackground";
import { CameraView } from "../components/CameraView";
import ResultsView from "../components/ResultsView";
import { LanguageSelector } from "../components/LanguageSelector";
import { SignIn, SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";

interface Idea {
  source: string;
  strategy: string;
  marketing: string;
  market_potential: string;
  target_audience: string;
}

// 新增翻译任务接口
interface TranslationTask {
  taskId: string;
  status: string;
  progress: number;
  translatedImageUrl?: string;
}

export default function Home() {
  const { signOut, user } = useClerk();
  const [cameraState, setCameraState] = useState<"idle" | "active" | "results">("idle");

  const [ideas, setIdeas] = useState<Idea[]>([]);
  
  // 新增语言选择状态
  const [selectedLanguage, setSelectedLanguage] = useState<string>("zh");
  // 新增翻译任务状态
  const [translationTask, setTranslationTask] = useState<TranslationTask | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);

  const handleExit = useCallback(() => {
    setCameraState("idle");
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const handleCapture = useCallback(
    async (image: string) => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          setMediaStream(null);
        }
        
        if (!image || image.length < 100) {
          throw new Error("Invalid image data");
        }

        if (!user?.id) {
          throw new Error("User ID is missing");
        }

        const base64Data = image.split(",")[1];
        if (!base64Data) {
          throw new Error("Invalid Base64 image data");
        }

        // 直接将图片上传到后端
        const formData = new FormData();
        formData.append('image', image);
        formData.append('userId', user.id);
        formData.append('targetLang', selectedLanguage);

        // 调用后端上传接口
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || "Image upload failed");
        }

        const taskData = await uploadResponse.json();
        setTranslationTask(taskData);
        
        // 如果是同步处理（fastCreation=false），直接显示结果
        if (taskData.status === "Completed" && taskData.translatedImageUrl) {
          setLastImageUrl(taskData.translatedImageUrl);
          setCameraState("results");
        } else {
          // 如果是异步处理，开始轮询结果
          pollTranslationResult(taskData.taskId);
        }

      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
        setCameraState("results");
      } finally {
        setIsLoading(false);
      }
    },
    [user, mediaStream, selectedLanguage] 
  );

  // 轮询翻译结果
  const pollTranslationResult = useCallback(async (taskId: string) => {
    try {
      const checkInterval = setInterval(async () => {
        const resultResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/task/${taskId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!resultResponse.ok) {
          clearInterval(checkInterval);
          throw new Error("Failed to get translation result");
        }

        const resultData = await resultResponse.json();
        setTranslationTask(resultData);

        // 翻译完成
        if (resultData.status === "Completed" && resultData.translatedImageUrl) {
          clearInterval(checkInterval);
          setLastImageUrl(resultData.translatedImageUrl);
          setCameraState("results");
        } 
        // 翻译失败
        else if (resultData.status === "Failed") {
          clearInterval(checkInterval);
          setErrorMessage("Translation failed: " + (resultData.message || "Unknown error"));
          setCameraState("results");
        }
      }, 2000); // 每2秒检查一次

      // 60秒后如果还没有结果，停止轮询
      setTimeout(() => {
        clearInterval(checkInterval);
        if (cameraState !== "results") {
          setErrorMessage("Translation timeout. Please try again.");
          setCameraState("results");
        }
      }, 60000);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      setCameraState("results");
    }
  }, [cameraState]);

  const handleRetry = useCallback(async () => {
    if (lastImageUrl) {
      setIsLoading(true);
      setErrorMessage("");
      try {
        // 重新分析上一张图片
        const ideasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user?.id || "defaultUserId", 
            image_url: lastImageUrl
          })
        });

        if (ideasResponse.status === 200) {
          const data = await ideasResponse.json();
          setIdeas(
            data.ideas.map((idea: Idea) => ({
              source: idea.source.trim(),
              strategy: idea.strategy.trim(),
              marketing: idea.marketing.trim(),
              market_potential: idea.market_potential.trim(),
              target_audience: idea.target_audience.trim()
            }))
          );
          setErrorMessage("");
        } else {
          setErrorMessage('Analysis failed');
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
  }, [lastImageUrl, user]);

  const handleCameraStart = useCallback((stream: MediaStream) => {
    setMediaStream(stream);
    setCameraState("active");
  }, []);

  return (
    <>
      <SignedIn>
        {cameraState === "idle" && (
          <AuroraBackground>
            <div className="flex flex-col items-center justify-center space-y-8 p-4">
              <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white">
                菜单翻译
              </h1>
              <p className="text-center text-gray-600 dark:text-gray-300 max-w-md">
                拍摄菜单照片，获取翻译结果
              </p>
              
              {/* 添加语言选择器 */}
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
              
              <CameraButton
                onCameraStart={handleCameraStart}
                onError={setErrorMessage}
              />
              
              {errorMessage && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg max-w-md">
                  {errorMessage}
                </div>
              )}
              
              <button
                onClick={() => signOut()}
                className="mt-8 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                退出登录
              </button>
            </div>
          </AuroraBackground>
        )}

        {cameraState === "active" && (
          <CameraView
            onExit={handleExit}
            onCapture={handleCapture}
            isLoading={isLoading}
          />
        )}

        {cameraState === "results" && (
          <ResultsView
            ideas={ideas}
            onRetake={() => {
              setErrorMessage("");
              setCameraState("idle");
            }}
            onBack={() => {
              setErrorMessage("");
              setCameraState("idle");
            }}
            onRetry={handleRetry}
            errorMessage={errorMessage}
            translatedImageUrl={translationTask?.translatedImageUrl}
            selectedLanguage={selectedLanguage}
            onLanguageChange={(language) => {
              setSelectedLanguage(language);
              // 如果有上一张图片，可以重新翻译
              if (lastImageUrl) {
                handleCapture(lastImageUrl);
              }
            }}
          />
        )}
      </SignedIn>

      <SignedOut>
        <AuroraBackground>
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              <SignIn />
            </div>
          </div>
        </AuroraBackground>
      </SignedOut>
    </>
  );
}