import React from "react";
import { useRouter } from "next/router";
import { Ghost } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="mb-6">
          {/* System-style illustration (e.g., ghost icon) */}
          <Ghost className="w-24 h-24 text-primary drop-shadow-lg" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Oops! The page you are looking for does not exist or has been moved.
          <br />
          Please check the URL or return to the homepage.
        </p>
        <button
          className="btn-primary px-6 py-2 text-lg"
          onClick={() => router.push("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
