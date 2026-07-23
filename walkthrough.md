# GamerHub Persistent Auth, Supabase Social Login & Profile/Video/Saved Overhauls Walkthrough

We have successfully implemented secure native persistent sessions (Phase 1), Supabase-based social logins (Phase 2), profile Connect buttons (Task 3), User Posts display (Task 4), Video Uploads (Task 2), and Saved Posts bookmarking (Task 3) on the mobile application! Both frontend Next.js and backend Express applications build compile-clean with no TypeScript errors.

---

## 🛠️ Phase 1 — Persistent Sessions & Mobile Storage

### 1. Capacitor Preferences Storage Engine
*   **Refactor:** Overwrote [authStore.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/store/authStore.ts) to replace standard `localStorage` with a custom storage engine backed by `@capacitor/preferences`.
*   **Result:** User credentials, access tokens, and refresh tokens are now securely stored natively on iOS/Android devices even when the app is closed or removed from recent app trays.

### 2. Dynamically Loaded Axios Interceptors
*   **Refactor:** Updated [api.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/lib/api.ts) request and response interceptors to import and read tokens dynamically from the Zustand state at request-time rather than blocking on synchronous `localStorage` reads.
*   **Result:** Clean async token injection and automatic 401 refresh loops without locking the Next.js hydration sequence.

### 3. Socket Connection Auth Sync
*   **Refactor:** Modified [useSocket.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/hooks/useSocket.ts) to read the socket access token dynamically from Zustand state rather than raw `localStorage`.

### 4. Hydration Route Guards
*   **Refactor:** Updated [dashboard-layout.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/components/layout/dashboard-layout.tsx) with a Zustand rehydration loader. It blocks page rendering and route redirection until native preferences storage has hydrated into memory.
*   **Result:** Resolves layout/redirect flickering. Authenticated users are automatically redirected from the landing/auth pages straight to `/feed`, and unauthorized users are routed back to `/auth/login`.

---

## 🚀 Phase 2 — Supabase Social Logins (Google, Discord, Steam)

### 1. Database Schema Update
*   **Prisma Change:** Added `APPLE` to the `AccountProvider` enum inside [schema.prisma](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/server/prisma/schema.prisma) to support future Apple Login.
*   **Sync:** Ran `npx prisma db push` to push modifications to the live Supabase PostgreSQL database.

### 2. Backend Verification API
*   **Controller:** Exposed a new `POST /auth/social-login` route in [auth.routes.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/server/src/routes/auth.routes.ts) and created its handler in [auth.controller.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/server/src/controllers/auth.controller.ts).
*   **Verification Service:** Added `socialLogin` token verification inside [auth.service.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/server/src/services/auth.service.ts). It:
    *   Decodes and verifies the Supabase OAuth JWT using project settings (`SUPABASE_JWT_SECRET`).
    *   Finds or automatically registers new user profiles based on verified emails/UIDs.
    *   Generates the standard GamerHub App token pair and sessions.

### 3. Frontend Client Integration
*   **Supabase Client wrapper:** Initialized the Supabase client inside [supabase.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/lib/supabase.ts) with `persistSession: false` since session persistence is handled by the app's native Zustand store.
*   **OAuth Buttons:** Hooked up buttons in [login/page.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/app/auth/login/page.tsx) and [register/page.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/app/auth/register/page.tsx) to trigger the Supabase OAuth provider flow.
*   **Callback Handler:** Updated [callback/page.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/app/auth/callback/page.tsx) with a Suspense boundary to read sessions from hash/query variables, communicate with the backend, and automatically log the user in.

---

## 🔗 Connect Button Flow Fixes

### 1. Backend Relationship Resolution
*   **Update:** Modified `getProfile` inside [profile.controller.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/server/src/controllers/profile.controller.ts) to verify relationship states directly when loading another user's profile.
*   **Output:** Returns `friendshipStatus` as `'friends'`, `'pending'`, or `null` matching incoming and outgoing requests correctly without the client needing extra lookup cycles.

### 2. Frontend State Machine & Aesthetics
*   **Update:** Overwrote action buttons inside [page.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/app/profile/[username]/page.tsx):
    *   **Unconnected (`friendStatus === null`):** Displays a premium styled `gradient` **Connect** button. The "Message" button is hidden.
    *   **Pending request (`friendStatus === 'pending'`):** Displays a disabled **Pending** button with a loading indicator.
    *   **Connected (`friendStatus === 'friends'`):** Hides the Connect button, renders a stunning green `<Badge>` labeled **Connected** with a `UserCheck` icon, and displays the **Message** button to open the chat window directly.

---

## 📝 User Posts on Profile Fixes

### 1. PostCard Integration
*   **Update:** Replaced the profile tab's simplified posts display in [page.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/app/profile/[username]/page.tsx) with the fully-featured `PostCard` component.
*   **Natively Supported Media:**
    *   **Images:** Rendered in beautiful custom layouts using responsive aspect ratios.
    *   **Videos:** Direct playback with controls in a glass card layout.
    *   **Text posts:** Auto-formatted paragraphs and links.
    *   **Polls:** Displays options, voting counters, and animated percentages.

### 2. Global Query Synced Updates
*   **Update:** Configured [post-card.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/components/post/post-card.tsx) to automatically invalidate the `['profile-posts']` query key when a user likes, comments, or deletes a post.
*   **Result:** All changes, stats, counts, and comments are synchronized instantly in the UI.

---

## 🎥 Video Upload & Player Optimizations

### 1. Supported Format Extensions
*   Updated the post upload logic to support `.mov` files alongside standard `.mp4` and `.webm` formats inside the media filter.

### 2. Real-Time Upload Progress
*   Configured Axios upload progress tracking (`onUploadProgress`) inside [create-post.tsx](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/components/post/create-post.tsx) to capture upload progress in real-time.
*   **UI Progress Indicator**: Displays an animated progress bar inside the composer when uploading.

### 3. Dynamic Thumbnail Generation
*   **Canvas-Based local generator**: Added dynamic seek-and-extract canvas frame capturing inside the composer on local file selections. It generates a preview thumbnail immediately.
*   **Cloudinary-Based remote poster**: Automatically generates video posters from Cloudinary-hosted URLs on the fly for the player poster attribute.
*   **Hover Video Previews**: Custom hover and loading overlays with play buttons added to composer media item selectors.

---

## 🔖 Saved Posts Refactoring

### 1. Zustand Reactivity Upgrade
*   **Refactor:** Converted [useSavedPosts.ts](file:///C:/Users/jinal/OneDrive/Desktop/Gamerhub/Gamerhub/web/src/hooks/useSavedPosts.ts) from independent local hook states to a single global reactive Zustand store with storage persistence middleware.
*   **Result:** Toggling bookmarks inside feed items now instantly and reactively updates counts and lists across the sidebar, mobile drawer, and Saved Posts dashboard without manual page refreshes.

### 2. Layout View Modes (Grid / List)
*   **Grid View:** Displays a media-first Pinterest/Instagram-style visual grid. Renders video badges on clips, author profiles, and post engagement counts (likes and comments) on hover. If a saved post does not have media, it is automatically rendered as a glassmorphic gradient card with clean typography.
*   **List View:** Renders the full `PostCard` layout inline with comment trees and poll interactions.

### 3. Actions & Navigation
*   **Direct Unbookmarking:** Integrated a quick `Trash2` click action overlay in the grid cell to instantly remove items from the collection.
*   **Opening Original Thread:** Added an `Open Post` action linking directly to `/feed?post=${post.id}` to view threads, votes, and replies in context.
