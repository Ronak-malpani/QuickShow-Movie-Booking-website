// File: src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {/* AppProvider MUST wrap App */}
        <AppProvider> 
          <App />
        </AppProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);