import { SignedIn, SignedOut, SignInButton, UserProfile as ClerkUserProfile } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const UserProfile = () => {
  return (
    <div className="p-6">
      <SignedIn>
        <ClerkUserProfile />
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center mt-10">
          <p className="mb-4 text-lg">Please sign in to view your profile.</p>
          <SignInButton mode="modal">
            <Button variant="default">Sign In</Button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
};

export default UserProfile;
