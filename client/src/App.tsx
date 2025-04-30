import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

function App() {
  const [message, setMessage] = useState<string | null>(null)

  return (
    <>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <div>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
          const response = await fetch('/api/hello');
          if (!response.ok) {
            throw new Error('Failed to fetch hello message from flask');
          }
          const data = await response.json();
          setMessage(data.message);
              } catch (error) {
          console.error('Error fetching helo message from flask:', error);
              }
            }}
          >
            Fetch hello message from flask
          </Button>
          {message && <p>Message: {message}</p>}
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
