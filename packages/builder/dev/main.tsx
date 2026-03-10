import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import BuilderApp from '@builder/core';
import { ThemeProvider } from '@ui/blocks';
import './index.css';
import './IconStyles.css';

// Add default URL params for builder (projectId and pageId are required for section toolbar)
const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.has('projectId')) {
  urlParams.set('projectId', 'dev-project');
}
if (!urlParams.has('pageId')) {
  urlParams.set('pageId', 'dev-page');
}
if (window.location.search !== `?${urlParams.toString()}`) {
  window.history.replaceState({}, '', `?${urlParams.toString()}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
          <BuilderApp />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
