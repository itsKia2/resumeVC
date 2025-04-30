"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react"

const Example: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useUser()

  const handleSetOnboardingFalse = async () => {
    if (!user || isUpdating) return

    try {
      setIsUpdating(true)

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingComplete: false }),
      });

      if (response.ok) {
        alert('onboardingComplete set to false successfully')

        // Force reload the user object to get the updated metadata
        await user.reload()

        // Redirect to force the onboarding flow to trigger
        window.location.href = '/'
      } else {
        const errorData = await response.json()
        alert(`Failed to update onboardingComplete: ${errorData.error}`)
      }
    } catch (err) {
      alert('An error occurred while updating onboardingComplete')
    } finally {
      setIsUpdating(false)
    }
  }

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

        <div className="flex items-center gap-4">
          <Button
            variant="destructive"
            onClick={handleSetOnboardingFalse}
            className="w-40"
          >
            Set Onboarding False
          </Button>
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

export default Example
