import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Debug: Verify the root element exists
const rootElement = document.getElementById('root');
console.log('Root element found:', !!rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error('Root element not found!');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">Root element not found!</h1>';
}
