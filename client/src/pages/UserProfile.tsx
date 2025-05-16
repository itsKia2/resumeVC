import { SignedIn, SignedOut, UserProfile as ClerkUserProfile } from "@clerk/clerk-react";
import { SignInAlert } from "@/components/ui/SignInAlert";

const UserProfile = () => {
  return (
    <div className="p-6">
      <SignedIn>
        <ClerkUserProfile />
      </SignedIn>

      <SignedOut>
        <SignInAlert />
      </SignedOut>
    </div>
  );
};

export default UserProfile;
