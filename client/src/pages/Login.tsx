import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <SignIn path="/login" routing="path" signUpUrl="/register" />
    </div>
  );
}
