// src/App.tsx

export default function App() {
  return (
    <main className="flex flex-col items-center justify-center p-6 gap-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white min-h-screen">
      <h1 className="text-4xl font-extrabold">Welcome to Resume Manager</h1>
      <p className="text-lg">
        Organize your resumes and land your dream job with ease.
      </p>
      <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition">
        Get Started
      </button>
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
