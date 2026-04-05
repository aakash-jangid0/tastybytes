import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import diagnosticService from './utils/diagnosticService.js';

// Start capturing errors
diagnosticService.startCapturing();

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', {message, source, lineno, colno, error});
  return false; // Let default error handling continue
};

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Create root once
const root = createRoot(document.getElementById('root')!);

// Render with error handling
try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Error rendering application:', error);
  
  // Fallback UI for critical errors
  root.render(
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>The application failed to load properly. Please try refreshing the page.</p>
      <pre style={{ textAlign: 'left', backgroundColor: '#f8f8f8', padding: '15px', borderRadius: '5px' }}>
        Error: {error.message}
      </pre>
    </div>
  );
}
