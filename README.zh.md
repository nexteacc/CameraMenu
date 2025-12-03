# CameraMenu - 菜单翻译应用

[🇨🇳 简体中文](README.zh.md) | [🇺🇸 English](README.md)

---

这是一个基于 Next.js (App Router) 开发的现代化 Web 应用，主要功能是拍摄菜单照片并将其翻译成不同语言。项目采用了 React 和 TypeScript，并使用了 Tailwind CSS 进行样式设计。用户认证通过 Clerk 实现。

## 项目架构

项目采用了 Next.js 的 App Router 架构，主要文件和目录结构如下：

- `/app` - 包含应用的主要页面、API路由和布局。
  - `/app/api/translate` - 后端 API 接口，使用 Google Gemini API 进行图片翻译。
  - `/app/page.tsx` - 应用主页面，处理相机交互、状态管理和API调用。
  - `/app/layout.tsx` - 应用的根布局。
- `/components` - 包含可复用的 UI 组件。
  - `CameraView.tsx` - 相机拍照组件，使用系统原生相机（input capture）。
  - `ResultsView.tsx` - 展示翻译结果（图片格式）的组件，支持下载和分享。
  - `LanguageSelector.tsx` - 语言选择组件。
  - `AuroraBackground.tsx` - 美观的动画背景组件。
- `/lib` - 包含工具函数 (例如 `utils.ts`)。

## 核心功能

1. **用户认证**：使用 Clerk 进行用户认证，保护API接口。
2. **原生相机访问**：使用 HTML input capture 在移动设备上调用系统相机，桌面端使用文件选择器。
3. **AI 翻译**：使用 Google Gemini API (`gemini-3-pro-image-preview`) 直接在图片上翻译菜单文字。
4. **同步处理**：翻译采用同步处理方式，无需轮询。
5. **图片结果展示**：直接显示翻译后的图片（Base64 格式），支持下载和分享功能。
6. **目标语言选择**：用户可以选择目标翻译语言，支持 12 种语言。源语言由 AI 自动识别。

## 工作流程

1. 用户通过 Clerk 登录应用。
2. 在主页面 (`page.tsx`)，用户选择目标翻译语言。
3. 用户点击 "Start Camera" 按钮，激活 `CameraView.tsx`。
4. 用户使用系统相机（移动端）或选择图片文件（桌面端）拍摄菜单照片。
5. `page.tsx` 中的 `handleCapture` 函数将图片文件和目标语言通过 FormData 上传到 `/api/translate`。
6. `/api/translate` (在 `app/api/translate/route.ts`) 接收请求，进行Token验证，然后调用 Google Gemini API 翻译菜单。
7. Gemini API 处理图片并返回一张带有翻译文字（手绘风格）的新图片。
8. 翻译后的图片（Base64 格式）返回给前端。
9. `page.tsx` 更新状态，并将翻译后的图片 URL 传递给 `ResultsView.tsx`。
10. `ResultsView.tsx` 显示翻译后的图片，用户可以下载或分享。
11. 用户可以进行重拍、返回或重试翻译操作。

## 数据流程详解

### 📸 图片翻译流转路径

1. **相机捕获阶段**：
   - `CameraView.tsx` → 系统相机（移动端）或文件选择器（桌面端） → File 对象

2. **前端上传阶段**：
   - `page.tsx` → 创建FormData → 添加image(File)、toLang → `fetch('/api/translate')`

3. **后端处理阶段**：
   - `/api/translate` → 接收FormData → 将图片转换为 Base64
   - 构建包含翻译要求的提示词
   - 调用 Google Gemini API，传入图片和提示词

4. **AI 翻译阶段**：
   - Google Gemini API → 处理图片 → 生成带有翻译文字的新图片
   - 返回 Base64 图片数据

5. **结果展示阶段**：
   - `ResultsView.tsx` → 显示 Base64 图片 → 支持下载和分享

## 数据流转与状态管理

- **主要状态管理**：在 `app/page.tsx` 中使用 `useState` 管理应用的核心状态，包括相机激活状态、拍摄的图片、目标语言、翻译后的图片 URL 和错误信息。
- **Token 获取**：通过 `useAuth` (Clerk) 获取用户会话Token，用于API请求认证。
- **API 通信**：
  - 图片翻译：`POST /api/translate` (FormData)
- **Props 传递**：状态和回调函数通过 props 从 `page.tsx` 传递到子组件如 `CameraView.tsx` 和 `ResultsView.tsx`。

## API 接口说明

### `/api/translate`

- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **认证**: 需要 Clerk Session Token (Bearer Token in Authorization header)
- **请求体参数**:
  - `image`: (File) 拍摄的图片文件。
  - `toLang`: (String) 目标翻译语言名称（如 "English", "Vietnamese", "Simplified Chinese", "Thai", "Korean"）。
- **内部处理**: 后端调用 Google Gemini API 在图片上翻译菜单文字
- **成功响应 (200 OK)**:
  ```json
  {
    "success": true,
    "imageDataUrl": "data:image/png;base64,...",
    "textResponse": "AI 的可选文字响应"
  }
  ```
- **错误响应**: 标准 HTTP 错误码 (如 400, 401, 500) 及错误信息。

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

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 的可发布密钥。
- `CLERK_SECRET_KEY`: Clerk 的秘密密钥 (用于后端验证)。
- `GEMINI_API_KEY`: Google Gemini API 密钥（从 [Google AI Studio](https://aistudio.google.com/) 获取）。

## 现在的情况

✅ UI界面已经设计完成

✅ Pitch已经设计完成 https://cameramenu.typedream.app/

✅ 菜单翻译功能已实现（使用 Google Gemini API）

✅ MVP现在是一个PWA应用

## 接下来计划

🟢 优化前端UI，完善用户登录功能，完善用户交互流程。

🟢 过敏源提醒： 写代码调用 OpenAI 接口，根据用户上传的图片分析用户的过敏源，提醒用户注意。

🟢 长图分享： 新增功能，将翻译结果和过敏源提醒信息能生成长图便于用户保存和分享。

🟢 上线Apple store和Google store
