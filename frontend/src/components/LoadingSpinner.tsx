import React from "react";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  text = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`min-h-[200px] flex items-center justify-center w-full ${className}`}
    >
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-400">{text}</p>
      </div>
    </div>
  );
}
