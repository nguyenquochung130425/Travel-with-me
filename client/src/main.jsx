import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Khóa zoom tối đa 100% & ngăn chặn zoom ngoài ý muốn (Trackpad pinch, Ctrl + Scroll, Ctrl + '+')
if (typeof window !== 'undefined') {
  // 1. Ngăn chặn Ctrl + cuộn chuột và Trackpad pinch-to-zoom (nguyên nhân chính gây hiện popup zoom 100%)
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 2. Ngăn chặn phím tắt phóng to quá 100% (Ctrl/Cmd + '+' hoặc '=')
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '+' ||
          e.key === '=' ||
          e.key === 'Add' ||
          e.code === 'Equal' ||
          e.code === 'NumpadAdd'
        ) {
          e.preventDefault();
        }
      }
    },
    { capture: true }
  );

  // 3. Ngăn chặn thao tác chụm 2 ngón tay (multi-touch pinch) trên màn hình cảm ứng
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 4. Ngăn chặn thao tác double-tap để zoom trên thiết bị di động
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // 5. Ngăn chặn cử chỉ thu phóng Safari / iOS gestures
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
