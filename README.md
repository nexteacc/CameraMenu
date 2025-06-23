# CameraMenu - Menu Translation App

**语言版本 / Language Versions:**
[🇨🇳 简体中文](README.zh.md) | [🇺🇸 English](README.md)

---

This is a modern web application built with Next.js (App Router) that allows users to take photos of menus and translate them into different languages. The project uses React and TypeScript, with Tailwind CSS for styling and Clerk for user authentication.

## Project Architecture

The project uses Next.js App Router architecture with the following main files and directory structure:

- `/app` - Contains the main application pages, API routes, and layouts.
  - `/app/api` - Backend API endpoints, including image upload (`/upload`) and task status queries (`/task/[taskId]`).
  - `/app/page.tsx` - Main application page handling camera interactions, state management, and API calls.
  - `/app/layout.tsx` - Root application layout.
  - `/components` - Contains reusable UI components.
    - `CameraView.tsx` - Camera preview and photo capture component.
    - `ResultsView.tsx` - Component for displaying translation results (PDF format) with gesture zoom support.
    - `LanguageSelector.tsx` - Language selection component.
    - `CameraButton.tsx` - Camera activation button.
    - `AuroraBackground.tsx` - Beautiful background component.
  - `/lib` - Contains utility functions (e.g., `utils.ts`).
  - `/public` - Contains static assets (e.g., `pdf.worker.min.js` if hosted locally).

## Core Features

1. **User Authentication**: Uses Clerk for user authentication to protect API endpoints.
2. **Camera Photography**: Accesses device camera through browser's MediaDevices API to capture menu photos.
3. **Image Upload & Translation Task Creation**: Uploads captured menu photos and target language to backend `/api/upload` endpoint, which calls third-party services for OCR and translation, returning a task ID.
4. **Asynchronous Task Polling & Result Retrieval**: Frontend polls `/api/task/[taskId]` endpoint to get translation task status and final translation result URL (PDF format).
5. **PDF Result Display & Interaction**: Uses `react-pdf` in `ResultsView.tsx` component to display translated PDF files with pinch-to-zoom support on mobile devices.
6. **Dual Language Selection Support**: Users can select source and target translation languages with multi-language support.

## Workflow

1. User logs into the application through Clerk.
2. On the main page (`page.tsx`), user selects source and target translation languages.
3. User clicks the photo button to activate `CameraView.tsx`.
4. User captures menu photo and confirms.
5. The `handleCapture` function in `page.tsx` uploads image data (Blob), source language, and target language via FormData to `/api/upload`.
6. `/api/upload` (in `app/api/upload/route.ts`) receives the request, performs token validation, then calls third-party translation service to create translation task, returning `taskId` and `status`.
7. After receiving `taskId`, `page.tsx` starts the `pollTranslationResult` function, which periodically calls `/api/task/[taskId]`.
8. `/api/task/[taskId]` (in `app/api/task/[taskId]/route.ts`) queries third-party service task status and results.
9. Polling continues until task completion (`status === 'Completed'`) and `translatedFileUrl` (PDF link) is obtained, or task fails.
10. `page.tsx` updates state and passes `translatedFileUrl` and other relevant information to `ResultsView.tsx`.
11. `ResultsView.tsx` uses `react-pdf` to load and display PDF, allowing users to zoom via gestures or scroll wheel.
12. Users can retake photos, go back, or retry operations.

## Data Flow Details

### 📸 Image Data Flow Path

1. **Camera Capture Stage**:
   - `CameraView.tsx` → Canvas drawing → `canvas.toBlob()` → JPEG format Blob object

2. **Frontend Upload Stage**:
   - `page.tsx` → Create FormData → Add image(Blob), fromLang, toLang, userId → `fetch('/api/upload')`

3. **Backend Forwarding Stage**:
   - `route.ts` → Receive FormData → Create new FormData → Add `shouldTranslateImage: 'true'` → Forward to third-party API
   - **Format**: `multipart/form-data` (meets API requirements)
   - **Key Parameter**: `shouldTranslateImage: 'true'` enables image OCR translation

4. **API Response Stage**:
   - Third-party API → Return taskId → Frontend starts polling → Finally get `translatedFileUrl` (PDF document link)

5. **Result Display Stage**:
   - `ResultsView.tsx` → Use `react-pdf` to render PDF → Support zoom and interaction

## Data Flow & State Management

- **Main State Management**: Uses `useState` in `app/page.tsx` to manage core application state, including camera activation status, captured images, source language, target language, task ID, task status, translation progress, translation result URL, and error information.
- **Translation Status Types**: Defines `TranslationStatus` type with the following states:
  - `Analyzing` - Initial analysis stage
  - `Waiting` - Queued and waiting
  - `Processing` - Currently translating
  - `Completed` - Translation completed
  - `Terminated` - Translation failed/terminated
  - `NotSupported` - Unsupported content
- **Token Retrieval**: Uses `useAuth` (Clerk) to get user session token for API request authentication.
- **API Communication**:
  - Image upload: `POST /api/upload` (FormData)
  - Result polling: `GET /api/task/[taskId]`
- **Props Passing**: State and callback functions are passed via props from `page.tsx` to child components like `CameraView.tsx` and `ResultsView.tsx`.

## API Interface Documentation

### 1. `/api/upload`

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Requires Clerk Session Token (Bearer Token in Authorization header)
- **Request Body Parameters**:
  - `image`: (File) Captured image file.
  - `toLang`: (String) Target translation language name (e.g., "English", "Vietnamese", "Simplified Chinese", "Thai", "Korean").
  - `fromLang`: (String) Source language name (required parameter).
  - `userId`: (String) User ID (required parameter).
- **Internal Processing**: Backend directly forwards FormData to third-party API, automatically adding `shouldTranslateImage: 'true'` parameter to enable OCR translation.
- **Success Response (200 OK)**:
  ```json
  {
    "taskId": "some-task-id",
    "status": "Pending" // or other initial status
  }
  ```
- **Error Response**: Standard HTTP error codes (e.g., 400, 401, 500) with error messages.

### 2. `/api/task/[taskId]`

- **Method**: `GET`
- **Authentication**: Requires Clerk Session Token (Bearer Token in Authorization header)
- **Path Parameters**:
  - `taskId`: (String) Task ID returned by `/api/upload`.
- **Success Response (200 OK)**:
  ```json
  {
    "taskId": "some-task-id",
    "status": "Completed", // "Processing", "Failed", etc.
    "progress": 100,
    "translatedFileUrl": "url-to-translated-pdf.pdf", // appears when status is Completed
    "error": null // or error message string
  }
  ```
- **Error Response**: Standard HTTP error codes (e.g., 401, 404, 500) with error messages.

## Development & Running

```bash
# Install dependencies (project uses pnpm)
pnpm install

# Run in development mode (using Turbopack for acceleration)
pnpm dev

# Build production version
pnpm build

# Run production version
pnpm start
```

## Environment Variables

The project requires the following environment variables (usually configured in `.env.local` file):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk's publishable key.
- `CLERK_SECRET_KEY`: Clerk's secret key (for backend validation).
- `TRANSLATION_API_KEY`: Third-party translation service API key.
- `TRANSLATION_API_URL`: Third-party translation service API URL.

## Future Plans

1. Optimize frontend UI, improve user login functionality, and enhance user interaction flow.
2. Allergen Alerts: Write code to call OpenAI API to analyze user-uploaded images for allergens and alert users.
3. Long Image Sharing: Add functionality to generate long images combining translation results and allergen alert information for easy user saving and sharing.