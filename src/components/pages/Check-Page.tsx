// components/TestButton.tsx
"use client";

import { useState } from "react";

export function TestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://affiliate-marketing-luus.vercel.app/api/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h2 className="text-lg font-bold mb-2">Database Test</h2>
      <button
        onClick={testDatabase}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Testing..." : "Test User Creation"}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
