// src/App.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function App() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center p-6 gap-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white h-screen overflow-hidden">
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
        {showDropdown && (
          <div className="absolute top-full mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg">
            <button
              onClick={() => navigate("/collections")}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
            >
              Go to Resume Collections
            </button>
            <button
              onClick={() => navigate("/job-analysis")}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
            >
              Go to Job Analysis
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// export default function App() {
//   return (
//     <main className="flex flex-col items-center justify-center p-6 gap-6">
//       <h1 className="text-2xl font-bold">Welcome to Resume Manager</h1>
//       <p className="text-gray-700">
//         Navigate using the menu above to manage your resumes and collections.
//       </p>
//     </main>
//   );
// }
