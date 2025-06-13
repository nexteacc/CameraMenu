import { useRef, useState, useEffect } from 'react';
import Image from "next/image";

interface CameraViewProps {
  onExit: () => void;
  onCapture: (image: Blob) => Promise<void>;
  isLoading?: boolean;
  // selectedLanguage?: string; // 移除未使用的属性
}

const CameraView = ({ onExit, onCapture, isLoading }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // 移除未使用的stream状态变量
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  // const [isCameraStarting, setIsCameraStarting] = useState<boolean>(true); // Removed for direct preview

  const startCamera = async () => {
    // setIsCameraStarting(true); // Removed
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 }, // 请求理想分辨率
          height: { ideal: 1080 },
        },
      });
      streamRef.current = mediaStream;
      setCameraError(''); // 清除之前的错误
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(playError => {
            console.error('Error attempting to play video:', playError);
            setCameraError('Could not play video stream.');
        });
      }
    } catch (error: unknown) {
      console.error("Error accessing camera:", error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setCameraError('相机权限被拒绝，请在浏览器设置中允许相机访问');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        setCameraError('未找到相机设备');
      } else if (error instanceof Error && error.name === 'NotSupportedError') {
        setCameraError('浏览器不支持相机功能');
      } else {
        setCameraError('相机启动失败，请刷新页面重试');
      }
      // setIsCameraStarting(false); // Removed
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      // 确保清理所有媒体轨道
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      // 保存videoRef.current到变量中避免ESLint警告
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, []); // 空依赖数组，只在组件挂载时执行

  const capture = () => {
    if (!canvasRef.current || !videoRef.current) {
      console.error('Canvas or video element not available');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      console.error('Cannot get canvas context');
      return;
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageSrc = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewImage(imageSrc);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture?.(blob);
      } else {
        console.error('Failed to create blob from canvas');
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-12 pb-8 bg-zinc-50 dark:bg-zinc-900">
      {/* Ensure the parent container maintains aspect ratio for the video to fill correctly */}
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-black rounded-2xl overflow-hidden flex items-center justify-center">
        {/* Removed isCameraStarting loader */}
        {previewImage ? (
          <Image
            src={previewImage}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            webkit-playsinline="true"
            // onLoadedMetadata is still useful for knowing when the video dimensions are available,
            // but setIsCameraStarting is removed.
            onLoadedMetadata={() => {
              if (videoRef.current) {
                // Optional: log dimensions or perform other actions once metadata is loaded
                console.log('Video metadata loaded:', videoRef.current.videoWidth, videoRef.current.videoHeight);
              }
            }}
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" width={1920} height={1080} />

        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6">
          <button
            onClick={onExit}
            className="rounded-lg bg-black/60 hover:bg-black/80 p-3 backdrop-blur-sm border border-white/20 transition-all duration-200 shadow-lg"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          
          {!previewImage && (
            <button
              onClick={capture}
              className="rounded-full bg-white p-4 shadow-lg"
              disabled={isLoading}
            >
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
            </button>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
              <p>处理中...</p>
            </div>
          </div>
        )}
        
        {cameraError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-red-900/90 border border-red-500 rounded-lg p-6 text-center max-w-sm">
              <p className="text-red-300 mb-4">{cameraError}</p>
              <button
                onClick={() => {
                  setCameraError('');
                  startCamera();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
