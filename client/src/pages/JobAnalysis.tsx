import { Button } from "@/components/ui/button";
import { SignInAlert } from "@/components/ui/SignInAlert";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

import useSWRMutation from "swr/mutation";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type Resume = {
  name: String;
  link: String;
};

export default function JobAnalysis() {
  const { user } = useUser();
  const [jobDesc, setJobDesc] = useState<string>("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    console.log("Page has been updated or loaded");

    const fetchResumes = async () => {
      try {
        const res = await fetch("/api/get-user-resume-names");
        const data = await res.json();
        if (res.ok) {
          setResumes(data.resumes);
        } else {
          console.error("Error:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch resumes:", err);
      }
    };

    fetchResumes();
  }, []);

  async function jobUploadFetcher(url: string, { arg }: { arg: string }) {
    // unreachable code
    if (!selectedResume || !jobDesc) {
      alert("Please select a resume and enter a job description.");
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobDescription: arg,
        resumeName: selectedResume.name,
        resumeLink: selectedResume.link,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to upload job description");
    }

    const data = await res.json();
    if (res.ok) {
      setAnalysisResult(data.analysis);
      /* setAnalysisResult("SUCCESS"); */
    } else {
      setAnalysisResult("Something went wrong. Please try again.");
    }
  }

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
          <h2 className="text-2xl font-bold mb-4">Resume Job Matching</h2>

          {/* Resume Dropdown */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedResume ? selectedResume.name : "Select Resume"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {resumes.map((resume, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => setSelectedResume(resume)}
                  >
                    {resume.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
              disabled={isMutating || !selectedResume || !jobDesc}
            >
              {isMutating ? "Uploading..." : "Analyze"}
            </Button>

            {/* This is where the response of AI will be shown*/}
            {analysisResult && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
                <h4 className="font-semibold mb-2">Analysis:</h4>
                {analysisResult}
              </div>
            )}

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
