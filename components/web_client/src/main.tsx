import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { registerPageSyncTriggers } from './sync/page-triggers';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root in index.html');
}

registerPageSyncTriggers();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
