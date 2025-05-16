import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import useSWRMutation from 'swr/mutation';

// Mutation function for creating a user
async function createUserFetcher(url: string, { arg }: { arg: { email?: string | null; name?: string | null } }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  
  return response.json();
}

const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  
  // Setup the mutation hook
  const { 
    trigger: createUser, 
    isMutating: isProcessing 
  } = useSWRMutation('/api/user', createUserFetcher);

  useEffect(() => {
    // Only run when user is loaded and not already processing
    if (!isLoaded || !user || isProcessing) return;
    
    // If onboarding is already complete, do nothing
    if (user.publicMetadata?.onboardingComplete === true) return;
    
    // Create user in our database and mark onboarding complete
    const checkAndCreateUser = async () => {
      try {
        await createUser({
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName
        });
        
        // Update user in memory so we don't need to refresh
        await user.reload();
      } catch (error) {
        console.error('Error during user creation:', error);
      }
    };

    checkAndCreateUser();
  }, [user, isLoaded, isProcessing, createUser]);

  return <>{children}</>;
};

export default OnboardingWrapper;