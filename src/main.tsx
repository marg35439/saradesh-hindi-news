import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Polyfills for older Android / WebView browsers
if (typeof window !== 'undefined') {
  if (typeof (window as any).globalThis === 'undefined') {
    (window as any).globalThis = window;
  }
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
