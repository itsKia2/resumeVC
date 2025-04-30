import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only run when user is loaded and not already processing
    if (!isLoaded || !user || isProcessing) return;

    const checkAndCreateUser = async () => {
      // If onboarding is already complete, do nothing
      if (user.publicMetadata?.onboardingComplete === true) return;

      // Mark as processing to prevent duplicate calls
      setIsProcessing(true);

      try {
        // Create user in our database and mark onboarding complete
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName
          }),
        });

        if (response.ok) {
          // Update user in memory so we don't need to refresh
          await user.reload();
        }
      } catch (error) {
        console.error('Error during user creation:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    checkAndCreateUser();
  }, [user, isLoaded, isProcessing]);

  return <>{children}</>;
};

export default OnboardingWrapper;