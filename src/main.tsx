import { ClerkProvider } from '@clerk/react';
import { Clerk } from '@clerk/clerk-js';
import { ui } from '@clerk/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_dW5pdGVkLW1vbmtleS02OTUyLmNsZXJrLmFjY291bnRzLmRldiQ';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      Clerk={Clerk as any}
      ui={ui as any}
      appearance={{
        variables: {
          colorPrimary: '#4F46E5',
          borderRadius: '0.75rem',
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);