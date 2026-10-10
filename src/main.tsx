import { ClerkProvider } from '@clerk/react';
import { Clerk } from '@clerk/clerk-js';
import { ui } from '@clerk/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App.tsx';
import './index.css';

const LIVE_PUBLISHABLE_KEY = 'pk_live_Y2xlcmsucmVsb2s4Lm9ubGluZSQ';
const DEV_PUBLISHABLE_KEY = 'pk_test_dW5pdGVkLW1vbmtleS02OTUyLmNsZXJrLmFjY291bnRzLmRldiQ';

// Detect whether running on the production domain (relok8.online) or preview/dev
const isProductionDomain = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'relok8.online' || window.location.hostname.endsWith('.relok8.online'));

const PUBLISHABLE_KEY = isProductionDomain
  ? (import.meta.env.VITE_CLERK_PRODUCTION_KEY || LIVE_PUBLISHABLE_KEY)
  : (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEV_PUBLISHABLE_KEY);

// ---------------------------------------------------------------------------
// Convex Backend Initialization
// Reads VITE_CONVEX_URL from environment / .env.local
// ---------------------------------------------------------------------------
const convexUrl = 
  import.meta.env.VITE_CONVEX_URL || 
  'https://happy-otter-123.convex.cloud';

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
        Clerk={Clerk as any}
        ui={ui as any}
        appearance={{
          variables: {
            colorPrimary: '#4F46E5',
            borderRadius: '0.75rem',
          },
          elements: {
            footer: 'hidden',
            footerAction: 'hidden',
            footerPages: 'hidden'
          }
        }}
      >
        <App />
      </ClerkProvider>
    </ConvexProvider>
  </StrictMode>,
);
