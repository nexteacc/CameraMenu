# CameraMenu - 菜单翻译应用

这是一个基于 Next.js (App Router) 开发的现代化 Web 应用，主要功能是拍摄菜单照片并将其翻译成不同语言。项目采用了 React 和 TypeScript，并使用了 Tailwind CSS 进行样式设计。用户认证通过 Clerk 实现。

## 项目架构

项目采用了 Next.js 的 App Router 架构，主要文件和目录结构如下：

-   `/app` - 包含应用的主要页面、API路由和布局。
    -   `/app/api` - 后端 API 接口，包括图片上传 (`/upload`) 和任务状态查询 (`/task/[taskId]`)。
    -   `/app/page.tsx` - 应用主页面，处理相机交互、状态管理和API调用。
    -   `/app/layout.tsx` - 应用的根布局。
-   `/components` - 包含可复用的 UI 组件。
    -   `CameraView.tsx` - 相机预览和拍照组件。
    -   `ResultsView.tsx` - 展示翻译结果（PDF格式）的组件，支持手势缩放。
    -   `LanguageSelector.tsx` - 语言选择组件。
    -   `CameraButton.tsx` - 启动相机的按钮。
    -   `AuroraBackground.tsx` - 美观的背景组件。
-   `/lib` - 包含工具函数 (例如 `utils.ts`)。
-   `/public` - 包含静态资源 (例如 `pdf.worker.min.js` 如果本地托管)。

## 核心功能

1.  **用户认证**：使用 Clerk 进行用户认证，保护API接口。
2.  **相机拍照**：通过浏览器的 MediaDevices API 访问设备相机，拍摄菜单照片。
3.  **图片上传与翻译任务创建**：将拍摄的菜单照片和目标语言上传到后端 `/api/upload` 接口，后端调用第三方服务进行OCR和翻译，并返回任务ID。
4.  **异步任务轮询与结果获取**：前端通过轮询 `/api/task/[taskId]` 接口获取翻译任务的状态和最终的翻译结果URL（PDF格式）。
5.  **PDF结果展示与交互**：在 `ResultsView.tsx` 组件中使用 `react-pdf` 展示翻译后的PDF文件，支持在移动设备上通过双指手势进行缩放，在桌面设备上通过鼠标滚轮缩放。
6.  **双语言选择支持**：用户可以选择源语言和目标翻译语言，支持 English、Vietnamese、Simplified Chinese 三种语言。

## 工作流程

1.  用户通过 Clerk 登录应用。
2.  在主页面 (`page.tsx`)，用户选择源语言和目标翻译语言。
3.  用户点击拍照按钮，激活 `CameraView.tsx`。
4.  用户拍摄菜单照片并确认。
5.  `page.tsx` 中的 `handleCapture` 函数将图片数据 (Blob)、源语言和目标语言通过 FormData 上传到 `/api/upload`。
6.  `/api/upload` (在 `app/api/upload/route.ts`) 接收请求，进行Token验证，然后调用第三方翻译服务创建翻译任务，并返回 `taskId` 和`status`。
7.  `page.tsx` 接收到 `taskId` 后，启动 `pollTranslationResult` 函数，该函数定期调用 `/api/task/[taskId]`。
8.  `/api/task/[taskId]` (在 `app/api/task/[taskId]/route.ts`) 查询第三方服务的任务状态和结果。
9.  轮询直到任务完成（`status === 'Completed'`）并且获取到 `translatedFileUrl` (PDF链接)，或者任务失败。
10. `page.tsx` 更新状态，并将 `translatedFileUrl` 和其他相关信息传递给 `ResultsView.tsx`。
11. `ResultsView.tsx` 使用 `react-pdf` 加载并显示PDF，用户可以通过手势或滚轮进行缩放。
12. 用户可以进行重拍、返回或重试操作。

## 数据流转与状态管理

