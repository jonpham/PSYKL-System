import './styles/tokens.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { applyStoredPreferences } from './preferences/bootstrap';
import { Root } from './Root';
import { registerPageSyncTriggers } from './sync/page-triggers';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root in index.html');
}

void applyStoredPreferences();
registerPageSyncTriggers();
registerServiceWorker();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Root />
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
