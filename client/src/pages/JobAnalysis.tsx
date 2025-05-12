import { Button } from "@/components/ui/button";

export default function JobAnalysis() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Resume Timeline & Job Matching</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Revision History</h3>
        <div className="mt-2 space-y-2">
          {/* Replace with dynamic content */}
          <div className="p-4 border rounded-md shadow-sm bg-white">Initial Draft - Jan 2024</div>
          <div className="p-4 border rounded-md shadow-sm bg-white">Tailored for SWE - Feb 2024</div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Paste Job Listing</h3>
        <textarea className="w-full h-32 p-3 border rounded-md" placeholder="Paste job description here..." />
        <Button className="mt-4">Find Best Resume Match</Button>
      </section>
    </div>
  );
}
