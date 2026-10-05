import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Developer Console Branding (BestCyniX Dev)
console.log(
  `%c⚡ BESTCYNIX DEV • FULL-STACK ENGINEERING ⚡`,
  'color: #38bdf8; background: #0f172a; font-size: 14px; font-weight: 900; padding: 6px 12px; border-radius: 8px; border: 1px solid #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.5);'
);
console.log('ยินดีต้อนรับสู่ระบบของ BestCyniX Dev • สนใจพัฒนาระบบหรือร่วมงาน ติดต่อได้ที่ bestcynix@gmail.com');
console.log('Powered by นายพงศ์ภรณ์ ทองศิริ • 68011211206 · สาขาวิทยาการสารสนเทศ · เทคโนโลยีสารสนเทศ');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
