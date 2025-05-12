// src/components/ui/layout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 bg-white border-b shadow flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-black hover:text-blue-600 transition">
          Resume Manager
        </Link>
        <nav className="flex gap-4 items-center">
          <Link to="/collections" className="text-blue-600 hover:underline">Resume Collections</Link>
          <Link to="/job-analysis" className="text-blue-600 hover:underline">Job Analysis</Link>
          <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
