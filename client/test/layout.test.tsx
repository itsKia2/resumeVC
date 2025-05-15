import { test, expect, mock } from "bun:test";
import { screen, render } from "@testing-library/react";
import Layout from "../src/components/ui/Layout";
import { MemoryRouter } from "react-router-dom";
import React from 'react';

// Create our test wrapper component that provides the necessary context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
}

// Simple test to verify the Layout component renders
test("Layout component renders with the title", async () => {
  // Override the imported components
  // Note: This is a simplified test that ignores Clerk's authentication components
  mock.module("@clerk/clerk-react", () => ({
    SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
    SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
    SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="sign-in-button">{children}</div>,
    UserButton: () => <div data-testid="user-button" />
  }));

  render(
    <TestWrapper>
      <Layout />
    </TestWrapper>
  );

  // Check for the title
  const title = screen.getByText("Resume Manager");
  expect(title).toBeDefined();
  expect(title.tagName.toLowerCase()).toBe("a");
  expect(title.getAttribute("href")).toBe("/");
});

// Test for checking the header exists
test("Layout has a header element", async () => {
  render(
    <TestWrapper>
      <Layout />
    </TestWrapper>
  );

  // Check for header element
  const header = document.querySelector("header");
  expect(header).toBeDefined();
});

// Test for navigation links when signed in
test("Layout shows navigation links when signed in", async () => {
  // Mock the SignedIn component to render its children
  mock.module("@clerk/clerk-react", () => ({
    SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SignedOut: () => null,
    SignInButton: () => null,
    UserButton: () => <div data-testid="user-button" />
  }));

  render(
    <TestWrapper>
      <Layout />
    </TestWrapper>
  );

  // Check for navigation links
  const resumesLink = screen.getByText("Resumes");
  expect(resumesLink).toBeDefined();
  expect(resumesLink.getAttribute("href")).toBe("/categories");
  
  const jobAnalysisLink = screen.getByText("Job Analysis");
  expect(jobAnalysisLink).toBeDefined();
  expect(jobAnalysisLink.getAttribute("href")).toBe("/job-analysis");
  
  const profileLink = screen.getByText("Profile");
  expect(profileLink).toBeDefined();
  expect(profileLink.getAttribute("href")).toBe("/profile");
});