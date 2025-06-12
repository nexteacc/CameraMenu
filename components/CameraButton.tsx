interface CameraButtonProps {
  onCameraStart: (stream: MediaStream) => void;
  onError: (message: string) => void;
}

export const CameraButton = ({ onCameraStart, onError }: CameraButtonProps) => {
  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      // Request camera permission with enhanced constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
      });
      onCameraStart(stream);
    } catch (error) {
      console.error("Camera access error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          onError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (error.name === "NotFoundError") {
          onError("No camera device found. Please ensure your device is connected.");
        } else if (error.name === "NotSupportedError") {
          onError("Camera not supported in this browser.");
        } else {
          onError(`Failed to start camera: ${error.message}`);
        }
      } else {
        onError("Failed to start camera, please try again.");
      }
    }
  };

  return (
    <button
      onClick={startCamera}
      className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-500 rounded-2xl hover:bg-blue-600 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
        />
      </svg>
      START
    </button>
  );
};

export default CameraButton;