-   **主要状态管理**：在 `app/page.tsx` 中使用 `useState` 管理应用的核心状态，包括相机激活状态、拍摄的图片、源语言、目标语言、任务ID、任务状态、翻译进度、翻译结果URL和错误信息。
-   **翻译状态类型**：定义了 `TranslationStatus` 类型，包含以下状态：
    *   `Analyzing` - 初始分析阶段
    *   `Waiting` - 排队等待中
    *   `Processing` - 正在翻译
    *   `Completed` - 翻译完成
    *   `Terminated` - 翻译失败/终止
    *   `NotSupported` - 不支持的内容
-   **Token 获取**：通过 `useAuth` (Clerk) 获取用户会话Token，用于API请求认证。
-   **API 通信**：
    *   图片上传：`POST /api/upload` (FormData)
    *   结果轮询：`GET /api/task/[taskId]`
-   **Props 传递**：状态和回调函数通过 props 从 `page.tsx` 传递到子组件如 `CameraView.tsx` 和 `ResultsView.tsx`。

## 移动端适配

项目在设计时充分考虑了移动端适配：

-   使用 Tailwind CSS 的响应式类进行布局。
-   相机视图 (`CameraView.tsx`) 和结果视图 (`ResultsView.tsx`) 均针对移动设备优化。
-   `ResultsView.tsx` 中的 PDF 展示支持触摸手势缩放 (`touchAction: 'pan-y pinch-zoom'`)。
-   相机API优先使用后置摄像头 (`facingMode: "environment"`)。

## API 接口说明

### 1. `/api/upload`

-   **方法**: `POST`
-   **Content-Type**: `multipart/form-data`
-   **认证**: 需要 Clerk Session Token (Bearer Token in Authorization header)
-   **请求体参数**:
    -   `image`: (File) 拍摄的图片文件。
    -   `targetLang`: (String) 目标翻译语言名称（如 "English", "Vietnamese", "Simplified Chinese"）。
    -   `fromLang`: (String) 源语言名称（必需参数）。
    -   `userId`: (String) 用户ID（必需参数）。
-   **成功响应 (200 OK)**:
    ```json
    {
      "taskId": "some-task-id",
      "status": "Pending" // 或其他初始状态
    }
    ```
-   **错误响应**: 标准 HTTP 错误码 (如 400, 401, 500) 及错误信息。

### 2. `/api/task/[taskId]`

-   **方法**: `GET`
-   **认证**: 需要 Clerk Session Token (Bearer Token in Authorization header)
-   **路径参数**:
    -   `taskId`: (String) 由 `/api/upload` 返回的任务ID。
-   **成功响应 (200 OK)**:
    ```json
    {
      "taskId": "some-task-id",
      "status": "Completed", // "Processing", "Failed", etc.
      "progress": 100,
      "translatedFileUrl": "url-to-translated-pdf.pdf", // 状态为 Completed 时出现
      "error": null // 或错误信息字符串
    }
    ```
-   **错误响应**: 标准 HTTP 错误码 (如 401, 404, 500) 及错误信息。

## 开发与运行

```bash
# 安装依赖 (项目使用 pnpm)
pnpm install

# 开发模式运行 (使用 Turbopack 加速)
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start
```

## 环境变量

项目需要以下环境变量 (通常在 `.env.local` 文件中配置):

-   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 的可发布密钥。
-   `CLERK_SECRET_KEY`: Clerk 的秘密密钥 (用于后端验证)。
-   `TRANSLATION_API_KEY`: 第三方翻译服务 (如 simplifyai.cn) 的 API 密钥。

## 注意事项

-   **PDF.js Worker**: `react-pdf` 需要一个 PDF.js worker。当前代码中 `ResultsView.tsx` 使用 CDN (`//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`)。如果需要本地托管，应将 `pdf.worker.min.js` 从 `node_modules/pdfjs-dist/build/` 复制到 `/public` 目录，并更新 `pdfjs.GlobalWorkerOptions.workerSrc` 指向本地路径 (例如 `'/pdf.worker.min.js'`)。
-   **Clerk Token 验证**: 后端 API (`/api/upload/route.ts` 和 `/api/task/[taskId]/route.ts`) 中实际的 Clerk Token 验证逻辑（使用 `auth()` 或 `getAuth()`) 可能需要根据具体部署和Clerk版本进行检查和调整，确保其按预期工作。

