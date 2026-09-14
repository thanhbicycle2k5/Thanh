import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerNotificationWorker } from './lib/notification';

const ENABLE_BACKGROUND_PUSH_NOTIFICATIONS = false;

if ('serviceWorker' in navigator && ENABLE_BACKGROUND_PUSH_NOTIFICATIONS) {
  registerNotificationWorker().catch((error) => {
    console.warn('Offline service worker registration failed:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// Deployment trigger at Sun Aug  2 10:54:18 UTC 2026
// Vercel deployment triggered at 1785668327
