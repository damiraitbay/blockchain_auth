import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { Web3AuthProvider } from './context/Web3AuthContext.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <Web3AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                className: '!bg-surface-raised !text-content !border !border-border-subtle !shadow-card',
                duration: 4000
              }}
            />
          </BrowserRouter>
        </Web3AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
