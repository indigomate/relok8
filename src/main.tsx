import { ClerkProvider, useAuth } from '@clerk/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import App from './App';
import { configureBackend } from './lib/backend';
import './index.css';

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const url = import.meta.env.VITE_CONVEX_URL;
const root = createRoot(document.getElementById('root')!);
if (!key || !url || key.includes('YOUR_') || !url.startsWith('https://')) {
  root.render(<main style={{ maxWidth: 640, margin: '12vh auto', padding: 24 }}><h1>Relok8 setup required</h1><p>Configure the Clerk and Convex development environment to start the app. See README.md.</p></main>);
} else {
  const client = new ConvexReactClient(url);
  configureBackend(client);
  root.render(<StrictMode><ClerkProvider publishableKey={key} afterSignOutUrl="/">
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <App />
    </ConvexProviderWithClerk>
  </ClerkProvider></StrictMode>);
}
