# CameraMenu - Menu Translation App

[🇨🇳 简体中文](README.zh.md) | [🇺🇸 English](README.md)

---

This is a modern web application built with Next.js (App Router) that allows users to take photos of menus and translate them into different languages. The project uses React and TypeScript, with Tailwind CSS for styling and Clerk for user authentication.

## Project Architecture

The project uses Next.js App Router architecture with the following main files and directory structure:

- `/app` - Contains the main application pages, API routes, and layouts.
  - `/app/api/translate` - Backend API endpoint for image translation using Google Gemini API.
  - `/app/page.tsx` - Main application page handling camera interactions, state management, and API calls.
  - `/app/layout.tsx` - Root application layout.
- `/components` - Contains reusable UI components.
  - `CameraView.tsx` - Camera capture component using native system camera (input capture).
  - `ResultsView.tsx` - Component for displaying translation results (image format) with download and share support.
  - `LanguageSelector.tsx` - Language selection component.
  - `AuroraBackground.tsx` - Beautiful animated background component.
- `/lib` - Contains utility functions (e.g., `utils.ts`).

## Core Features

1. **User Authentication**: Uses Clerk for user authentication to protect API endpoints.
2. **Native Camera Access**: Uses HTML input capture to access system camera on mobile devices or file picker on desktop.
3. **AI-Powered Translation**: Uses Google Gemini API (`gemini-3-pro-image-preview`) to translate menu text directly on the image.
4. **Synchronous Processing**: Translation is processed synchronously - no polling required.
5. **Image Result Display**: Displays translated images directly (Base64 format) with download and share functionality.
6. **Target Language Selection**: Users can select target translation language with support for 12 languages. Source language is automatically detected by AI.

## Workflow

1. User logs into the application through Clerk.
2. On the main page (`page.tsx`), user selects target translation language.
3. User clicks the "Start Camera" button to activate `CameraView.tsx`.
4. User captures menu photo using system camera (mobile) or selects image file (desktop).
5. The `handleCapture` function in `page.tsx` uploads image file and target language via FormData to `/api/translate`.
6. `/api/translate` (in `app/api/translate/route.ts`) receives the request, performs token validation, then calls Google Gemini API to translate the menu.
7. Gemini API processes the image and returns a new image with translated text overlaid in handwritten style.
8. The translated image (Base64 format) is returned to the frontend.
9. `page.tsx` updates state and passes the translated image URL to `ResultsView.tsx`.
10. `ResultsView.tsx` displays the translated image, allowing users to download or share it.
11. Users can retake photos, go back, or retry translation.

## Data Flow Details

### 📸 Image Translation Flow

1. **Camera Capture Stage**:
   - `CameraView.tsx` → System camera (mobile) or file picker (desktop) → File object

2. **Frontend Upload Stage**:
   - `page.tsx` → Create FormData → Add image(File), toLang → `fetch('/api/translate')`

3. **Backend Processing Stage**:
   - `/api/translate` → Receive FormData → Convert image to Base64
   - Build prompt with translation requirements
   - Call Google Gemini API with image and prompt

4. **AI Translation Stage**:
   - Google Gemini API → Process image → Generate new image with translated text
   - Return Base64 image data

5. **Result Display Stage**:
   - `ResultsView.tsx` → Display Base64 image → Support download and share

## Data Flow & State Management

- **Main State Management**: Uses `useState` in `app/page.tsx` to manage core application state, including camera activation status, captured images, target language, translated image URL, and error information.
- **Token Retrieval**: Uses `useAuth` (Clerk) to get user session token for API request authentication.
- **API Communication**:
  - Image translation: `POST /api/translate` (FormData)
- **Props Passing**: State and callback functions are passed via props from `page.tsx` to child components like `CameraView.tsx` and `ResultsView.tsx`.

## API Interface Documentation

### `/api/translate`

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Requires Clerk Session Token (Bearer Token in Authorization header)
- **Request Body Parameters**:
  - `image`: (File) Captured image file.
  - `toLang`: (String) Target translation language name (e.g., "English", "Vietnamese", "Simplified Chinese", "Thai", "Korean").
- **Internal Processing**: Backend calls Google Gemini API to translate menu text on the image
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "imageDataUrl": "data:image/png;base64,...",
    "textResponse": "Optional text response from AI"
  }
  ```
- **Error Response**: Standard HTTP error codes (e.g., 400, 401, 500) with error messages.

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
- `GEMINI_API_KEY`: Google Gemini API key (get from [Google AI Studio](https://aistudio.google.com/)).

## Current Status

✅ UI interface design completed

✅ Pitch design completed https://cameramenu.typedream.app/

✅ Menu translation feature implemented using Google Gemini API

✅ MVP is a PWA application

## Future Plans

🟢 1. Optimize frontend UI, improve user login functionality, and enhance user interaction flow.

🟢 2. Allergen Alerts: Write code to call OpenAI API to analyze user-uploaded images for allergens and alert users.

🟢 3. Long Image Sharing: Add functionality to generate long images combining translation results and allergen alert information for easy user saving and sharing.

🟢 4. Launch in Apple store and Google store
