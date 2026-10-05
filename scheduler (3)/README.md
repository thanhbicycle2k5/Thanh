<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Task2Goal — Professional Weekly Planner

This contains everything you need to run your app locally.

## Features
- Familiar Excel-like grid interface
- Cloud synchronization with Firebase
- Local-first storage with automatic migration
- Pomodoro timer for focused work
- Synthesized environmental sounds for notifications
- Personalized health tips
- Responsive design for mobile and desktop

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Scheduly AI

The Scheduly AI popup uses OpenRouter's `openrouter/free` router through the server-side `/api/scheduly-ai` function. The settings label is "Free online AI" ("AI trực tuyến miễn phí"); it is not Gemini and it never configures a paid model or paid fallback.

Set these Vercel Environment Variables for the deployed API:

- `OPENROUTER_API_KEY`: OpenRouter key, stored only on the server.
- AI does not require Scheduly Google sign-in and never receives Google credentials or tokens. The API allows up to 20 routed AI requests per client IP per UTC day per warm server instance; dictionary lookups and simple task counts do not consume this limit. Vercel serverless memory is best-effort, so a shared persistent rate-limit store would be needed for a strict global quota.

When the free model pool or quota is unavailable, Scheduly shows a friendly unavailable message and the rest of the app continues to work. Task context is reduced to a small set of relevant task titles, dates, times, durations, and completion state.

### Android native AI app

The browser-based WebGPU provider is experimental. For native on-device inference, use the companion app in `../android-app`, which wraps the deployed Scheduly site and serves chat requests through `llama.rn`/llama.cpp. The app downloads the Apache-2.0 SmolLM3 3B Q4_K_M GGUF (about 1.9 GB) into its private storage on first use, then reuses it on later launches. Build a custom Android development/release binary; Expo Go cannot load llama.cpp native code.

Set `EXPO_PUBLIC_SCHEDULY_URL` at build time if the app should open a different deployed Scheduly origin. Native chat runs locally and is not sent to the cloud AI endpoint.
