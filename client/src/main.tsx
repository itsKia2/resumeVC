import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import OnboardingWrapper from './lib/onboardingWrapper';
import Router from './router';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <OnboardingWrapper>
          <Router />
        </OnboardingWrapper>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
