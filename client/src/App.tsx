"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"

export default function ApiExample() {
  const [message, setMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-end mb-6">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline">Sign In</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={async () => {
              const response = await fetch("/api/hello")
              const data = await response.json()
              setMessage(data.message)
            }}
            className="w-40"
          >
            Fetch Message
          </Button>
          {message && <span className="text-green-600">{message}</span>}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={async () => {
              const response = await fetch("/api/userId")
              const data = await response.json()
              data.userId ? setUserId(data.userId) : setUserId(data.error)
            }}
            className="w-40"
          >
            Fetch User ID
          </Button>
          {userId && <span className="text-blue-600">{userId}</span>}
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  )
}
