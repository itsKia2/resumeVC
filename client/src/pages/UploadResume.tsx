"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";

const UploadResume: React.FC = () => {
	const [file, setFile] = useState<File | null>(null);
	const [responseText, setResponseText] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { user } = useUser();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFile(e.target.files?.[0] || null);
	};

	const handleUpload = async () => {
		if (!file || !user) return;

		const formData = new FormData();
		formData.append("pdf", file);

		setIsLoading(true);
		try {
			//const token = await user.id;

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
		<div className="p-4 border rounded-xl shadow-md max-w-xl mx-auto">
			<SignedOut>
				<SignInButton mode="modal">
					<Button variant="default">Sign in to upload</Button>
				</SignInButton>
			</SignedOut>

			<SignedIn>
				<div className="flex flex-col gap-4">
					<p className="text-sm text-muted-foreground">
						Hello, {user?.firstName}! Upload a PDF to extract its contents.
					</p>
					<input
						type="file"
						accept="application/pdf"
						onChange={handleFileChange}
					/>
					<Button onClick={handleUpload} disabled={!file || isLoading}>
						{isLoading ? "Uploading..." : "Upload PDF"}
					</Button>

					{responseText && (
						<div className="mt-4 p-2 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-auto">
							{responseText}
						</div>
					)}
				</div>
			</SignedIn>
		</div>
	);
};

export default UploadResume;
