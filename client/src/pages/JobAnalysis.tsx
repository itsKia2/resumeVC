import { Button } from "@/components/ui/button";
import { SignInAlert } from "@/components/ui/SignInAlert";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

async function jobUploadFetcher(url: string, { arg }: { arg: string }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobDescription: arg }),
  });

  if (!res.ok) {
    throw new Error("Failed to upload job description");
  }

  return res.json();
}

export default function JobAnalysis() {
  const { user } = useUser();
  const [jobDesc, setJobDesc] = useState<string>("");

  // NEW: SWR mutation hook
  const {
    trigger: uploadJobDesc,
    isMutating,
    error,
  } = useSWRMutation("/api/job-description", jobUploadFetcher, {
    onSuccess: () => {
      setJobDesc(""); // clear input on success
      alert("Job description uploaded successfully!");
    },
  });

  const handleUpload = () => {
    if (jobDesc.trim()) {
      uploadJobDesc(jobDesc);
    } else {
      alert("Please paste a job description before uploading.");
    }
  };

  return (
    <>
      <SignedOut>
        <SignInAlert />
      </SignedOut>
      <SignedIn>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">
            Resume Timeline & Job Matching
          </h2>

          <section className="mb-6">
            <h3 className="text-lg font-semibold">Revision History</h3>
            <div className="mt-2 space-y-2">
              {/* Replace with dynamic content */}
              <div className="p-4 border rounded-md shadow-sm bg-white">
                Initial Draft - Jan 2024
              </div>
              <div className="p-4 border rounded-md shadow-sm bg-white">
                Tailored for SWE - Feb 2024
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Paste Job Listing</h3>
            <Input
              className="w-full h-32 p-3 border rounded-md"
              placeholder="Paste job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
            <Button
              className="mt-4"
              onClick={handleUpload}
              disabled={isMutating}
            >
              {isMutating ? "Uploading..." : "Find Best Resume Match"}
            </Button>
            {error && (
              <p className="text-red-500 mt-2">
                Failed to upload job description. Please try again.
              </p>
            )}
          </section>
        </div>
      </SignedIn>
    </>
  );
}
