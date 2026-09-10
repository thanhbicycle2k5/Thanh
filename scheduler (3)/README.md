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
- `FIREBASE_WEB_API_KEY`: the Firebase Web API key used to validate signed-in Firebase ID tokens. This key is not an AI credential.

AI requires a signed-in Scheduly user. The API allows up to 20 routed AI requests per user per UTC day per warm server instance; dictionary lookups and simple task counts do not consume this limit. Vercel serverless memory is best-effort, so a shared persistent rate-limit store would be needed for a strict global quota.

When the free model pool or quota is unavailable, Scheduly shows a friendly unavailable message and the rest of the app continues to work. Task context is reduced to a small set of relevant task titles, dates, times, durations, and completion state.
