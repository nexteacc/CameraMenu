# CameraMenu - 菜单翻译应用


[🇨🇳 简体中文](README.zh.md) | [🇺🇸 English](README.md)

---

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
5.  **PDF结果展示与交互**：在 `ResultsView.tsx` 组件中使用 `react-pdf` 展示翻译后的PDF文件，支持在移动设备上通过双指手势进行缩放。
6.  **双语言选择支持**：用户可以选择源语言和目标翻译语言，支持多语言。

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

## 数据流程详解

### 📸 图片数据流转路径



1. **相机捕获阶段**：
   - `CameraView.tsx` → Canvas绘制 → `canvas.toBlob()` → JPEG格式Blob对象

2. **前端上传阶段**：
   - `page.tsx` → 创建FormData → 添加image(Blob)、fromLang、toLang、userId → `fetch('/api/upload')`

3. **后端转发阶段**：
   - `route.ts` → 接收FormData → 直接创建新FormData → 转发给第三方API
   - **格式**：`multipart/form-data`（符合API要求）


4. **API响应阶段**：
   - 第三方API → 返回taskId → 前端开始轮询 → 最终获得`translatedFileUrl`（PDF文档链接）

5. **结果展示阶段**：
   - `ResultsView.tsx` → 使用`react-pdf`渲染PDF → 支持缩放和交互



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



## API 接口说明

### 1. `/api/upload`

-   **方法**: `POST`
-   **Content-Type**: `multipart/form-data`
-   **认证**: 需要 Clerk Session Token (Bearer Token in Authorization header)
-   **请求体参数**:
    -   `image`: (File) 拍摄的图片文件。
    -   `toLang`: (String) 目标翻译语言名称（如 "English", "Vietnamese", "Simplified Chinese"，“Thai”,"Korean"）。
    -   `fromLang`: (String) 源语言名称（必需参数）。
    -   `userId`: (String) 用户ID（必需参数）。
-   **内部处理**: 后端直接转发FormData到第三方API
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
-   `TRANSLATION_API_KEY`: 第三方翻译服务的 API 密钥。
-   `TRANSLATION_API_URL`: 第三方翻译服务的 API URL。


## 现在的情况
✅UI界面已经设计完成

✅Pitch已经设计完成 https://cameramenu.typedream.app/

✅项目目标也定位清楚

❌后端的翻译服务调用还存在问题，还没有打通，我还在研究问题出现在了哪里。

✅ MVP现在是一个pwa应用

## 团队建设
🎨 我需要合作伙伴来重新设计UI和用户体验。

💻 我需要合作伙伴来编写后端代码。



## 接下来计划

🟢 优化前端UI，完善用户登录功能，完善用户交互流程。    

🟢 过敏源提醒： 写代码调用 OpenAI 接口，根据用户上传的图片分析用户的过敏源，提醒用户注意。

🟢 长图分享： 新增功能，将翻译结果和过敏源提醒信息能生成长图便于用户保存和分享。

🟢 上线Apple store和Google store
