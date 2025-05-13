import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import React, { useState } from "react";
import { SignInAlert } from "@/components/ui/SignInAlert";

export default function CollectionView() {
  const [file, setFile] = useState<File | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [category, setCategory] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    /* let file = e.target.files?.[0] || null; */
    /* const fileURL = URL.createObjectURL(file);
     * window.open(fileURL, "_blank"); // or embed in an <iframe> */
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("category", category);

    setIsLoading(true);
    try {
      const token = await user.id;

      const response = await fetch("/api/resume-upload", {
        method: "POST",
        body: formData,
      });

      let confirmation = await response.json();
      setResponseText(confirmation.message);
    } catch (err: any) {
      console.error("Upload error:", err);
      setResponseText("Error uploading file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <SignedOut>
        <SignInAlert />
      </SignedOut>
      <SignedIn>
        <div className="p-2 border rounded-lg shadow-sm max-w-md mx-auto text-sm">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">Hi, {user?.firstName}!</p>
            {/* category inputting */}
            <label htmlFor="category" className="text-sm font-medium">
              Enter Category <span className="text-red-500">*</span>
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Finance, Accounting, etc."
              className="border rounded px-2 py-1"
              required
            />

            {/* file inputting */}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="text-xs"
            />

            <Button
              size="sm"
              onClick={handleUpload}
              disabled={!file || isLoading}
            >
              {isLoading ? "Uploading..." : "Upload"}
            </Button>

            {responseText && (
              <div className="mt-2 p-1 border rounded max-h-64 overflow-auto whitespace-pre-wrap">
                {responseText}
              </div>
            )}
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Your Resume Collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold">Software Engineer</h3>
              <p className="text-sm text-gray-600">3 versions</p>
              <Button className="mt-2">View</Button>
            </CardContent>
          </Card>
          {/* Repeat for mock data or loop through fetched resumes */}
        </div>
      </SignedIn>
    </div>
  );
}
