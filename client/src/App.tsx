// src/App.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function App() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center p-6 gap-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white min-h-screen min-w-full overflow-hidden">
      <h1 className="text-4xl font-extrabold drop-shadow-lg">Welcome to Resume Manager</h1>
      <p className="text-lg text-center max-w-lg">
        Organize your resumes and land your dream job with ease.
        </p>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transition-transform"
        >
          Get Started
        </button>
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg transition-all duration-300 ease-out ${
              showDropdown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
            }`}
          >            
          <button
            onClick={() => {
              navigate("/categories");
              setShowDropdown(false);
            }}
            className="block w-full px-4 py-2 text-center hover:bg-blue-100 rounded-lg transition"
          >
            Resume Collections
          </button>
          <button
            onClick={() => {
              navigate("/job-analysis");
              setShowDropdown(false);
            }}
            className="block w-full px-4 py-2 text-center hover:bg-blue-100 rounded-lg transition"
          >
            Job Analysis
          </button>
          </div>
      </div>
    </main>
  );
}