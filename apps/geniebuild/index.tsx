
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress "ResizeObserver loop completed with undelivered notifications" error
// This is a known non-critical issue in some browsers during layout reflows
const suppressResizeObserverErrors = (e: ErrorEvent | PromiseRejectionEvent) => {
  const messages = [
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver'
  ];
  
  const message = (e instanceof ErrorEvent) ? e.message : (e.reason?.message || '');
  
  if (messages.some(msg => message?.includes(msg))) {
    // Suppress the error in the console
    e.stopImmediatePropagation();
    e.preventDefault();
    
    // Also try to hide the development overlay if it exists
    const overlays = [
      'webpack-dev-server-client-overlay-div',
      'webpack-dev-server-client-overlay',
      'vite-error-overlay'
    ];
    overlays.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
};

window.addEventListener('error', suppressResizeObserverErrors);
window.addEventListener('unhandledrejection', suppressResizeObserverErrors);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
