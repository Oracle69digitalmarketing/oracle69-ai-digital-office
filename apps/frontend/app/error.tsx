"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-8 text-center bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
      <p className="mt-2 text-gray-600">Our team has been notified. Please try again.</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-md bg-indigo-600 px-6 py-2 text-white font-medium hover:bg-indigo-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
