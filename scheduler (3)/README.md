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

The Scheduly AI popup uses OpenRouter's `openrouter/free` router through the server-side `/api/scheduly-ai` function. It never configures a paid model or paid fallback.

Set these Vercel Environment Variables for the deployed API:

- `OPENROUTER_API_KEY`: OpenRouter key, stored only on the server.
- AI does not require Scheduly Google sign-in and never receives Google credentials or tokens. The API allows up to 20 routed AI requests per client IP per UTC day per warm server instance; dictionary lookups and simple task counts do not consume this limit. Vercel serverless memory is best-effort, so a shared persistent rate-limit store would be needed for a strict global quota.

When the free model pool or quota is unavailable, Scheduly shows a friendly unavailable message and the rest of the app continues to work. Task context is reduced to a small set of relevant task titles, dates, times, durations, and completion state.

### On-device AI in Android Chrome

Choose **On-device AI (experimental)** under Settings → AI Provider, then tap **Download model**. Scheduly downloads the Qwen3 0.6B WebLLM model the first time and stores its files in browser storage. On later launches, the app checks that cache and offers **Load saved model**; it must initialize the model into WebGPU again for each browser session, but should reuse cached files instead of downloading them again. Browser storage may be evicted or cleared, in which case the model must be downloaded again. It uses a 2,048-token context to reduce GPU memory use on phones. The initial download needs internet; later prompts are processed in the browser and are not sent to the Scheduly AI endpoint.

This option requires a current browser with WebGPU and a secure HTTPS origin. Use the deployed Scheduly site in Chrome on Android; a plain `http://<computer-ip>` development URL does not meet the secure-context requirement. Model loading and inference need substantial device memory, can be slow or unsupported on some devices, and browser storage may be cleared by Android. If WebGPU reports a lost device or unmapped buffer, close other apps/tabs, reload Scheduly, and try again; the graphics driver may not support inference reliably. Ollama and the existing cloud AI options remain available.
