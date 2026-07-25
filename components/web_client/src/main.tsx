import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { registerPageSyncTriggers } from './sync/page-triggers';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root in index.html');
}

registerPageSyncTriggers();
registerServiceWorker();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Failed to register PSYKL Service Worker', error);
    });
  });
}
