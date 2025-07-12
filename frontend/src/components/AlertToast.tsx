// frontend/src/components/AlertToast.tsx
import React from "react";

interface AlertToastProps {
  type?: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export default function AlertToast({
  type = "info",
  message,
  onClose,
}: AlertToastProps) {
  const colors: { [key in "error" | "success" | "info"]: string } = {
    error: "text-red-400",
    success: "text-green-400",
    info: "text-blue-400",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 bg-background-card border border-border`}
    >
      <span className={`flex items-center ${colors[type]}`}>
        {type === "error" && (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        {type === "success" && (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {type === "info" && (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-center text-white font-medium break-words whitespace-normal">
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
